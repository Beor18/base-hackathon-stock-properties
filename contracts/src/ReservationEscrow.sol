// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable, Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

import {IReservationEscrow} from "./interfaces/IReservationEscrow.sol";
import {IStockOracle} from "./interfaces/IStockOracle.sol";

/// @title ReservationEscrow
/// @notice Holds tokenized stocks as a USD-denominated property reservation (a "seña").
/// @dev Lifecycle of a reservation:
///      1. The depositor locks stocks worth at least `coverage x collateral ratio` (createReservation).
///      2. Until the end date (plus the claim window) the beneficiary may file claims. A claim is payable
///         when the depositor accepts it, when the dispute window lapses, or when the arbiter awards it.
///      3. A payable claim is settled in USDC: the escrow sells just enough stock through a router the
///         owner whitelisted, with a minimum price checked against the oracle.
///      4. The remaining stocks always go back to the depositor, on release or when coverage runs out.
///      Time windows and the slippage bound are immutable so the rules of a live reservation never change.
contract ReservationEscrow is IReservationEscrow, Ownable2Step, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint16 private constant BPS = 10_000;
    uint256 private constant WAD = 1e18;
    uint16 public constant MAX_FEE_BPS = 300;
    uint16 public constant MAX_SLIPPAGE_BPS = 1_000;
    uint64 public constant MAX_DURATION = 3650 days;

    IStockOracle public immutable oracle;
    /// @inheritdoc IReservationEscrow
    address public immutable usdc;
    /// @inheritdoc IReservationEscrow
    uint16 public immutable maxSlippageBps;
    /// @notice Time the depositor has to dispute a claim before it becomes payable.
    uint64 public immutable disputeWindow;
    /// @notice Time after the end date during which the beneficiary can still file a claim.
    uint64 public immutable claimWindow;
    /// @notice Time after which the default arbiter may resolve a dispute the chosen arbiter ignored.
    uint64 public immutable arbitrationTimeout;

    uint256 private immutable _usdcScale; // 10 ** (18 - USDC decimals)

    address public defaultArbiter;
    address public treasury;
    /// @notice One-time fee on the coverage amount, charged to the depositor in stock tokens at creation.
    uint16 public feeBps;

    /// @inheritdoc IReservationEscrow
    mapping(address router => bool) public isRouter;

    uint256 public reservationCount;
    /// @notice Live traction counters, kept onchain so anyone can verify them without an indexer.
    uint256 public activeReservationCount;
    uint256 public activeCoverageUsd;

    mapping(uint256 id => Reservation) private _reservations;
    mapping(address account => uint256[]) private _idsByAccount;

    struct Config {
        IStockOracle oracle;
        address usdc;
        uint16 maxSlippageBps;
        uint64 disputeWindow;
        uint64 claimWindow;
        uint64 arbitrationTimeout;
        address defaultArbiter;
        address treasury;
        uint16 feeBps;
    }

    constructor(address owner_, Config memory config) Ownable(owner_) {
        if (address(config.oracle) == address(0) || config.usdc == address(0)) revert ZeroAddress();
        if (config.disputeWindow == 0 || config.claimWindow == 0 || config.arbitrationTimeout == 0) {
            revert InvalidWindow();
        }
        if (config.maxSlippageBps == 0 || config.maxSlippageBps > MAX_SLIPPAGE_BPS) {
            revert InvalidSlippage(config.maxSlippageBps);
        }

        oracle = config.oracle;
        usdc = config.usdc;
        maxSlippageBps = config.maxSlippageBps;
        disputeWindow = config.disputeWindow;
        claimWindow = config.claimWindow;
        arbitrationTimeout = config.arbitrationTimeout;
        _usdcScale = 10 ** (18 - IERC20Metadata(config.usdc).decimals());

        _setDefaultArbiter(config.defaultArbiter);
        _setTreasury(config.treasury);
        _setFee(config.feeBps);
    }

    // ───────────────────────────── Depositor ─────────────────────────────

    /// @inheritdoc IReservationEscrow
    function createReservation(CreateParams calldata params) external nonReentrant returns (uint256 id) {
        address arbiter = params.arbiter == address(0) ? defaultArbiter : params.arbiter;

        if (params.beneficiary == address(0)) revert ZeroAddress();
        if (params.beneficiary == msg.sender || arbiter == msg.sender || arbiter == params.beneficiary) {
            revert InvalidParties();
        }
        if (params.coverageUsd == 0 || params.collateral == 0) revert InvalidAmount();
        if (params.endsAt <= block.timestamp || params.endsAt > block.timestamp + MAX_DURATION) {
            revert InvalidEndDate();
        }

        IStockOracle.Stock memory stock = oracle.getStock(params.token);
        if (!stock.enabled) revert StockNotEnabled(params.token);

        _requireCollateralized(params.token, params.collateral, params.coverageUsd, stock.collateralRatioBps);

        id = ++reservationCount;
        Reservation storage reservation = _reservations[id];
        reservation.depositor = msg.sender;
        reservation.beneficiary = params.beneficiary;
        reservation.arbiter = arbiter;
        reservation.token = params.token;
        reservation.collateral = params.collateral;
        reservation.coverageUsd = params.coverageUsd;
        reservation.createdAt = uint64(block.timestamp);
        reservation.endsAt = params.endsAt;
        reservation.collateralRatioBps = stock.collateralRatioBps;
        reservation.status = Status.Active;
        reservation.propertyRef = params.propertyRef;

        _idsByAccount[msg.sender].push(id);
        _idsByAccount[params.beneficiary].push(id);
        activeReservationCount++;
        activeCoverageUsd += params.coverageUsd;

        IERC20(params.token).safeTransferFrom(msg.sender, address(this), params.collateral);
        _chargeFee(id, params.token, params.coverageUsd);

        emit ReservationCreated(
            id,
            msg.sender,
            params.beneficiary,
            params.token,
            params.collateral,
            params.coverageUsd,
            params.endsAt,
            arbiter,
            params.propertyRef
        );
    }

    /// @inheritdoc IReservationEscrow
    function topUp(uint256 id, uint256 amount) external nonReentrant {
        Reservation storage reservation = _activeReservation(id);
        if (amount == 0) revert InvalidAmount();

        reservation.collateral += amount;
        IERC20(reservation.token).safeTransferFrom(msg.sender, address(this), amount);

        emit CollateralAdded(id, msg.sender, amount);
    }

    /// @inheritdoc IReservationEscrow
    function withdrawExcess(uint256 id, uint256 amount) external nonReentrant {
        Reservation storage reservation = _activeReservation(id);
        if (msg.sender != reservation.depositor) revert NotDepositor();
        if (reservation.claim.status != ClaimStatus.None) revert ClaimInProgress();
        if (amount == 0 || amount > reservation.collateral) revert InvalidAmount();

        uint256 remaining = reservation.collateral - amount;
        uint256 valueUsd = oracle.toUsd(reservation.token, remaining, IStockOracle.PriceUse.Settlement);
        uint256 requiredUsd = _requiredUsd(reservation.coverageUsd, reservation.collateralRatioBps);
        if (valueUsd < requiredUsd) revert InsufficientCollateral(valueUsd, requiredUsd);

        reservation.collateral = remaining;
        IERC20(reservation.token).safeTransfer(reservation.depositor, amount);

        emit ExcessWithdrawn(id, amount);
    }

    /// @inheritdoc IReservationEscrow
    function extendEndDate(uint256 id, uint64 endsAt) external {
        Reservation storage reservation = _activeReservation(id);
        if (msg.sender != reservation.depositor) revert NotDepositor();
        if (endsAt <= reservation.endsAt || endsAt > block.timestamp + MAX_DURATION) revert InvalidEndDate();

        reservation.endsAt = endsAt;

        emit EndDateExtended(id, endsAt);
    }

    /// @inheritdoc IReservationEscrow
    function acceptClaim(uint256 id) external {
        Reservation storage reservation = _activeReservation(id);
        if (msg.sender != reservation.depositor) revert NotDepositor();

        ClaimStatus status = reservation.claim.status;
        if (status != ClaimStatus.Filed && status != ClaimStatus.Disputed) revert NoClaimToAct(status);

        reservation.claim.status = ClaimStatus.Approved;

        emit ClaimAccepted(id);
    }

    /// @inheritdoc IReservationEscrow
    function disputeClaim(uint256 id) external {
        Reservation storage reservation = _activeReservation(id);
        if (msg.sender != reservation.depositor) revert NotDepositor();

        Claim storage claim = reservation.claim;
        if (claim.status != ClaimStatus.Filed) revert NoClaimToAct(claim.status);
        if (block.timestamp > claim.filedAt + disputeWindow) revert DisputeWindowClosed();

        claim.status = ClaimStatus.Disputed;
        claim.disputedAt = uint64(block.timestamp);

        emit ClaimDisputed(id);
    }

    // ───────────────────────────── Beneficiary ─────────────────────────────

    /// @inheritdoc IReservationEscrow
    function fileClaim(uint256 id, uint256 amountUsd, ClaimReason reason) external {
        Reservation storage reservation = _activeReservation(id);
        if (msg.sender != reservation.beneficiary) revert NotBeneficiary();
        if (reservation.claim.status != ClaimStatus.None) revert ClaimInProgress();
        if (block.timestamp > reservation.endsAt + claimWindow) revert ClaimWindowClosed();
        if (amountUsd == 0 || amountUsd > reservation.coverageUsd) revert InvalidAmount();

        reservation.claim = Claim({
            status: ClaimStatus.Filed,
            reason: reason,
            filedAt: uint64(block.timestamp),
            disputedAt: 0,
            amountUsd: amountUsd
        });

        emit ClaimFiled(id, amountUsd, reason);
    }

    /// @inheritdoc IReservationEscrow
    function withdrawClaim(uint256 id) external {
        Reservation storage reservation = _activeReservation(id);
        if (msg.sender != reservation.beneficiary) revert NotBeneficiary();
        if (reservation.claim.status == ClaimStatus.None) revert NoClaimToAct(ClaimStatus.None);

        delete reservation.claim;

        emit ClaimWithdrawn(id);
    }

    // ───────────────────────────── Arbiter ─────────────────────────────

    /// @inheritdoc IReservationEscrow
    function resolveDispute(uint256 id, uint256 awardedUsd) external {
        Reservation storage reservation = _activeReservation(id);
        Claim storage claim = reservation.claim;
        if (claim.status != ClaimStatus.Disputed) revert NoClaimToAct(claim.status);

        bool isChosenArbiter = msg.sender == reservation.arbiter;
        bool isFallbackArbiter =
            msg.sender == defaultArbiter && block.timestamp > claim.disputedAt + arbitrationTimeout;
        if (!isChosenArbiter && !isFallbackArbiter) revert NotArbiter();
        if (awardedUsd > claim.amountUsd) revert InvalidAmount();

        if (awardedUsd == 0) {
            delete reservation.claim;
        } else {
            claim.amountUsd = awardedUsd;
            claim.status = ClaimStatus.Approved;
        }

        emit DisputeResolved(id, msg.sender, awardedUsd);
    }

    // ───────────────────────────── Anyone ─────────────────────────────

    /// @inheritdoc IReservationEscrow
    function settleClaim(uint256 id, address router, bytes calldata swapData) external nonReentrant {
        Reservation storage reservation = _activeReservation(id);
        Claim memory claim = reservation.claim;

        bool undisputed = claim.status == ClaimStatus.Filed && block.timestamp > claim.filedAt + disputeWindow;
        if (claim.status != ClaimStatus.Approved && !undisputed) revert ClaimNotPayable();
        if (!isRouter[router]) revert RouterNotAllowed(router);

        address token = reservation.token;
        (uint256 tokensIn, uint256 minUsdcOut) = _quote(token, reservation.collateral, claim.amountUsd);

        // Effects first: the router is an external call.
        reservation.collateral -= tokensIn;
        reservation.coverageUsd -= claim.amountUsd;
        activeCoverageUsd -= claim.amountUsd;
        delete reservation.claim;

        uint256 received = _swapToUsdc(token, tokensIn, router, swapData);
        if (received < minUsdcOut) revert SlippageExceeded(received, minUsdcOut);

        // The claim is owed in USD. If the collateral could not cover it, the beneficiary gets everything
        // the sale raised; otherwise the depositor keeps what the slippage allowance did not use.
        uint256 owed = Math.ceilDiv(claim.amountUsd, _usdcScale);
        uint256 paid = Math.min(received, owed);
        uint256 surplus = received - paid;

        IERC20(usdc).safeTransfer(reservation.beneficiary, paid);
        if (surplus > 0) IERC20(usdc).safeTransfer(reservation.depositor, surplus);
        emit ClaimSettled(id, router, tokensIn, paid, surplus);

        if (reservation.coverageUsd == 0 || reservation.collateral == 0) _close(id, reservation);
    }

    /// @inheritdoc IReservationEscrow
    function release(uint256 id) external nonReentrant {
        Reservation storage reservation = _activeReservation(id);

        if (msg.sender != reservation.beneficiary) {
            if (block.timestamp <= reservation.endsAt + claimWindow) revert ReservationNotOver();
            if (reservation.claim.status != ClaimStatus.None) revert ClaimInProgress();
        }

        _close(id, reservation);
    }

    // ───────────────────────────── Views ─────────────────────────────

    /// @inheritdoc IReservationEscrow
    function settlementQuote(uint256 id) external view returns (uint256 tokensIn, uint256 minUsdcOut) {
        Reservation storage reservation = _activeReservation(id);
        if (reservation.claim.status == ClaimStatus.None) revert NoClaimToAct(ClaimStatus.None);
        return _quote(reservation.token, reservation.collateral, reservation.claim.amountUsd);
    }

    /// @inheritdoc IReservationEscrow
    function getReservation(uint256 id) external view returns (Reservation memory) {
        return _reservations[id];
    }

    /// @inheritdoc IReservationEscrow
    function reservationIdsOf(address account) external view returns (uint256[] memory) {
        return _idsByAccount[account];
    }

    // ───────────────────────────── Admin ─────────────────────────────

    /// @notice Updates the creation fee. Only affects reservations created afterwards.
    function setFee(uint16 feeBps_) external onlyOwner {
        _setFee(feeBps_);
    }

    function setTreasury(address treasury_) external onlyOwner {
        _setTreasury(treasury_);
    }

    /// @notice Updates the arbiter used when a reservation does not name one, and as timeout fallback.
    function setDefaultArbiter(address arbiter) external onlyOwner {
        _setDefaultArbiter(arbiter);
    }

    /// @notice Allows or forbids a swap router (a DEX aggregator) for claim settlements.
    function setRouter(address router, bool allowed) external onlyOwner {
        if (router == address(0)) revert ZeroAddress();
        isRouter[router] = allowed;
        emit RouterUpdated(router, allowed);
    }

    // ───────────────────────────── Internals ─────────────────────────────

    function _activeReservation(uint256 id) private view returns (Reservation storage reservation) {
        reservation = _reservations[id];
        if (reservation.status != Status.Active) revert NotActive(id);
    }

    function _requiredUsd(uint256 coverageUsd, uint16 collateralRatioBps) private pure returns (uint256) {
        return Math.mulDiv(coverageUsd, collateralRatioBps, BPS, Math.Rounding.Ceil);
    }

    function _requireCollateralized(address token, uint256 collateral, uint256 coverageUsd, uint16 ratioBps)
        private
        view
    {
        uint256 valueUsd = oracle.toUsd(token, collateral, IStockOracle.PriceUse.Collateral);
        uint256 requiredUsd = _requiredUsd(coverageUsd, ratioBps);
        if (valueUsd < requiredUsd) revert InsufficientCollateral(valueUsd, requiredUsd);
    }

    /// @dev Sells enough stock to raise the claim even at the worst accepted price, capped at the collateral.
    function _quote(address token, uint256 collateral, uint256 claimUsd)
        private
        view
        returns (uint256 tokensIn, uint256 minUsdcOut)
    {
        uint256 grossUsd = Math.mulDiv(claimUsd, BPS, BPS - maxSlippageBps, Math.Rounding.Ceil);
        uint256 tokensNeeded = oracle.toTokens(token, grossUsd, IStockOracle.PriceUse.Settlement);
        tokensIn = Math.min(tokensNeeded, collateral);

        uint256 valueUsd = oracle.toUsd(token, tokensIn, IStockOracle.PriceUse.Settlement);
        minUsdcOut = Math.mulDiv(valueUsd, BPS - maxSlippageBps, BPS) / _usdcScale;
    }

    /// @dev Exact approval, external call, approval reset, and balance-based accounting so a misbehaving
    ///      router can neither pull more stock than sold nor fake the USDC it returned.
    function _swapToUsdc(address token, uint256 tokensIn, address router, bytes calldata swapData)
        private
        returns (uint256 received)
    {
        IERC20 stock = IERC20(token);
        uint256 stockBefore = stock.balanceOf(address(this));
        uint256 usdcBefore = IERC20(usdc).balanceOf(address(this));

        stock.forceApprove(router, tokensIn);
        (bool ok, bytes memory reason) = router.call(swapData);
        if (!ok) revert SwapFailed(reason);
        stock.forceApprove(router, 0);

        uint256 spent = stockBefore - stock.balanceOf(address(this));
        if (spent != tokensIn) revert SwapAmountMismatch(tokensIn, spent);
        received = IERC20(usdc).balanceOf(address(this)) - usdcBefore;
    }

    function _chargeFee(uint256 id, address token, uint256 coverageUsd) private {
        if (feeBps == 0) return;

        uint256 feeUsd = Math.mulDiv(coverageUsd, feeBps, BPS);
        uint256 feeTokens = oracle.toTokens(token, feeUsd, IStockOracle.PriceUse.Collateral);
        if (feeTokens == 0) return;

        IERC20(token).safeTransferFrom(msg.sender, treasury, feeTokens);
        emit FeeCharged(id, token, feeTokens);
    }

    function _close(uint256 id, Reservation storage reservation) private {
        uint256 collateral = reservation.collateral;

        reservation.collateral = 0;
        reservation.status = Status.Closed;
        delete reservation.claim;
        activeReservationCount--;
        activeCoverageUsd -= reservation.coverageUsd;

        if (collateral > 0) IERC20(reservation.token).safeTransfer(reservation.depositor, collateral);

        emit ReservationClosed(id, collateral);
    }

    function _setFee(uint16 feeBps_) private {
        if (feeBps_ > MAX_FEE_BPS) revert FeeTooHigh(feeBps_);
        feeBps = feeBps_;
        emit FeeUpdated(feeBps_);
    }

    function _setTreasury(address treasury_) private {
        if (treasury_ == address(0)) revert ZeroAddress();
        treasury = treasury_;
        emit TreasuryUpdated(treasury_);
    }

    function _setDefaultArbiter(address arbiter) private {
        if (arbiter == address(0)) revert ZeroAddress();
        defaultArbiter = arbiter;
        emit DefaultArbiterUpdated(arbiter);
    }
}
