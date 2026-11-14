// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title IReservationEscrow
/// @notice Tokenized stocks locked as a USD-denominated deposit (a "seña") for a property, instead of cash.
/// @dev Roles per reservation:
///      - depositor: locks the stocks and gets them back when the deal closes or the reservation ends.
///      - beneficiary: the broker, acting for the seller. Can claim up to the USD coverage, or release early.
///      - arbiter: neutral party that settles a claim only if the depositor disputes it.
///      Claims are owed in USD and paid in USDC: the escrow sells just enough stock through a whitelisted
///      router, so the beneficiary never receives stock. USD amounts use 18 decimals; token amounts use the
///      token's own decimals. The same lifecycle also works as a rental guarantee.
interface IReservationEscrow {
    enum Status {
        None,
        Active,
        Closed
    }

    enum ClaimStatus {
        None,
        Filed, // waiting for the depositor: accept, dispute, or let the dispute window lapse
        Disputed, // waiting for the arbiter
        Approved // payable
    }

    enum ClaimReason {
        BackedOut, // the depositor walked away from the deal
        UnpaidRent,
        Damages,
        Other
    }

    struct Claim {
        ClaimStatus status;
        ClaimReason reason;
        uint64 filedAt;
        uint64 disputedAt;
        uint256 amountUsd;
    }

    struct Reservation {
        address depositor;
        address beneficiary;
        address arbiter;
        address token;
        uint256 collateral; // stock tokens held for this reservation
        uint256 coverageUsd; // USD the beneficiary can still claim
        uint64 createdAt;
        uint64 endsAt; // expected closing date (or lease end)
        uint16 collateralRatioBps; // ratio required at creation, enforced on excess withdrawals
        Status status;
        bytes32 propertyRef; // keccak256 of the app's property ref, zero if none
        Claim claim;
    }

    struct CreateParams {
        address beneficiary;
        address arbiter; // zero address selects the protocol default arbiter
        address token;
        uint256 collateral;
        uint256 coverageUsd;
        uint64 endsAt;
        bytes32 propertyRef;
    }

    event ReservationCreated(
        uint256 indexed id,
        address indexed depositor,
        address indexed beneficiary,
        address token,
        uint256 collateral,
        uint256 coverageUsd,
        uint64 endsAt,
        address arbiter,
        bytes32 propertyRef
    );
    event CollateralAdded(uint256 indexed id, address indexed from, uint256 amount);
    event ExcessWithdrawn(uint256 indexed id, uint256 amount);
    event EndDateExtended(uint256 indexed id, uint64 endsAt);
    event ClaimFiled(uint256 indexed id, uint256 amountUsd, ClaimReason reason);
    event ClaimWithdrawn(uint256 indexed id);
    event ClaimAccepted(uint256 indexed id);
    event ClaimDisputed(uint256 indexed id);
    event DisputeResolved(uint256 indexed id, address indexed arbiter, uint256 awardedUsd);
    /// @param tokensSold Stock sold through the router.
    /// @param usdcPaid USDC sent to the beneficiary.
    /// @param usdcToDepositor USDC left over after paying the claim, sent back to the depositor.
    event ClaimSettled(
        uint256 indexed id, address indexed router, uint256 tokensSold, uint256 usdcPaid, uint256 usdcToDepositor
    );
    event ReservationClosed(uint256 indexed id, uint256 collateralReturned);
    event FeeCharged(uint256 indexed id, address indexed token, uint256 amount);
    event FeeUpdated(uint16 feeBps);
    event TreasuryUpdated(address treasury);
    event DefaultArbiterUpdated(address arbiter);
    event RouterUpdated(address indexed router, bool allowed);

    error ZeroAddress();
    error InvalidParties();
    error InvalidAmount();
    error InvalidEndDate();
    error InvalidWindow();
    error InvalidSlippage(uint16 maxSlippageBps);
    error FeeTooHigh(uint16 feeBps);
    error StockNotEnabled(address token);
    error InsufficientCollateral(uint256 valueUsd, uint256 requiredUsd);
    error NotActive(uint256 id);
    error NotDepositor();
    error NotBeneficiary();
    error NotArbiter();
    error ClaimInProgress();
    error NoClaimToAct(ClaimStatus status);
    error ClaimWindowClosed();
    error DisputeWindowClosed();
    error ClaimNotPayable();
    error ReservationNotOver();
    error RouterNotAllowed(address router);
    error SwapFailed(bytes reason);
    error SwapAmountMismatch(uint256 expected, uint256 spent);
    error SlippageExceeded(uint256 received, uint256 minimum);

    /// @notice Depositor locks `collateral` stock tokens as a reservation in favor of `beneficiary`.
    /// @dev The depositor must approve this contract for `collateral` plus the protocol fee first.
    function createReservation(CreateParams calldata params) external returns (uint256 id);

    /// @notice Adds collateral to a reservation. Open to anyone so family or friends can help.
    function topUp(uint256 id, uint256 amount) external;

    /// @notice Depositor withdraws collateral above the required ratio (for example after the stock rallied).
    function withdrawExcess(uint256 id, uint256 amount) external;

    /// @notice Depositor moves the end date forward (the closing was postponed, or the lease renewed).
    function extendEndDate(uint256 id, uint64 endsAt) external;

    /// @notice Beneficiary claims part or all of the remaining coverage.
    function fileClaim(uint256 id, uint256 amountUsd, ClaimReason reason) external;

    /// @notice Beneficiary cancels a claim that has not been paid yet.
    function withdrawClaim(uint256 id) external;

    /// @notice Depositor accepts a filed claim, making it payable immediately.
    function acceptClaim(uint256 id) external;

    /// @notice Depositor disputes a filed claim within the dispute window, sending it to the arbiter.
    function disputeClaim(uint256 id) external;

    /// @notice Arbiter awards between zero and the claimed amount.
    function resolveDispute(uint256 id, uint256 awardedUsd) external;

    /// @notice Pays an approved (or undisputed and expired) claim to the beneficiary in USDC.
    /// @dev Approves exactly `tokensIn` from `settlementQuote` to `router`, calls it with `swapData`, and
    ///      resets the approval. `swapData` must sell exactly that amount and send the USDC to this contract.
    ///      Reverts unless the USDC received is at least the oracle value of the stock sold minus
    ///      `maxSlippageBps`. Anything above the claim goes back to the depositor.
    function settleClaim(uint256 id, address router, bytes calldata swapData) external;

    /// @notice Returns all collateral to the depositor. The beneficiary can do it at any time;
    ///         anyone can do it once the end date and its claim window are over and no claim is open.
    function release(uint256 id) external;

    /// @notice What `settleClaim` will sell right now, to build the router call off-chain.
    /// @return tokensIn Exact stock amount the router must pull: the claim plus the slippage allowance,
    ///         capped at the collateral.
    /// @return minUsdcOut Minimum USDC the swap must return for the settlement to go through.
    function settlementQuote(uint256 id) external view returns (uint256 tokensIn, uint256 minUsdcOut);

    function getReservation(uint256 id) external view returns (Reservation memory);

    /// @notice Ids of every reservation where `account` is the depositor or the beneficiary.
    function reservationIdsOf(address account) external view returns (uint256[] memory);

    /// @notice Stablecoin claims are paid in (treated as 1 USD per unit).
    function usdc() external view returns (address);

    /// @notice Maximum discount to the oracle price accepted when selling stock to pay a claim.
    function maxSlippageBps() external view returns (uint16);

    /// @notice Whether `router` may be used by `settleClaim`.
    function isRouter(address router) external view returns (bool);

    function reservationCount() external view returns (uint256);

    /// @notice Number of reservations currently holding collateral.
    function activeReservationCount() external view returns (uint256);

    /// @notice Total USD coverage (18 decimals) of all active reservations.
    function activeCoverageUsd() external view returns (uint256);
}
