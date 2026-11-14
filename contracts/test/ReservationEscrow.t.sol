// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {ReservationEscrow} from "../src/ReservationEscrow.sol";
import {IReservationEscrow} from "../src/interfaces/IReservationEscrow.sol";
import {IStockOracle} from "../src/interfaces/IStockOracle.sol";
import {DemoExchange} from "../src/mocks/DemoExchange.sol";
import {Fixture} from "./Fixture.sol";

/// @notice Router double that pulls and pays whatever the test asks, to break the escrow's assumptions.
contract StubRouter {
    function swap(IERC20 tokenIn, uint256 amountIn, IERC20 tokenOut, uint256 amountOut) external {
        require(tokenIn.transferFrom(msg.sender, address(this), amountIn));
        require(tokenOut.transfer(msg.sender, amountOut));
    }

    function fail() external pure {
        revert("no route");
    }
}

/// @notice Covers every path that moves stock or USDC in or out of the escrow.
contract ReservationEscrowTest is Fixture {
    uint64 private closingDate;
    StubRouter private stub;

    function setUp() public override {
        super.setUp();
        closingDate = uint64(block.timestamp + 90 days);

        stub = new StubRouter();
        vm.prank(owner);
        escrow.setRouter(address(stub), true);

        _giveStock(depositor, 100 * SHARE);
        vm.prank(depositor);
        stock.approve(address(escrow), type(uint256).max);
    }

    // ───────────────────────────── Create ─────────────────────────────

    function test_Create_LocksCollateralAndChargesFee() public {
        // $2,000 coverage at 125% needs $2,500 of stock = 12.5 shares at $200.
        uint256 id = _create(2_000 * USD, 12.5e8);

        IReservationEscrow.Reservation memory reservation = escrow.getReservation(id);
        assertEq(reservation.depositor, depositor);
        assertEq(reservation.beneficiary, beneficiary);
        assertEq(reservation.arbiter, arbiter);
        assertEq(reservation.collateral, 12.5e8);
        assertEq(reservation.coverageUsd, 2_000 * USD);
        assertEq(reservation.propertyRef, keccak256("smarlin:123"));
        assertEq(uint8(reservation.status), uint8(IReservationEscrow.Status.Active));

        assertEq(stock.balanceOf(address(escrow)), 12.5e8);
        assertEq(stock.balanceOf(treasury), 0.1e8, "1% of $2,000 = $20 = 0.1 share");
        assertEq(escrow.reservationIdsOf(depositor)[0], id);
        assertEq(escrow.reservationIdsOf(beneficiary)[0], id);
        assertEq(escrow.reservationCount(), 1);
        assertEq(escrow.activeReservationCount(), 1);
        assertEq(escrow.activeCoverageUsd(), 2_000 * USD);
    }

    function test_Create_UsesDefaultArbiterWhenNoneGiven() public {
        vm.prank(depositor);
        uint256 id = escrow.createReservation(_params(address(0), 2_000 * USD, 12.5e8));
        assertEq(escrow.getReservation(id).arbiter, defaultArbiter);
    }

    function test_Create_RevertsBelowCollateralRatio() public {
        vm.expectRevert(
            abi.encodeWithSelector(IReservationEscrow.InsufficientCollateral.selector, 2_400 * USD, 2_500 * USD)
        );
        vm.prank(depositor);
        escrow.createReservation(_params(arbiter, 2_000 * USD, 12e8));
    }

    function test_Create_RevertsWhenPartiesOverlap() public {
        IReservationEscrow.CreateParams memory params = _params(arbiter, 2_000 * USD, 12.5e8);
        params.beneficiary = depositor;
        vm.expectRevert(IReservationEscrow.InvalidParties.selector);
        vm.prank(depositor);
        escrow.createReservation(params);

        vm.expectRevert(IReservationEscrow.InvalidParties.selector);
        vm.prank(depositor);
        escrow.createReservation(_params(beneficiary, 2_000 * USD, 12.5e8));
    }

    function test_Create_RevertsForDisabledStockAndPastEndDate() public {
        vm.prank(owner);
        oracle.setStock(address(stock), address(feed), RATIO_BPS, false);
        vm.expectRevert(abi.encodeWithSelector(IReservationEscrow.StockNotEnabled.selector, address(stock)));
        vm.prank(depositor);
        escrow.createReservation(_params(arbiter, 2_000 * USD, 12.5e8));

        vm.prank(owner);
        oracle.setStock(address(stock), address(feed), RATIO_BPS, true);
        IReservationEscrow.CreateParams memory params = _params(arbiter, 2_000 * USD, 12.5e8);
        params.endsAt = uint64(block.timestamp);
        vm.expectRevert(IReservationEscrow.InvalidEndDate.selector);
        vm.prank(depositor);
        escrow.createReservation(params);
    }

    function test_Create_AcceptsWeekendPriceButRejectsLongStalePrice() public {
        // A price from the last market close (3 days ago) is fine to add collateral.
        vm.prank(owner);
        feed.setAnswerAt(PRICE, block.timestamp - 3 days);
        _create(2_000 * USD, 12.5e8);

        uint256 updatedAt = block.timestamp - 5 days;
        vm.prank(owner);
        feed.setAnswerAt(PRICE, updatedAt);
        vm.expectRevert(abi.encodeWithSelector(IStockOracle.StalePrice.selector, address(stock), updatedAt, 4 days));
        vm.prank(depositor);
        escrow.createReservation(_params(arbiter, 2_000 * USD, 12.5e8));
    }

    // ───────────────────────────── Collateral management ─────────────────────────────

    function test_TopUp_OpenToAnyone() public {
        uint256 id = _create(2_000 * USD, 12.5e8);

        _giveStock(stranger, 1e8);
        vm.startPrank(stranger);
        stock.approve(address(escrow), 1e8);
        escrow.topUp(id, 1e8);
        vm.stopPrank();

        assertEq(escrow.getReservation(id).collateral, 13.5e8);
    }

    function test_WithdrawExcess_AfterRallyKeepsRatio() public {
        uint256 id = _create(2_000 * USD, 12.5e8);
        _setPrice(250e8); // required collateral is now $2,500 / $250 = 10 shares

        uint256 balanceBefore = stock.balanceOf(depositor);
        vm.prank(depositor);
        escrow.withdrawExcess(id, 2.5e8);
        assertEq(stock.balanceOf(depositor) - balanceBefore, 2.5e8);

        vm.expectRevert();
        vm.prank(depositor);
        escrow.withdrawExcess(id, 1);
    }

    function test_WithdrawExcess_RequiresLivePriceAndNoClaim() public {
        uint256 id = _create(2_000 * USD, 20e8);

        vm.prank(owner);
        feed.setAnswerAt(PRICE, block.timestamp - 2 days);
        vm.expectRevert(
            abi.encodeWithSelector(IStockOracle.StalePrice.selector, address(stock), block.timestamp - 2 days, 1 days)
        );
        vm.prank(depositor);
        escrow.withdrawExcess(id, 1e8);

        _setPrice(PRICE);
        vm.prank(beneficiary);
        escrow.fileClaim(id, 100 * USD, IReservationEscrow.ClaimReason.Damages);
        vm.expectRevert(IReservationEscrow.ClaimInProgress.selector);
        vm.prank(depositor);
        escrow.withdrawExcess(id, 1e8);
    }

    function test_ExtendEndDate_OnlyDepositorAndOnlyForward() public {
        uint256 id = _create(2_000 * USD, 12.5e8);

        vm.expectRevert(IReservationEscrow.NotDepositor.selector);
        vm.prank(beneficiary);
        escrow.extendEndDate(id, closingDate + 30 days);

        vm.expectRevert(IReservationEscrow.InvalidEndDate.selector);
        vm.prank(depositor);
        escrow.extendEndDate(id, closingDate);

        vm.prank(depositor);
        escrow.extendEndDate(id, closingDate + 30 days);
        assertEq(escrow.getReservation(id).endsAt, closingDate + 30 days);
    }

    // ───────────────────────────── Claims ─────────────────────────────

    function test_Claim_UndisputedIsPaidInUsdcAfterDisputeWindow() public {
        uint256 id = _create(2_000 * USD, 12.5e8);

        vm.prank(beneficiary);
        escrow.fileClaim(id, 500 * USD, IReservationEscrow.ClaimReason.BackedOut);

        bytes memory sellCall = _sellCall(id);
        vm.expectRevert(IReservationEscrow.ClaimNotPayable.selector);
        escrow.settleClaim(id, address(exchange), sellCall);

        vm.warp(block.timestamp + DISPUTE_WINDOW + 1);
        _setPrice(PRICE);
        (uint256 tokensIn,) = escrow.settlementQuote(id);
        // $500 / (1 - 2%) = $510.20 of stock at $200 = 2.55102040 shares.
        assertEq(tokensIn, 255_102_040);

        vm.prank(stranger);
        escrow.settleClaim(id, address(exchange), _sellCall(id));

        IReservationEscrow.Reservation memory reservation = escrow.getReservation(id);
        assertEq(usdc.balanceOf(beneficiary), 500 * DOLLAR, "the claim is paid in full, in USDC");
        assertEq(stock.balanceOf(beneficiary), 0, "the beneficiary never receives stock");
        // The exchange paid $510.20408 minus its 0.5% fee; what the claim did not use goes back.
        assertEq(usdc.balanceOf(depositor), 507_653_060 - 500 * DOLLAR);
        assertEq(reservation.collateral, 12.5e8 - tokensIn);
        assertEq(reservation.coverageUsd, 1_500 * USD);
        assertEq(escrow.activeCoverageUsd(), 1_500 * USD);
        assertEq(uint8(reservation.claim.status), uint8(IReservationEscrow.ClaimStatus.None));
        assertEq(uint8(reservation.status), uint8(IReservationEscrow.Status.Active));
        assertEq(stock.allowance(address(escrow), address(exchange)), 0, "approval is reset");
        assertEq(usdc.balanceOf(address(escrow)), 0);
    }

    function test_Claim_AcceptedByDepositorIsPaidImmediately() public {
        uint256 id = _create(2_000 * USD, 12.5e8);

        vm.prank(beneficiary);
        escrow.fileClaim(id, 500 * USD, IReservationEscrow.ClaimReason.BackedOut);
        vm.prank(depositor);
        escrow.acceptClaim(id);
        _settle(id);

        assertEq(usdc.balanceOf(beneficiary), 500 * DOLLAR);
    }

    function test_Claim_FullCoverageClosesAndReturnsTheRestToDepositor() public {
        uint256 id = _create(2_000 * USD, 12.5e8);
        uint256 depositorStock = stock.balanceOf(depositor);

        vm.prank(beneficiary);
        escrow.fileClaim(id, 2_000 * USD, IReservationEscrow.ClaimReason.BackedOut);
        vm.prank(depositor);
        escrow.acceptClaim(id);
        (uint256 tokensIn,) = escrow.settlementQuote(id);
        _settle(id);

        assertEq(usdc.balanceOf(beneficiary), 2_000 * DOLLAR);
        assertGt(usdc.balanceOf(depositor), 0, "unused slippage allowance goes back in USDC");
        assertEq(stock.balanceOf(depositor) - depositorStock, 12.5e8 - tokensIn, "unsold stock goes back");
        assertEq(uint8(escrow.getReservation(id).status), uint8(IReservationEscrow.Status.Closed));
        assertEq(escrow.activeReservationCount(), 0);
        assertEq(escrow.activeCoverageUsd(), 0);
        assertEq(stock.balanceOf(address(escrow)), 0);
    }

    function test_Claim_ShortfallSellsAllCollateralAfterCrash() public {
        uint256 id = _create(2_000 * USD, 12.5e8);
        _setPrice(100e8); // collateral is now worth $1,250, less than the $2,000 claim

        vm.prank(beneficiary);
        escrow.fileClaim(id, 2_000 * USD, IReservationEscrow.ClaimReason.BackedOut);
        vm.prank(depositor);
        escrow.acceptClaim(id);

        (uint256 tokensIn, uint256 minUsdcOut) = escrow.settlementQuote(id);
        assertEq(tokensIn, 12.5e8);
        assertEq(minUsdcOut, 1_225 * DOLLAR, "$1,250 minus 2%");

        vm.expectEmit(true, true, false, true);
        emit IReservationEscrow.ClaimSettled(id, address(exchange), 12.5e8, 1_243.75e6, 0);
        _settle(id);

        assertEq(usdc.balanceOf(beneficiary), 1_243.75e6, "everything the sale raised");
        assertEq(usdc.balanceOf(depositor), 0);
        assertEq(uint8(escrow.getReservation(id).status), uint8(IReservationEscrow.Status.Closed));
    }

    function test_Claim_SettlementRequiresLivePrice() public {
        uint256 id = _acceptedClaim(500 * USD);
        uint256 updatedAt = block.timestamp;

        vm.warp(block.timestamp + 2 days); // feed has not updated: markets closed
        bytes memory sellCall = abi.encodeCall(DemoExchange.sell, (address(stock), 1e8, 0, address(escrow)));
        vm.expectRevert(abi.encodeWithSelector(IStockOracle.StalePrice.selector, address(stock), updatedAt, 1 days));
        escrow.settleClaim(id, address(exchange), sellCall);

        _setPrice(PRICE);
        _settle(id);
        assertEq(usdc.balanceOf(beneficiary), 500 * DOLLAR);
    }

    function test_Settle_RevertsForRouterNotInWhitelist() public {
        uint256 id = _acceptedClaim(500 * USD);
        bytes memory sellCall = _sellCall(id);

        vm.expectRevert(abi.encodeWithSelector(IReservationEscrow.RouterNotAllowed.selector, stranger));
        escrow.settleClaim(id, stranger, sellCall);

        vm.prank(owner);
        escrow.setRouter(address(exchange), false);
        vm.expectRevert(abi.encodeWithSelector(IReservationEscrow.RouterNotAllowed.selector, address(exchange)));
        escrow.settleClaim(id, address(exchange), sellCall);
    }

    function test_Settle_RevertsWhenSlippageExceeded() public {
        uint256 id = _acceptedClaim(500 * USD);
        (uint256 tokensIn, uint256 minUsdcOut) = escrow.settlementQuote(id);
        deal(address(usdc), address(stub), minUsdcOut);

        bytes memory badSwap = _stubSwap(tokensIn, minUsdcOut - 1);
        vm.expectRevert(
            abi.encodeWithSelector(IReservationEscrow.SlippageExceeded.selector, minUsdcOut - 1, minUsdcOut)
        );
        escrow.settleClaim(id, address(stub), badSwap);

        // Exactly the minimum is accepted.
        escrow.settleClaim(id, address(stub), _stubSwap(tokensIn, minUsdcOut));
        assertEq(usdc.balanceOf(beneficiary), minUsdcOut);
    }

    function test_Settle_RevertsWhenRouterSellsADifferentAmount() public {
        uint256 id = _acceptedClaim(500 * USD);
        (uint256 tokensIn, uint256 minUsdcOut) = escrow.settlementQuote(id);
        deal(address(usdc), address(stub), 10 * minUsdcOut);

        bytes memory partialSwap = _stubSwap(tokensIn - 1, minUsdcOut);
        vm.expectRevert(abi.encodeWithSelector(IReservationEscrow.SwapAmountMismatch.selector, tokensIn, tokensIn - 1));
        escrow.settleClaim(id, address(stub), partialSwap);

        // Pulling more than the exact approval fails inside the router.
        bytes memory greedySwap = _stubSwap(tokensIn + 1, minUsdcOut);
        vm.expectRevert();
        escrow.settleClaim(id, address(stub), greedySwap);
    }

    function test_Settle_BubblesRouterFailure() public {
        uint256 id = _acceptedClaim(500 * USD);
        bytes memory reason = abi.encodeWithSignature("Error(string)", "no route");
        vm.expectRevert(abi.encodeWithSelector(IReservationEscrow.SwapFailed.selector, reason));
        escrow.settleClaim(id, address(stub), abi.encodeCall(StubRouter.fail, ()));
    }

    function test_Dispute_ArbiterAwardsPartialAmount() public {
        uint256 id = _disputedClaim(1_000 * USD);

        vm.expectRevert(IReservationEscrow.NotArbiter.selector);
        vm.prank(beneficiary);
        escrow.resolveDispute(id, 1_000 * USD);

        vm.prank(arbiter);
        escrow.resolveDispute(id, 400 * USD);
        _settle(id);

        assertEq(usdc.balanceOf(beneficiary), 400 * DOLLAR);
        assertEq(escrow.getReservation(id).coverageUsd, 1_600 * USD);
    }

    function test_Dispute_ArbiterRejectsClaim() public {
        uint256 id = _disputedClaim(1_000 * USD);

        vm.prank(arbiter);
        escrow.resolveDispute(id, 0);

        IReservationEscrow.Reservation memory reservation = escrow.getReservation(id);
        assertEq(uint8(reservation.claim.status), uint8(IReservationEscrow.ClaimStatus.None));
        assertEq(reservation.coverageUsd, 2_000 * USD);
        assertEq(usdc.balanceOf(beneficiary), 0);
    }

    function test_Dispute_DefaultArbiterStepsInOnlyAfterTimeout() public {
        uint256 id = _disputedClaim(1_000 * USD);

        vm.expectRevert(IReservationEscrow.NotArbiter.selector);
        vm.prank(defaultArbiter);
        escrow.resolveDispute(id, 1_000 * USD);

        vm.warp(block.timestamp + ARBITRATION_TIMEOUT + 1);
        vm.prank(defaultArbiter);
        escrow.resolveDispute(id, 1_000 * USD);
        assertEq(uint8(escrow.getReservation(id).claim.status), uint8(IReservationEscrow.ClaimStatus.Approved));
    }

    function test_Dispute_OnlyInsideDisputeWindow() public {
        uint256 id = _create(2_000 * USD, 12.5e8);
        vm.prank(beneficiary);
        escrow.fileClaim(id, 500 * USD, IReservationEscrow.ClaimReason.Damages);

        vm.warp(block.timestamp + DISPUTE_WINDOW + 1);
        vm.expectRevert(IReservationEscrow.DisputeWindowClosed.selector);
        vm.prank(depositor);
        escrow.disputeClaim(id);
    }

    function test_Claim_OnlyBeneficiaryWithinCoverageAndClaimWindow() public {
        uint256 id = _create(2_000 * USD, 12.5e8);

        vm.expectRevert(IReservationEscrow.NotBeneficiary.selector);
        vm.prank(stranger);
        escrow.fileClaim(id, 500 * USD, IReservationEscrow.ClaimReason.Other);

        vm.expectRevert(IReservationEscrow.InvalidAmount.selector);
        vm.prank(beneficiary);
        escrow.fileClaim(id, 2_001 * USD, IReservationEscrow.ClaimReason.Other);

        vm.warp(closingDate + CLAIM_WINDOW + 1);
        vm.expectRevert(IReservationEscrow.ClaimWindowClosed.selector);
        vm.prank(beneficiary);
        escrow.fileClaim(id, 500 * USD, IReservationEscrow.ClaimReason.Other);
    }

    function test_Claim_BeneficiaryCanWithdrawIt() public {
        uint256 id = _disputedClaim(1_000 * USD);
        vm.prank(beneficiary);
        escrow.withdrawClaim(id);
        assertEq(uint8(escrow.getReservation(id).claim.status), uint8(IReservationEscrow.ClaimStatus.None));

        vm.expectRevert(
            abi.encodeWithSelector(IReservationEscrow.NoClaimToAct.selector, IReservationEscrow.ClaimStatus.None)
        );
        escrow.settlementQuote(id);
    }

    // ───────────────────────────── Release ─────────────────────────────

    function test_Release_BeneficiaryCanReleaseEarly() public {
        uint256 id = _create(2_000 * USD, 12.5e8);
        uint256 depositorBalance = stock.balanceOf(depositor);

        vm.prank(beneficiary);
        escrow.release(id);

        assertEq(stock.balanceOf(depositor) - depositorBalance, 12.5e8);
        assertEq(uint8(escrow.getReservation(id).status), uint8(IReservationEscrow.Status.Closed));
        assertEq(escrow.activeReservationCount(), 0);
        assertEq(escrow.activeCoverageUsd(), 0);

        vm.expectRevert(abi.encodeWithSelector(IReservationEscrow.NotActive.selector, id));
        vm.prank(beneficiary);
        escrow.release(id);
    }

    function test_Release_AnyoneAfterEndDateAndClaimWindow() public {
        uint256 id = _create(2_000 * USD, 12.5e8);
        uint256 depositorBalance = stock.balanceOf(depositor);

        vm.expectRevert(IReservationEscrow.ReservationNotOver.selector);
        vm.prank(depositor);
        escrow.release(id);

        vm.warp(closingDate + CLAIM_WINDOW + 1);
        vm.prank(stranger);
        escrow.release(id);

        assertEq(stock.balanceOf(depositor) - depositorBalance, 12.5e8, "collateral always returns to the depositor");
    }

    function test_Release_BlockedWhileClaimIsOpen() public {
        uint256 id = _create(2_000 * USD, 12.5e8);
        vm.warp(closingDate + 1);
        vm.prank(beneficiary);
        escrow.fileClaim(id, 500 * USD, IReservationEscrow.ClaimReason.Damages);

        vm.warp(closingDate + CLAIM_WINDOW + 1);
        vm.expectRevert(IReservationEscrow.ClaimInProgress.selector);
        vm.prank(depositor);
        escrow.release(id);
    }

    // ───────────────────────────── Oracle and admin ─────────────────────────────

    function testFuzz_Oracle_ConversionRoundTrip(uint256 amount, uint256 price) public {
        amount = bound(amount, 1, 1_000_000 * SHARE);
        price = bound(price, 1e6, 100_000e8); // $0.01 to $100,000 per share
        // forge-lint: disable-next-line(unsafe-typecast) bounded above
        _setPrice(int256(price));

        uint256 usdValue = oracle.toUsd(address(stock), amount, IStockOracle.PriceUse.Settlement);
        uint256 roundTrip = oracle.toTokens(address(stock), usdValue, IStockOracle.PriceUse.Settlement);

        assertLe(roundTrip, amount, "conversion never creates value");
        assertApproxEqAbs(roundTrip, amount, 1);
    }

    function test_Oracle_RejectsInvalidListingsAndPrices() public {
        vm.startPrank(owner);
        vm.expectRevert(abi.encodeWithSelector(IStockOracle.InvalidCollateralRatio.selector, uint16(10_000)));
        oracle.setStock(address(stock), address(feed), 10_000, true);
        feed.setAnswer(0);
        vm.stopPrank();

        vm.expectRevert(abi.encodeWithSelector(IStockOracle.InvalidPrice.selector, address(stock), int256(0)));
        oracle.toUsd(address(stock), SHARE, IStockOracle.PriceUse.Collateral);

        vm.expectRevert(abi.encodeWithSelector(IStockOracle.StockNotListed.selector, stranger));
        oracle.getStock(stranger);
    }

    function test_Admin_FeeIsCappedAndOwnerOnly() public {
        vm.expectRevert();
        vm.prank(stranger);
        escrow.setFee(0);

        vm.startPrank(owner);
        vm.expectRevert(abi.encodeWithSelector(IReservationEscrow.FeeTooHigh.selector, uint16(301)));
        escrow.setFee(301);
        escrow.setFee(0);
        vm.stopPrank();

        _create(2_000 * USD, 12.5e8);
        assertEq(stock.balanceOf(treasury), 0);
    }

    function test_Admin_RoutersAreOwnerOnly() public {
        vm.expectRevert();
        vm.prank(stranger);
        escrow.setRouter(stranger, true);

        vm.prank(owner);
        vm.expectRevert(IReservationEscrow.ZeroAddress.selector);
        escrow.setRouter(address(0), true);
    }

    function test_Constructor_BoundsSlippage() public {
        ReservationEscrow.Config memory config = ReservationEscrow.Config({
            oracle: oracle,
            usdc: address(usdc),
            maxSlippageBps: 0,
            disputeWindow: DISPUTE_WINDOW,
            claimWindow: CLAIM_WINDOW,
            arbitrationTimeout: ARBITRATION_TIMEOUT,
            defaultArbiter: defaultArbiter,
            treasury: treasury,
            feeBps: FEE_BPS
        });
        vm.expectRevert(abi.encodeWithSelector(IReservationEscrow.InvalidSlippage.selector, uint16(0)));
        new ReservationEscrow(owner, config);

        config.maxSlippageBps = 1_001;
        vm.expectRevert(abi.encodeWithSelector(IReservationEscrow.InvalidSlippage.selector, uint16(1_001)));
        new ReservationEscrow(owner, config);
    }

    // ───────────────────────────── Helpers ─────────────────────────────

    function _params(address arbiter_, uint256 coverageUsd, uint256 collateral)
        private
        view
        returns (IReservationEscrow.CreateParams memory)
    {
        return IReservationEscrow.CreateParams({
            beneficiary: beneficiary,
            arbiter: arbiter_,
            token: address(stock),
            collateral: collateral,
            coverageUsd: coverageUsd,
            endsAt: closingDate,
            propertyRef: keccak256("smarlin:123")
        });
    }

    function _create(uint256 coverageUsd, uint256 collateral) private returns (uint256 id) {
        vm.prank(depositor);
        id = escrow.createReservation(_params(arbiter, coverageUsd, collateral));
    }

    function _acceptedClaim(uint256 amountUsd) private returns (uint256 id) {
        id = _create(2_000 * USD, 12.5e8);
        vm.prank(beneficiary);
        escrow.fileClaim(id, amountUsd, IReservationEscrow.ClaimReason.BackedOut);
        vm.prank(depositor);
        escrow.acceptClaim(id);
    }

    function _disputedClaim(uint256 amountUsd) private returns (uint256 id) {
        id = _create(2_000 * USD, 12.5e8);
        vm.prank(beneficiary);
        escrow.fileClaim(id, amountUsd, IReservationEscrow.ClaimReason.Damages);
        vm.prank(depositor);
        escrow.disputeClaim(id);
    }

    /// @dev The call a keeper would build for the demo exchange: sell the quoted amount to the escrow.
    function _sellCall(uint256 id) private view returns (bytes memory) {
        (uint256 tokensIn, uint256 minUsdcOut) = escrow.settlementQuote(id);
        return abi.encodeCall(DemoExchange.sell, (address(stock), tokensIn, minUsdcOut, address(escrow)));
    }

    function _settle(uint256 id) private {
        escrow.settleClaim(id, address(exchange), _sellCall(id));
    }

    function _stubSwap(uint256 amountIn, uint256 amountOut) private view returns (bytes memory) {
        return abi.encodeCall(StubRouter.swap, (stock, amountIn, usdc, amountOut));
    }
}
