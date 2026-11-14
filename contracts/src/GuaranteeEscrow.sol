// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable, Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

import {IGuaranteeEscrow} from "./interfaces/IGuaranteeEscrow.sol";
import {IStockOracle} from "./interfaces/IStockOracle.sol";

/// @title GuaranteeEscrow
/// @notice Holds tokenized stocks as a USD-denominated rental guarantee.
/// @dev Lifecycle of a guarantee:
///      1. The tenant locks stocks worth at least `coverage x collateral ratio` (createGuarantee).
///      2. During the lease the landlord may file claims. A claim is paid when the tenant accepts it,
///         when the dispute window lapses, or when the arbiter awards it after a dispute.
///      3. The stocks go back to the tenant when the landlord releases them or the lease is over.
///      The tenant keeps the market exposure the whole time: collateral is never sold by the protocol.
///      Time windows are immutable so the rules of a live guarantee can never change.
contract GuaranteeEscrow is IGuaranteeEscrow, Ownable2Step, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint16 private constant BPS = 10_000;
    uint16 public constant MAX_FEE_BPS = 300;
    uint64 public constant MAX_LEASE_DURATION = 3650 days;

    IStockOracle public immutable oracle;
    /// @notice Time the tenant has to dispute a claim before it becomes payable.
    uint64 public immutable disputeWindow;
    /// @notice Time after the lease end during which the landlord can still file a claim.
    uint64 public immutable claimWindow;
    /// @notice Time after which the default arbiter may resolve a dispute the chosen arbiter ignored.
    uint64 public immutable arbitrationTimeout;

    address public defaultArbiter;
    address public treasury;
    /// @notice One-time fee on the coverage amount, charged to the tenant in stock tokens at creation.
    uint16 public feeBps;

    uint256 public guaranteeCount;

    mapping(uint256 id => Guarantee) private _guarantees;
    mapping(address account => uint256[]) private _idsByAccount;

    constructor(
        address owner_,
        IStockOracle oracle_,
        uint64 disputeWindow_,
        uint64 claimWindow_,
        uint64 arbitrationTimeout_,
        address defaultArbiter_,
        address treasury_,
        uint16 feeBps_
    ) Ownable(owner_) {
        if (address(oracle_) == address(0)) revert ZeroAddress();
        if (disputeWindow_ == 0 || claimWindow_ == 0 || arbitrationTimeout_ == 0) revert InvalidWindow();

        oracle = oracle_;
        disputeWindow = disputeWindow_;
        claimWindow = claimWindow_;
        arbitrationTimeout = arbitrationTimeout_;

        _setDefaultArbiter(defaultArbiter_);
        _setTreasury(treasury_);
        _setFee(feeBps_);
    }

    // ───────────────────────────── Tenant ─────────────────────────────

    /// @inheritdoc IGuaranteeEscrow
    function createGuarantee(CreateParams calldata params) external nonReentrant returns (uint256 id) {
        address arbiter = params.arbiter == address(0) ? defaultArbiter : params.arbiter;

        if (params.landlord == address(0)) revert ZeroAddress();
        if (params.landlord == msg.sender || arbiter == msg.sender || arbiter == params.landlord) {
            revert InvalidParties();
        }
        if (params.coverageUsd == 0 || params.collateral == 0) revert InvalidAmount();
        if (params.endsAt <= block.timestamp || params.endsAt > block.timestamp + MAX_LEASE_DURATION) {
            revert InvalidEndDate();
        }

        IStockOracle.Stock memory stock = oracle.getStock(params.token);
        if (!stock.enabled) revert StockNotEnabled(params.token);

        _requireCollateralized(params.token, params.collateral, params.coverageUsd, stock.collateralRatioBps);

        id = ++guaranteeCount;
        Guarantee storage guarantee = _guarantees[id];
        guarantee.tenant = msg.sender;
        guarantee.landlord = params.landlord;
        guarantee.arbiter = arbiter;
        guarantee.token = params.token;
        guarantee.collateral = params.collateral;
        guarantee.coverageUsd = params.coverageUsd;
        guarantee.createdAt = uint64(block.timestamp);
        guarantee.endsAt = params.endsAt;
        guarantee.collateralRatioBps = stock.collateralRatioBps;
        guarantee.status = Status.Active;
        guarantee.leaseHash = params.leaseHash;

        _idsByAccount[msg.sender].push(id);
        _idsByAccount[params.landlord].push(id);

        IERC20(params.token).safeTransferFrom(msg.sender, address(this), params.collateral);
        _chargeFee(id, params.token, params.coverageUsd);

        emit GuaranteeCreated(
            id,
            msg.sender,
            params.landlord,
            params.token,
            params.collateral,
            params.coverageUsd,
            params.endsAt,
            arbiter,
            params.leaseHash
        );
    }

    /// @inheritdoc IGuaranteeEscrow
    function topUp(uint256 id, uint256 amount) external nonReentrant {
        Guarantee storage guarantee = _activeGuarantee(id);
        if (amount == 0) revert InvalidAmount();

        guarantee.collateral += amount;
        IERC20(guarantee.token).safeTransferFrom(msg.sender, address(this), amount);

        emit CollateralAdded(id, msg.sender, amount);
    }

    /// @inheritdoc IGuaranteeEscrow
    function withdrawExcess(uint256 id, uint256 amount) external nonReentrant {
        Guarantee storage guarantee = _activeGuarantee(id);
        if (msg.sender != guarantee.tenant) revert NotTenant();
        if (guarantee.claim.status != ClaimStatus.None) revert ClaimInProgress();
        if (amount == 0 || amount > guarantee.collateral) revert InvalidAmount();

        uint256 remaining = guarantee.collateral - amount;
        uint256 valueUsd = oracle.toUsd(guarantee.token, remaining, IStockOracle.PriceUse.Settlement);
        uint256 requiredUsd = _requiredUsd(guarantee.coverageUsd, guarantee.collateralRatioBps);
        if (valueUsd < requiredUsd) revert InsufficientCollateral(valueUsd, requiredUsd);

        guarantee.collateral = remaining;
        IERC20(guarantee.token).safeTransfer(guarantee.tenant, amount);

        emit ExcessWithdrawn(id, amount);
    }

    /// @inheritdoc IGuaranteeEscrow
    function extendLease(uint256 id, uint64 endsAt) external {
        Guarantee storage guarantee = _activeGuarantee(id);
        if (msg.sender != guarantee.tenant) revert NotTenant();
        if (endsAt <= guarantee.endsAt || endsAt > block.timestamp + MAX_LEASE_DURATION) revert InvalidEndDate();

        guarantee.endsAt = endsAt;

        emit LeaseExtended(id, endsAt);
    }

    /// @inheritdoc IGuaranteeEscrow
    function acceptClaim(uint256 id) external {
        Guarantee storage guarantee = _activeGuarantee(id);
        if (msg.sender != guarantee.tenant) revert NotTenant();

        ClaimStatus status = guarantee.claim.status;
        if (status != ClaimStatus.Filed && status != ClaimStatus.Disputed) revert NoClaimToAct(status);

        guarantee.claim.status = ClaimStatus.Approved;

        emit ClaimAccepted(id);
    }

    /// @inheritdoc IGuaranteeEscrow
    function disputeClaim(uint256 id) external {
        Guarantee storage guarantee = _activeGuarantee(id);
        if (msg.sender != guarantee.tenant) revert NotTenant();

        Claim storage claim = guarantee.claim;
        if (claim.status != ClaimStatus.Filed) revert NoClaimToAct(claim.status);
        if (block.timestamp > claim.filedAt + disputeWindow) revert DisputeWindowClosed();

        claim.status = ClaimStatus.Disputed;
        claim.disputedAt = uint64(block.timestamp);

        emit ClaimDisputed(id);
    }

    // ───────────────────────────── Landlord ─────────────────────────────

    /// @inheritdoc IGuaranteeEscrow
    function fileClaim(uint256 id, uint256 amountUsd, ClaimReason reason) external {
        Guarantee storage guarantee = _activeGuarantee(id);
        if (msg.sender != guarantee.landlord) revert NotLandlord();
        if (guarantee.claim.status != ClaimStatus.None) revert ClaimInProgress();
        if (block.timestamp > guarantee.endsAt + claimWindow) revert ClaimWindowClosed();
        if (amountUsd == 0 || amountUsd > guarantee.coverageUsd) revert InvalidAmount();

        guarantee.claim = Claim({
            status: ClaimStatus.Filed,
            reason: reason,
            filedAt: uint64(block.timestamp),
            disputedAt: 0,
            amountUsd: amountUsd
        });

        emit ClaimFiled(id, amountUsd, reason);
    }

    /// @inheritdoc IGuaranteeEscrow
    function withdrawClaim(uint256 id) external {
        Guarantee storage guarantee = _activeGuarantee(id);
        if (msg.sender != guarantee.landlord) revert NotLandlord();
        if (guarantee.claim.status == ClaimStatus.None) revert NoClaimToAct(ClaimStatus.None);

        delete guarantee.claim;

        emit ClaimWithdrawn(id);
    }

    // ───────────────────────────── Arbiter ─────────────────────────────

    /// @inheritdoc IGuaranteeEscrow
    function resolveDispute(uint256 id, uint256 awardedUsd) external {
        Guarantee storage guarantee = _activeGuarantee(id);
        Claim storage claim = guarantee.claim;
        if (claim.status != ClaimStatus.Disputed) revert NoClaimToAct(claim.status);

        bool isChosenArbiter = msg.sender == guarantee.arbiter;
        bool isFallbackArbiter =
            msg.sender == defaultArbiter && block.timestamp > claim.disputedAt + arbitrationTimeout;
        if (!isChosenArbiter && !isFallbackArbiter) revert NotArbiter();
        if (awardedUsd > claim.amountUsd) revert InvalidAmount();

        if (awardedUsd == 0) {
            delete guarantee.claim;
        } else {
            claim.amountUsd = awardedUsd;
            claim.status = ClaimStatus.Approved;
        }

        emit DisputeResolved(id, msg.sender, awardedUsd);
    }

    // ───────────────────────────── Anyone ─────────────────────────────

    /// @inheritdoc IGuaranteeEscrow
    function settleClaim(uint256 id) external nonReentrant {
        Guarantee storage guarantee = _activeGuarantee(id);
        Claim memory claim = guarantee.claim;

        bool undisputed = claim.status == ClaimStatus.Filed && block.timestamp > claim.filedAt + disputeWindow;
        if (claim.status != ClaimStatus.Approved && !undisputed) revert ClaimNotPayable();

        // The claim is owed in USD and paid in stock at the live price. If the collateral is worth less
        // than the claim, the landlord receives all of it and the guarantee closes.
        address token = guarantee.token;
        uint256 tokensOwed = oracle.toTokens(token, claim.amountUsd, IStockOracle.PriceUse.Settlement);
        uint256 tokensPaid = Math.min(tokensOwed, guarantee.collateral);
        uint256 usdPaid = tokensPaid == tokensOwed
            ? claim.amountUsd
            : oracle.toUsd(token, tokensPaid, IStockOracle.PriceUse.Settlement);

        guarantee.collateral -= tokensPaid;
        guarantee.coverageUsd -= claim.amountUsd;
        delete guarantee.claim;

        IERC20(token).safeTransfer(guarantee.landlord, tokensPaid);
        emit ClaimSettled(id, tokensPaid, usdPaid);

        if (guarantee.coverageUsd == 0 || guarantee.collateral == 0) _close(id, guarantee);
    }

    /// @inheritdoc IGuaranteeEscrow
    function release(uint256 id) external nonReentrant {
        Guarantee storage guarantee = _activeGuarantee(id);

        if (msg.sender != guarantee.landlord) {
            if (block.timestamp <= guarantee.endsAt + claimWindow) revert LeaseNotOver();
            if (guarantee.claim.status != ClaimStatus.None) revert ClaimInProgress();
        }

        _close(id, guarantee);
    }

    // ───────────────────────────── Views ─────────────────────────────

    /// @inheritdoc IGuaranteeEscrow
    function getGuarantee(uint256 id) external view returns (Guarantee memory) {
        return _guarantees[id];
    }

    /// @inheritdoc IGuaranteeEscrow
    function guaranteeIdsOf(address account) external view returns (uint256[] memory) {
        return _idsByAccount[account];
    }

    // ───────────────────────────── Admin ─────────────────────────────

    /// @notice Updates the creation fee. Only affects guarantees created afterwards.
    function setFee(uint16 feeBps_) external onlyOwner {
        _setFee(feeBps_);
    }

    function setTreasury(address treasury_) external onlyOwner {
        _setTreasury(treasury_);
    }

    /// @notice Updates the arbiter used when a guarantee does not name one, and as timeout fallback.
    function setDefaultArbiter(address arbiter) external onlyOwner {
        _setDefaultArbiter(arbiter);
    }

    // ───────────────────────────── Internals ─────────────────────────────

    function _activeGuarantee(uint256 id) private view returns (Guarantee storage guarantee) {
        guarantee = _guarantees[id];
        if (guarantee.status != Status.Active) revert NotActive(id);
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

    function _chargeFee(uint256 id, address token, uint256 coverageUsd) private {
        if (feeBps == 0) return;

        uint256 feeUsd = Math.mulDiv(coverageUsd, feeBps, BPS);
        uint256 feeTokens = oracle.toTokens(token, feeUsd, IStockOracle.PriceUse.Collateral);
        if (feeTokens == 0) return;

        IERC20(token).safeTransferFrom(msg.sender, treasury, feeTokens);
        emit FeeCharged(id, token, feeTokens);
    }

    function _close(uint256 id, Guarantee storage guarantee) private {
        uint256 collateral = guarantee.collateral;

        guarantee.collateral = 0;
        guarantee.status = Status.Closed;
        delete guarantee.claim;

        if (collateral > 0) IERC20(guarantee.token).safeTransfer(guarantee.tenant, collateral);

        emit GuaranteeClosed(id, collateral);
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
