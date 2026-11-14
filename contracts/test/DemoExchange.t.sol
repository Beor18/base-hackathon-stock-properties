// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IDemoExchange} from "../src/interfaces/IDemoExchange.sol";
import {MockERC20} from "../src/mocks/MockERC20.sol";
import {Fixture} from "./Fixture.sol";

/// @notice The demo market and the mock tokens it mints and burns.
contract DemoExchangeTest is Fixture {
    address private buyer = makeAddr("buyer");

    function setUp() public override {
        super.setUp();
        vm.startPrank(buyer);
        usdc.faucet();
        wars.faucet();
        usdc.approve(address(exchange), type(uint256).max);
        wars.approve(address(exchange), type(uint256).max);
        stock.approve(address(exchange), type(uint256).max);
        vm.stopPrank();
    }

    // ───────────────────────────── Faucet ─────────────────────────────

    function test_Faucet_TopsUpToCap() public {
        assertEq(usdc.balanceOf(buyer), 1_000 * DOLLAR);
        assertEq(wars.balanceOf(buyer), 1_500_000 * PESO);

        vm.expectRevert(abi.encodeWithSelector(MockERC20.FaucetCapReached.selector, 1_000 * DOLLAR, 1_000 * DOLLAR));
        vm.prank(buyer);
        usdc.faucet();

        vm.startPrank(buyer);
        require(usdc.transfer(stranger, 400 * DOLLAR));
        assertEq(usdc.faucet(), 400 * DOLLAR);
        vm.stopPrank();
        assertEq(usdc.balanceOf(buyer), 1_000 * DOLLAR);
    }

    function test_Faucet_DisabledForStocksAndMintIsMinterOnly() public {
        vm.expectRevert(MockERC20.FaucetDisabled.selector);
        vm.prank(buyer);
        stock.faucet();

        vm.expectRevert(MockERC20.NotMinter.selector);
        vm.prank(buyer);
        usdc.mint(buyer, 1);
    }

    // ───────────────────────────── Buy ─────────────────────────────

    function test_Buy_WithUsdcAtOraclePrice() public {
        uint256 supplyBefore = usdc.totalSupply();

        vm.prank(buyer);
        uint256 shares = exchange.buy(address(stock), address(usdc), 1_000 * DOLLAR, 0, buyer);

        // $1,000 minus the 0.5% fee = $995 of stock at $200 = 4.975 shares.
        assertEq(shares, 4.975e8);
        assertEq(stock.balanceOf(buyer), 4.975e8);
        assertEq(usdc.balanceOf(treasury), 5 * DOLLAR, "fee goes to the treasury");
        assertEq(usdc.balanceOf(address(exchange)), 0);
        assertEq(supplyBefore - usdc.totalSupply(), 995 * DOLLAR, "the rest is burned");
    }

    function test_Buy_WithWarsAtTheUsdArsRate() public {
        vm.prank(buyer);
        uint256 shares = exchange.buy(address(stock), address(wars), 1_500_000 * PESO, 0, buyer);

        // ARS 1,500,000 at 1,500 ARS per USD = $1,000, minus 0.5%.
        assertEq(shares, 4.975e8);
        assertEq(wars.balanceOf(treasury), 7_500 * PESO);
        assertEq(exchange.payTokenToUsd(address(wars), 1_500 * PESO), 1 * USD);
    }

    function test_Buy_QuoteMatchesAndMinOutIsEnforced() public {
        (uint256 quoted, uint256 fee) = exchange.quoteBuy(address(stock), address(usdc), 100 * DOLLAR);
        assertEq(quoted, 0.4975e8);
        assertEq(fee, 0.5e6);

        vm.expectRevert(abi.encodeWithSelector(IDemoExchange.InsufficientOutput.selector, quoted, quoted + 1));
        vm.prank(buyer);
        exchange.buy(address(stock), address(usdc), 100 * DOLLAR, quoted + 1, buyer);

        vm.prank(buyer);
        assertEq(exchange.buy(address(stock), address(usdc), 100 * DOLLAR, quoted, stranger), quoted);
        assertEq(stock.balanceOf(stranger), quoted, "recipient can differ from the payer");
    }

    function test_Buy_RevertsForDisabledTokens() public {
        vm.prank(owner);
        exchange.setPayToken(address(wars), address(arsFeed), true, false);
        vm.expectRevert(abi.encodeWithSelector(IDemoExchange.PayTokenNotEnabled.selector, address(wars)));
        vm.prank(buyer);
        exchange.buy(address(stock), address(wars), 1_000 * PESO, 0, buyer);

        vm.prank(owner);
        oracle.setStock(address(stock), address(feed), RATIO_BPS, false);
        vm.expectRevert(abi.encodeWithSelector(IDemoExchange.StockNotEnabled.selector, address(stock)));
        vm.prank(buyer);
        exchange.buy(address(stock), address(usdc), 1 * DOLLAR, 0, buyer);

        vm.expectRevert(IDemoExchange.InvalidAmount.selector);
        vm.prank(buyer);
        exchange.buy(address(stock), address(usdc), 0, 0, buyer);
    }

    // ───────────────────────────── Sell ─────────────────────────────

    function test_Sell_PaysUsdcMinusFeeAndBurnsStock() public {
        _giveStock(buyer, 1e8);

        vm.prank(buyer);
        uint256 dollars = exchange.sell(address(stock), 1e8, 199 * DOLLAR, buyer);

        assertEq(dollars, 199 * DOLLAR, "$200 minus 0.5%");
        assertEq(usdc.balanceOf(treasury), 1 * DOLLAR);
        assertEq(stock.balanceOf(buyer), 0);
        assertEq(stock.totalSupply(), 0);
    }

    function test_Sell_WorksForDisabledStocks() public {
        _giveStock(buyer, 1e8);
        vm.prank(owner);
        oracle.setStock(address(stock), address(feed), RATIO_BPS, false);

        vm.prank(buyer);
        assertEq(exchange.sell(address(stock), 1e8, 0, buyer), 199 * DOLLAR);
    }

    // ───────────────────────────── Admin ─────────────────────────────

    function test_Admin_FeeIsCappedAndOwnerOnly() public {
        vm.expectRevert();
        vm.prank(stranger);
        exchange.setFee(0);

        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(IDemoExchange.FeeTooHigh.selector, uint16(301)));
        exchange.setFee(301);
    }
}
