// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";

import {GoalRegistry} from "../src/GoalRegistry.sol";
import {ReservationEscrow} from "../src/ReservationEscrow.sol";
import {StockOracle} from "../src/StockOracle.sol";
import {DemoExchange} from "../src/mocks/DemoExchange.sol";
import {MockPriceFeed} from "../src/mocks/MockPriceFeed.sol";
import {MockStockToken} from "../src/mocks/MockStockToken.sol";
import {MockUSDC} from "../src/mocks/MockUSDC.sol";
import {MockWARS} from "../src/mocks/MockWARS.sol";

/// @notice The full local deployment: oracle, escrow, goals, mocks and the demo exchange as router.
abstract contract Fixture is Test {
    uint256 internal constant USD = 1e18;
    uint256 internal constant SHARE = 1e8; // stock tokens use 8 decimals, like the Coinbase B20 stocks
    uint256 internal constant DOLLAR = 1e6; // USDC units
    uint256 internal constant PESO = 1e18; // wARS units
    int256 internal constant PRICE = 200e8; // $200 per share, 8 feed decimals
    int256 internal constant ARS_PER_USD = 1_500e8; // USD / ARS feed, 8 decimals

    uint64 internal constant DISPUTE_WINDOW = 3 days;
    uint64 internal constant CLAIM_WINDOW = 15 days;
    uint64 internal constant ARBITRATION_TIMEOUT = 14 days;
    uint16 internal constant RATIO_BPS = 12_500;
    uint16 internal constant FEE_BPS = 100;
    uint16 internal constant SLIPPAGE_BPS = 200;
    uint16 internal constant EXCHANGE_FEE_BPS = 50;

    address internal owner = makeAddr("owner");
    address internal depositor = makeAddr("depositor");
    address internal beneficiary = makeAddr("beneficiary");
    address internal arbiter = makeAddr("arbiter");
    address internal defaultArbiter = makeAddr("defaultArbiter");
    address internal treasury = makeAddr("treasury");
    address internal stranger = makeAddr("stranger");

    StockOracle internal oracle;
    ReservationEscrow internal escrow;
    GoalRegistry internal goals;
    DemoExchange internal exchange;
    MockStockToken internal stock;
    MockPriceFeed internal feed;
    MockUSDC internal usdc;
    MockWARS internal wars;
    MockPriceFeed internal arsFeed;

    function setUp() public virtual {
        vm.warp(1_800_000_000);

        vm.startPrank(owner);
        oracle = new StockOracle(owner, 1 days, 4 days);
        stock = new MockStockToken("Apple Inc.", "AAPLc", 8, address(0xA), owner);
        feed = new MockPriceFeed(8, "AAPL / USD", PRICE, false);
        oracle.setStock(address(stock), address(feed), RATIO_BPS, true);

        usdc = new MockUSDC(1_000 * DOLLAR, owner);
        wars = new MockWARS(1_500_000 * PESO, owner);
        arsFeed = new MockPriceFeed(8, "USD / ARS", ARS_PER_USD, false);

        exchange = new DemoExchange(owner, oracle, address(usdc), treasury, EXCHANGE_FEE_BPS);
        exchange.setPayToken(address(wars), address(arsFeed), true, true);
        stock.setMinter(address(exchange));
        usdc.setMinter(address(exchange));
        wars.setMinter(address(exchange));

        escrow = new ReservationEscrow(
            owner,
            ReservationEscrow.Config({
                oracle: oracle,
                usdc: address(usdc),
                maxSlippageBps: SLIPPAGE_BPS,
                disputeWindow: DISPUTE_WINDOW,
                claimWindow: CLAIM_WINDOW,
                arbitrationTimeout: ARBITRATION_TIMEOUT,
                defaultArbiter: defaultArbiter,
                treasury: treasury,
                feeBps: FEE_BPS
            })
        );
        escrow.setRouter(address(exchange), true);
        goals = new GoalRegistry(oracle);
        vm.stopPrank();
    }

    /// @dev Mints stock straight to `account`, as if it had been bought on the exchange.
    function _giveStock(address account, uint256 amount) internal {
        vm.prank(address(exchange));
        stock.mint(account, amount);
    }

    function _setPrice(int256 price) internal {
        vm.prank(owner);
        feed.setAnswer(price);
    }
}
