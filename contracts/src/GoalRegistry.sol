// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IGoalRegistry} from "./interfaces/IGoalRegistry.sol";
import {IStockOracle} from "./interfaces/IStockOracle.sol";

/// @title GoalRegistry
/// @notice Stores each account's savings goal (one per account) so the app needs no database.
contract GoalRegistry is IGoalRegistry {
    /// @notice Longest accepted `propertyKey`, enough for a listing URL. Bounds sponsored gas.
    uint256 public constant MAX_KEY_LENGTH = 512;

    IStockOracle public immutable oracle;

    /// @inheritdoc IGoalRegistry
    uint256 public goalCount;
    /// @inheritdoc IGoalRegistry
    uint256 public activeGoals;

    mapping(address account => Goal) private _goals;

    constructor(IStockOracle oracle_) {
        oracle = oracle_;
    }

    /// @inheritdoc IGoalRegistry
    function setGoal(
        bytes32 propertyRef,
        string calldata propertyKey,
        address stock,
        uint256 targetUsd,
        uint256 propertyPriceUsd,
        address beneficiary
    ) external {
        uint256 keyLength = bytes(propertyKey).length;
        if (propertyRef == bytes32(0) || keyLength == 0 || keyLength > MAX_KEY_LENGTH) revert InvalidProperty();
        if (targetUsd == 0 || propertyPriceUsd == 0) revert InvalidAmount();
        if (beneficiary == msg.sender) revert InvalidBeneficiary();
        if (!oracle.getStock(stock).enabled) revert StockNotEnabled(stock);

        // Display-grade price on purpose: a weekend close is a fine starting point for a savings goal.
        (uint256 startStockPriceUsd,) = oracle.latestPrice(stock);

        if (_goals[msg.sender].createdAt == 0) activeGoals++;
        goalCount++;

        _goals[msg.sender] = Goal({
            propertyRef: propertyRef,
            stock: stock,
            beneficiary: beneficiary,
            createdAt: uint64(block.timestamp),
            targetUsd: targetUsd,
            propertyPriceUsd: propertyPriceUsd,
            startStockPriceUsd: startStockPriceUsd,
            propertyKey: propertyKey
        });

        emit GoalSet(
            msg.sender, propertyRef, stock, propertyKey, targetUsd, propertyPriceUsd, startStockPriceUsd, beneficiary
        );
    }

    /// @inheritdoc IGoalRegistry
    function clearGoal() external {
        Goal storage goal = _goals[msg.sender];
        if (goal.createdAt == 0) revert NoGoal(msg.sender);

        bytes32 propertyRef = goal.propertyRef;
        delete _goals[msg.sender];
        activeGoals--;

        emit GoalCleared(msg.sender, propertyRef);
    }

    /// @inheritdoc IGoalRegistry
    function goalOf(address account) external view returns (Goal memory) {
        return _goals[account];
    }

    /// @inheritdoc IGoalRegistry
    function hasGoal(address account) external view returns (bool) {
        return _goals[account].createdAt != 0;
    }
}
