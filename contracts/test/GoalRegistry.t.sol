// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IGoalRegistry} from "../src/interfaces/IGoalRegistry.sol";
import {IStockOracle} from "../src/interfaces/IStockOracle.sol";
import {Fixture} from "./Fixture.sol";

/// @notice One goal per account, priced from the oracle.
contract GoalRegistryTest is Fixture {
    bytes32 private constant REF = keccak256("smarlin:123");
    string private constant KEY = "smarlin:123";

    function test_SetGoal_StoresGoalWithOraclePrice() public {
        vm.expectEmit(true, true, true, true);
        emit IGoalRegistry.GoalSet(
            depositor, REF, address(stock), KEY, 12_500 * USD, 250_000 * USD, 200 * USD, beneficiary
        );
        _setGoal(depositor, beneficiary);

        IGoalRegistry.Goal memory goal = goals.goalOf(depositor);
        assertEq(goal.propertyRef, REF);
        assertEq(goal.propertyKey, KEY);
        assertEq(goal.stock, address(stock));
        assertEq(goal.beneficiary, beneficiary);
        assertEq(goal.targetUsd, 12_500 * USD);
        assertEq(goal.propertyPriceUsd, 250_000 * USD);
        assertEq(goal.startStockPriceUsd, 200 * USD, "read from the oracle, not from the caller");
        assertEq(goal.createdAt, block.timestamp);
        assertTrue(goals.hasGoal(depositor));
        assertEq(goals.goalCount(), 1);
        assertEq(goals.activeGoals(), 1);
    }

    function test_SetGoal_ReplacesTheCurrentGoal() public {
        _setGoal(depositor, address(0));
        _setPrice(250e8);
        _setGoal(depositor, beneficiary);

        assertEq(goals.goalOf(depositor).startStockPriceUsd, 250 * USD);
        assertEq(goals.goalOf(depositor).beneficiary, beneficiary);
        assertEq(goals.goalCount(), 2);
        assertEq(goals.activeGoals(), 1, "still one goal per account");

        _setGoal(stranger, address(0));
        assertEq(goals.activeGoals(), 2);
    }

    function test_ClearGoal() public {
        _setGoal(depositor, address(0));

        vm.expectEmit(true, true, false, false);
        emit IGoalRegistry.GoalCleared(depositor, REF);
        vm.prank(depositor);
        goals.clearGoal();

        assertFalse(goals.hasGoal(depositor));
        assertEq(goals.goalOf(depositor).createdAt, 0, "no goal reads as an empty goal");
        assertEq(goals.activeGoals(), 0);
        assertEq(goals.goalCount(), 1);

        vm.expectRevert(abi.encodeWithSelector(IGoalRegistry.NoGoal.selector, depositor));
        vm.prank(depositor);
        goals.clearGoal();
    }

    function test_SetGoal_RejectsInvalidInput() public {
        vm.startPrank(depositor);

        vm.expectRevert(IGoalRegistry.InvalidProperty.selector);
        goals.setGoal(bytes32(0), KEY, address(stock), 1 * USD, 1 * USD, address(0));

        vm.expectRevert(IGoalRegistry.InvalidProperty.selector);
        goals.setGoal(REF, "", address(stock), 1 * USD, 1 * USD, address(0));

        vm.expectRevert(IGoalRegistry.InvalidProperty.selector);
        goals.setGoal(REF, string(new bytes(513)), address(stock), 1 * USD, 1 * USD, address(0));

        vm.expectRevert(IGoalRegistry.InvalidAmount.selector);
        goals.setGoal(REF, KEY, address(stock), 0, 1 * USD, address(0));

        vm.expectRevert(IGoalRegistry.InvalidBeneficiary.selector);
        goals.setGoal(REF, KEY, address(stock), 1 * USD, 1 * USD, depositor);

        vm.expectRevert(abi.encodeWithSelector(IStockOracle.StockNotListed.selector, stranger));
        goals.setGoal(REF, KEY, stranger, 1 * USD, 1 * USD, address(0));

        vm.stopPrank();

        vm.prank(owner);
        oracle.setStock(address(stock), address(feed), RATIO_BPS, false);
        vm.expectRevert(abi.encodeWithSelector(IGoalRegistry.StockNotEnabled.selector, address(stock)));
        vm.prank(depositor);
        goals.setGoal(REF, KEY, address(stock), 1 * USD, 1 * USD, address(0));
    }

    function _setGoal(address account, address beneficiary_) private {
        vm.prank(account);
        goals.setGoal(REF, KEY, address(stock), 12_500 * USD, 250_000 * USD, beneficiary_);
    }
}
