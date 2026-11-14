// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title IGoalRegistry
/// @notice One savings goal per account: a concrete property and the stock the account saves in.
/// @dev The stock price at the start is read from the oracle, never taken from the caller, so the
///      "your stocks +y% since you started" figure is verifiable onchain. USD amounts use 18 decimals.
interface IGoalRegistry {
    struct Goal {
        bytes32 propertyRef; // keccak256 of the app's property ref, the same value a reservation stores
        address stock; // the one stock this goal saves in
        address beneficiary; // broker who will receive the reservation, zero if not known yet
        uint64 createdAt; // zero when the account has no goal
        uint256 targetUsd; // USD the account needs to reach (the reservation amount)
        uint256 propertyPriceUsd; // property price when the goal was set
        uint256 startStockPriceUsd; // oracle price of one whole stock token when the goal was set
        string propertyKey; // plain-text ref (or listing URL) so the app can load the property from chain data
    }

    event GoalSet(
        address indexed account,
        bytes32 indexed propertyRef,
        address indexed stock,
        string propertyKey,
        uint256 targetUsd,
        uint256 propertyPriceUsd,
        uint256 startStockPriceUsd,
        address beneficiary
    );
    event GoalCleared(address indexed account, bytes32 indexed propertyRef);

    error InvalidProperty();
    error InvalidAmount();
    error InvalidBeneficiary();
    error StockNotEnabled(address stock);
    error NoGoal(address account);

    /// @notice Sets the caller's goal, replacing the current one if any.
    /// @param propertyRef keccak256 of the property ref. Must not be zero.
    /// @param propertyKey Plain-text ref or listing URL, 1 to `MAX_KEY_LENGTH` bytes.
    /// @param stock A stock listed and enabled in the oracle.
    /// @param beneficiary The broker, or zero if the account does not have the reservation link yet.
    function setGoal(
        bytes32 propertyRef,
        string calldata propertyKey,
        address stock,
        uint256 targetUsd,
        uint256 propertyPriceUsd,
        address beneficiary
    ) external;

    /// @notice Removes the caller's goal.
    function clearGoal() external;

    /// @notice The account's goal. Returns an empty goal (`createdAt == 0`) when there is none.
    function goalOf(address account) external view returns (Goal memory);

    function hasGoal(address account) external view returns (bool);

    /// @notice Goals ever set, replacements included.
    function goalCount() external view returns (uint256);

    /// @notice Accounts with a goal right now.
    function activeGoals() external view returns (uint256);
}
