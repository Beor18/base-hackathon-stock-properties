// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title IGuaranteeEscrow
/// @notice A rental guarantee backed by tokenized stocks instead of a cash deposit or a human guarantor.
/// @dev Roles per guarantee:
///      - tenant: locks the stocks and gets them back when the lease ends.
///      - landlord: beneficiary. Can claim up to the USD coverage, or release the stocks early.
///      - arbiter: neutral party that settles a claim only if the tenant disputes it.
///      USD amounts use 18 decimals. Token amounts use the token's own decimals.
interface IGuaranteeEscrow {
    enum Status {
        None,
        Active,
        Closed
    }

    enum ClaimStatus {
        None,
        Filed, // waiting for the tenant: accept, dispute, or let the dispute window lapse
        Disputed, // waiting for the arbiter
        Approved // payable
    }

    enum ClaimReason {
        UnpaidRent,
        Damages,
        EarlyTermination,
        Other
    }

    struct Claim {
        ClaimStatus status;
        ClaimReason reason;
        uint64 filedAt;
        uint64 disputedAt;
        uint256 amountUsd;
    }

    struct Guarantee {
        address tenant;
        address landlord;
        address arbiter;
        address token;
        uint256 collateral; // stock tokens held for this guarantee
        uint256 coverageUsd; // USD the landlord can still claim
        uint64 createdAt;
        uint64 endsAt; // lease end
        uint16 collateralRatioBps; // ratio required at creation, enforced on excess withdrawals
        Status status;
        bytes32 leaseHash; // optional hash of the signed lease document, zero if not provided
        Claim claim;
    }

    struct CreateParams {
        address landlord;
        address arbiter; // zero address selects the protocol default arbiter
        address token;
        uint256 collateral;
        uint256 coverageUsd;
        uint64 endsAt;
        bytes32 leaseHash;
    }

    event GuaranteeCreated(
        uint256 indexed id,
        address indexed tenant,
        address indexed landlord,
        address token,
        uint256 collateral,
        uint256 coverageUsd,
        uint64 endsAt,
        address arbiter,
        bytes32 leaseHash
    );
    event CollateralAdded(uint256 indexed id, address indexed from, uint256 amount);
    event ExcessWithdrawn(uint256 indexed id, uint256 amount);
    event LeaseExtended(uint256 indexed id, uint64 endsAt);
    event ClaimFiled(uint256 indexed id, uint256 amountUsd, ClaimReason reason);
    event ClaimWithdrawn(uint256 indexed id);
    event ClaimAccepted(uint256 indexed id);
    event ClaimDisputed(uint256 indexed id);
    event DisputeResolved(uint256 indexed id, address indexed arbiter, uint256 awardedUsd);
    event ClaimSettled(uint256 indexed id, uint256 tokensPaid, uint256 usdPaid);
    event GuaranteeClosed(uint256 indexed id, uint256 collateralReturned);
    event FeeCharged(uint256 indexed id, address indexed token, uint256 amount);
    event FeeUpdated(uint16 feeBps);
    event TreasuryUpdated(address treasury);
    event DefaultArbiterUpdated(address arbiter);

    error ZeroAddress();
    error InvalidParties();
    error InvalidAmount();
    error InvalidEndDate();
    error InvalidWindow();
    error FeeTooHigh(uint16 feeBps);
    error StockNotEnabled(address token);
    error InsufficientCollateral(uint256 valueUsd, uint256 requiredUsd);
    error NotActive(uint256 id);
    error NotTenant();
    error NotLandlord();
    error NotArbiter();
    error ClaimInProgress();
    error NoClaimToAct(ClaimStatus status);
    error ClaimWindowClosed();
    error DisputeWindowClosed();
    error ClaimNotPayable();
    error LeaseNotOver();

    /// @notice Tenant locks `collateral` stock tokens as a guarantee for `landlord`.
    /// @dev The tenant must approve this contract for `collateral` plus the protocol fee first.
    function createGuarantee(CreateParams calldata params) external returns (uint256 id);

    /// @notice Adds collateral to a guarantee. Open to anyone so family or friends can help.
    function topUp(uint256 id, uint256 amount) external;

    /// @notice Tenant withdraws collateral above the required ratio (for example after the stock rallied).
    function withdrawExcess(uint256 id, uint256 amount) external;

    /// @notice Tenant extends the lease end date (renewal).
    function extendLease(uint256 id, uint64 endsAt) external;

    /// @notice Landlord claims part or all of the remaining coverage.
    function fileClaim(uint256 id, uint256 amountUsd, ClaimReason reason) external;

    /// @notice Landlord cancels a claim that has not been paid yet.
    function withdrawClaim(uint256 id) external;

    /// @notice Tenant accepts a filed claim, making it payable immediately.
    function acceptClaim(uint256 id) external;

    /// @notice Tenant disputes a filed claim within the dispute window, sending it to the arbiter.
    function disputeClaim(uint256 id) external;

    /// @notice Arbiter awards between zero and the claimed amount.
    function resolveDispute(uint256 id, uint256 awardedUsd) external;

    /// @notice Pays an approved (or undisputed and expired) claim to the landlord in stock tokens.
    function settleClaim(uint256 id) external;

    /// @notice Returns all collateral to the tenant. The landlord can do it at any time;
    ///         anyone can do it once the lease and its claim window are over and no claim is open.
    function release(uint256 id) external;

    function getGuarantee(uint256 id) external view returns (Guarantee memory);

    /// @notice Ids of every guarantee where `account` is the tenant or the landlord.
    function guaranteeIdsOf(address account) external view returns (uint256[] memory);

    function guaranteeCount() external view returns (uint256);
}
