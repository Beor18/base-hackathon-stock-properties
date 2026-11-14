// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";

import {GuaranteeEscrow} from "../src/GuaranteeEscrow.sol";
import {StockOracle} from "../src/StockOracle.sol";
import {IGuaranteeEscrow} from "../src/interfaces/IGuaranteeEscrow.sol";
import {IStockOracle} from "../src/interfaces/IStockOracle.sol";
import {MockPriceFeed} from "../src/mocks/MockPriceFeed.sol";
import {MockStockToken} from "../src/mocks/MockStockToken.sol";

/// @notice Covers every path that moves stock in or out of the escrow.
contract GuaranteeEscrowTest is Test {
    uint256 private constant USD = 1e18;
    uint256 private constant SHARE = 1e8; // stock tokens use 8 decimals, like the Coinbase B20 stocks
    int256 private constant PRICE = 200e8; // $200 per share, 8 feed decimals

    uint64 private constant DISPUTE_WINDOW = 3 days;
    uint64 private constant CLAIM_WINDOW = 15 days;
    uint64 private constant ARBITRATION_TIMEOUT = 14 days;
    uint16 private constant RATIO_BPS = 12_500;
    uint16 private constant FEE_BPS = 100;

    address private owner = makeAddr("owner");
    address private tenant = makeAddr("tenant");
    address private landlord = makeAddr("landlord");
    address private arbiter = makeAddr("arbiter");
    address private defaultArbiter = makeAddr("defaultArbiter");
    address private treasury = makeAddr("treasury");
    address private stranger = makeAddr("stranger");

    StockOracle private oracle;
    GuaranteeEscrow private escrow;
    MockStockToken private stock;
    MockPriceFeed private feed;

    uint64 private leaseEnd;

    function setUp() public {
        vm.warp(1_800_000_000);
        leaseEnd = uint64(block.timestamp + 365 days);

        stock = new MockStockToken("Apple Inc.", "AAPLc", 8, address(0), 100);
        vm.prank(owner);
        feed = new MockPriceFeed(8, "AAPL / USD", PRICE, false);

        oracle = new StockOracle(owner, 1 days, 4 days);
        vm.prank(owner);
        oracle.setStock(address(stock), address(feed), RATIO_BPS, true);

        escrow = new GuaranteeEscrow(
            owner, oracle, DISPUTE_WINDOW, CLAIM_WINDOW, ARBITRATION_TIMEOUT, defaultArbiter, treasury, FEE_BPS
        );

        vm.startPrank(tenant);
        stock.faucet();
        stock.approve(address(escrow), type(uint256).max);
        vm.stopPrank();
    }

    // ───────────────────────────── Create ─────────────────────────────

    function test_Create_LocksCollateralAndChargesFee() public {
        // $2,000 coverage at 125% needs $2,500 of stock = 12.5 shares at $200.
        uint256 id = _create(2_000 * USD, 12.5e8);

        IGuaranteeEscrow.Guarantee memory guarantee = escrow.getGuarantee(id);
        assertEq(guarantee.tenant, tenant);
        assertEq(guarantee.landlord, landlord);
        assertEq(guarantee.arbiter, arbiter);
        assertEq(guarantee.collateral, 12.5e8);
        assertEq(guarantee.coverageUsd, 2_000 * USD);
        assertEq(uint8(guarantee.status), uint8(IGuaranteeEscrow.Status.Active));

        assertEq(stock.balanceOf(address(escrow)), 12.5e8);
        assertEq(stock.balanceOf(treasury), 0.1e8, "1% of $2,000 = $20 = 0.1 share");
        assertEq(escrow.guaranteeIdsOf(tenant)[0], id);
        assertEq(escrow.guaranteeIdsOf(landlord)[0], id);
        assertEq(escrow.activeGuaranteeCount(), 1);
        assertEq(escrow.activeCoverageUsd(), 2_000 * USD);
    }

    function test_Create_UsesDefaultArbiterWhenNoneGiven() public {
        vm.prank(tenant);
        uint256 id = escrow.createGuarantee(_params(address(0), 2_000 * USD, 12.5e8));
        assertEq(escrow.getGuarantee(id).arbiter, defaultArbiter);
    }

    function test_Create_RevertsBelowCollateralRatio() public {
        vm.expectRevert(
            abi.encodeWithSelector(IGuaranteeEscrow.InsufficientCollateral.selector, 2_400 * USD, 2_500 * USD)
        );
        vm.prank(tenant);
        escrow.createGuarantee(_params(arbiter, 2_000 * USD, 12e8));
    }

    function test_Create_RevertsWhenPartiesOverlap() public {
        IGuaranteeEscrow.CreateParams memory params = _params(arbiter, 2_000 * USD, 12.5e8);
        params.landlord = tenant;
        vm.expectRevert(IGuaranteeEscrow.InvalidParties.selector);
        vm.prank(tenant);
        escrow.createGuarantee(params);

        vm.expectRevert(IGuaranteeEscrow.InvalidParties.selector);
        vm.prank(tenant);
        escrow.createGuarantee(_params(landlord, 2_000 * USD, 12.5e8));
    }

    function test_Create_RevertsForDisabledStockAndPastEndDate() public {
        vm.prank(owner);
        oracle.setStock(address(stock), address(feed), RATIO_BPS, false);
        vm.expectRevert(abi.encodeWithSelector(IGuaranteeEscrow.StockNotEnabled.selector, address(stock)));
        vm.prank(tenant);
        escrow.createGuarantee(_params(arbiter, 2_000 * USD, 12.5e8));

        vm.prank(owner);
        oracle.setStock(address(stock), address(feed), RATIO_BPS, true);
        IGuaranteeEscrow.CreateParams memory params = _params(arbiter, 2_000 * USD, 12.5e8);
        params.endsAt = uint64(block.timestamp);
        vm.expectRevert(IGuaranteeEscrow.InvalidEndDate.selector);
        vm.prank(tenant);
        escrow.createGuarantee(params);
    }

    function test_Create_AcceptsWeekendPriceButRejectsLongStalePrice() public {
        // A price from the last market close (3 days ago) is fine to add collateral.
        vm.prank(owner);
        feed.setAnswerAt(PRICE, block.timestamp - 3 days);
        _create(2_000 * USD, 12.5e8);

        vm.prank(owner);
        feed.setAnswerAt(PRICE, block.timestamp - 5 days);
        vm.expectRevert();
        vm.prank(tenant);
        escrow.createGuarantee(_params(arbiter, 2_000 * USD, 12.5e8));
    }

    // ───────────────────────────── Collateral management ─────────────────────────────

    function test_TopUp_OpenToAnyone() public {
        uint256 id = _create(2_000 * USD, 12.5e8);

        vm.startPrank(stranger);
        stock.faucet();
        stock.approve(address(escrow), 1e8);
        escrow.topUp(id, 1e8);
        vm.stopPrank();

        assertEq(escrow.getGuarantee(id).collateral, 13.5e8);
    }

    function test_WithdrawExcess_AfterRallyKeepsRatio() public {
        uint256 id = _create(2_000 * USD, 12.5e8);
        _setPrice(250e8); // required collateral is now $2,500 / $250 = 10 shares

        uint256 balanceBefore = stock.balanceOf(tenant);
        vm.prank(tenant);
        escrow.withdrawExcess(id, 2.5e8);
        assertEq(stock.balanceOf(tenant) - balanceBefore, 2.5e8);

        vm.expectRevert();
        vm.prank(tenant);
        escrow.withdrawExcess(id, 1);
    }

    function test_WithdrawExcess_RequiresLivePriceAndNoClaim() public {
        uint256 id = _create(2_000 * USD, 20e8);

        vm.prank(owner);
        feed.setAnswerAt(PRICE, block.timestamp - 2 days);
        vm.expectRevert();
        vm.prank(tenant);
        escrow.withdrawExcess(id, 1e8);

        _setPrice(PRICE);
        vm.prank(landlord);
        escrow.fileClaim(id, 100 * USD, IGuaranteeEscrow.ClaimReason.Damages);
        vm.expectRevert(IGuaranteeEscrow.ClaimInProgress.selector);
        vm.prank(tenant);
        escrow.withdrawExcess(id, 1e8);
    }

    function test_ExtendLease_OnlyTenantAndOnlyForward() public {
        uint256 id = _create(2_000 * USD, 12.5e8);

        vm.expectRevert(IGuaranteeEscrow.NotTenant.selector);
        vm.prank(landlord);
        escrow.extendLease(id, leaseEnd + 30 days);

        vm.expectRevert(IGuaranteeEscrow.InvalidEndDate.selector);
        vm.prank(tenant);
        escrow.extendLease(id, leaseEnd);

        vm.prank(tenant);
        escrow.extendLease(id, leaseEnd + 365 days);
        assertEq(escrow.getGuarantee(id).endsAt, leaseEnd + 365 days);
    }

    // ───────────────────────────── Claims ─────────────────────────────

    function test_Claim_UndisputedIsPaidAfterDisputeWindow() public {
        uint256 id = _create(2_000 * USD, 12.5e8);

        vm.prank(landlord);
        escrow.fileClaim(id, 500 * USD, IGuaranteeEscrow.ClaimReason.UnpaidRent);

        vm.expectRevert(IGuaranteeEscrow.ClaimNotPayable.selector);
        escrow.settleClaim(id);

        vm.warp(block.timestamp + DISPUTE_WINDOW + 1);
        _setPrice(PRICE);
        vm.prank(stranger);
        escrow.settleClaim(id);

        IGuaranteeEscrow.Guarantee memory guarantee = escrow.getGuarantee(id);
        assertEq(stock.balanceOf(landlord), 2.5e8, "$500 at $200 = 2.5 shares");
        assertEq(guarantee.collateral, 10e8);
        assertEq(guarantee.coverageUsd, 1_500 * USD);
        assertEq(escrow.activeCoverageUsd(), 1_500 * USD);
        assertEq(uint8(guarantee.claim.status), uint8(IGuaranteeEscrow.ClaimStatus.None));
        assertEq(uint8(guarantee.status), uint8(IGuaranteeEscrow.Status.Active));
    }

    function test_Claim_AcceptedByTenantIsPaidImmediately() public {
        uint256 id = _create(2_000 * USD, 12.5e8);

        vm.prank(landlord);
        escrow.fileClaim(id, 500 * USD, IGuaranteeEscrow.ClaimReason.Damages);
        vm.prank(tenant);
        escrow.acceptClaim(id);
        escrow.settleClaim(id);

        assertEq(stock.balanceOf(landlord), 2.5e8);
    }

    function test_Claim_FullCoverageClosesAndReturnsBufferToTenant() public {
        uint256 id = _create(2_000 * USD, 12.5e8);
        uint256 tenantBalance = stock.balanceOf(tenant);

        vm.prank(landlord);
        escrow.fileClaim(id, 2_000 * USD, IGuaranteeEscrow.ClaimReason.UnpaidRent);
        vm.prank(tenant);
        escrow.acceptClaim(id);
        escrow.settleClaim(id);

        assertEq(stock.balanceOf(landlord), 10e8);
        assertEq(stock.balanceOf(tenant) - tenantBalance, 2.5e8, "over-collateral goes back to the tenant");
        assertEq(uint8(escrow.getGuarantee(id).status), uint8(IGuaranteeEscrow.Status.Closed));
        assertEq(stock.balanceOf(address(escrow)), 0);
    }

    function test_Claim_ShortfallPaysAllCollateralAfterCrash() public {
        uint256 id = _create(2_000 * USD, 12.5e8);
        _setPrice(100e8); // collateral is now worth $1,250, less than the $2,000 claim

        vm.prank(landlord);
        escrow.fileClaim(id, 2_000 * USD, IGuaranteeEscrow.ClaimReason.UnpaidRent);
        vm.prank(tenant);
        escrow.acceptClaim(id);

        vm.expectEmit(true, false, false, true);
        emit IGuaranteeEscrow.ClaimSettled(id, 12.5e8, 1_250 * USD);
        escrow.settleClaim(id);

        assertEq(stock.balanceOf(landlord), 12.5e8);
        assertEq(uint8(escrow.getGuarantee(id).status), uint8(IGuaranteeEscrow.Status.Closed));
    }

    function test_Claim_SettlementRequiresLivePrice() public {
        uint256 id = _create(2_000 * USD, 12.5e8);
        vm.prank(landlord);
        escrow.fileClaim(id, 500 * USD, IGuaranteeEscrow.ClaimReason.UnpaidRent);
        vm.prank(tenant);
        escrow.acceptClaim(id);

        vm.warp(block.timestamp + 2 days); // feed has not updated: markets closed
        vm.expectRevert();
        escrow.settleClaim(id);

        _setPrice(PRICE);
        escrow.settleClaim(id);
        assertEq(stock.balanceOf(landlord), 2.5e8);
    }

    function test_Dispute_ArbiterAwardsPartialAmount() public {
        uint256 id = _disputedClaim(1_000 * USD);

        vm.expectRevert(IGuaranteeEscrow.NotArbiter.selector);
        vm.prank(landlord);
        escrow.resolveDispute(id, 1_000 * USD);

        vm.prank(arbiter);
        escrow.resolveDispute(id, 400 * USD);
        escrow.settleClaim(id);

        assertEq(stock.balanceOf(landlord), 2e8, "$400 at $200 = 2 shares");
        assertEq(escrow.getGuarantee(id).coverageUsd, 1_600 * USD);
    }

    function test_Dispute_ArbiterRejectsClaim() public {
        uint256 id = _disputedClaim(1_000 * USD);

        vm.prank(arbiter);
        escrow.resolveDispute(id, 0);

        IGuaranteeEscrow.Guarantee memory guarantee = escrow.getGuarantee(id);
        assertEq(uint8(guarantee.claim.status), uint8(IGuaranteeEscrow.ClaimStatus.None));
        assertEq(guarantee.coverageUsd, 2_000 * USD);
        assertEq(stock.balanceOf(landlord), 0);
    }

    function test_Dispute_DefaultArbiterStepsInOnlyAfterTimeout() public {
        uint256 id = _disputedClaim(1_000 * USD);

        vm.expectRevert(IGuaranteeEscrow.NotArbiter.selector);
        vm.prank(defaultArbiter);
        escrow.resolveDispute(id, 1_000 * USD);

        vm.warp(block.timestamp + ARBITRATION_TIMEOUT + 1);
        vm.prank(defaultArbiter);
        escrow.resolveDispute(id, 1_000 * USD);
        assertEq(uint8(escrow.getGuarantee(id).claim.status), uint8(IGuaranteeEscrow.ClaimStatus.Approved));
    }

    function test_Dispute_OnlyInsideDisputeWindow() public {
        uint256 id = _create(2_000 * USD, 12.5e8);
        vm.prank(landlord);
        escrow.fileClaim(id, 500 * USD, IGuaranteeEscrow.ClaimReason.Damages);

        vm.warp(block.timestamp + DISPUTE_WINDOW + 1);
        vm.expectRevert(IGuaranteeEscrow.DisputeWindowClosed.selector);
        vm.prank(tenant);
        escrow.disputeClaim(id);
    }

    function test_Claim_OnlyLandlordWithinCoverageAndClaimWindow() public {
        uint256 id = _create(2_000 * USD, 12.5e8);

        vm.expectRevert(IGuaranteeEscrow.NotLandlord.selector);
        vm.prank(stranger);
        escrow.fileClaim(id, 500 * USD, IGuaranteeEscrow.ClaimReason.Other);

        vm.expectRevert(IGuaranteeEscrow.InvalidAmount.selector);
        vm.prank(landlord);
        escrow.fileClaim(id, 2_001 * USD, IGuaranteeEscrow.ClaimReason.Other);

        vm.warp(leaseEnd + CLAIM_WINDOW + 1);
        vm.expectRevert(IGuaranteeEscrow.ClaimWindowClosed.selector);
        vm.prank(landlord);
        escrow.fileClaim(id, 500 * USD, IGuaranteeEscrow.ClaimReason.Other);
    }

    function test_Claim_LandlordCanWithdrawIt() public {
        uint256 id = _disputedClaim(1_000 * USD);
        vm.prank(landlord);
        escrow.withdrawClaim(id);
        assertEq(uint8(escrow.getGuarantee(id).claim.status), uint8(IGuaranteeEscrow.ClaimStatus.None));
    }

    // ───────────────────────────── Release ─────────────────────────────

    function test_Release_LandlordCanReleaseEarly() public {
        uint256 id = _create(2_000 * USD, 12.5e8);
        uint256 tenantBalance = stock.balanceOf(tenant);

        vm.prank(landlord);
        escrow.release(id);

        assertEq(stock.balanceOf(tenant) - tenantBalance, 12.5e8);
        assertEq(uint8(escrow.getGuarantee(id).status), uint8(IGuaranteeEscrow.Status.Closed));
        assertEq(escrow.activeGuaranteeCount(), 0);
        assertEq(escrow.activeCoverageUsd(), 0);

        vm.expectRevert(abi.encodeWithSelector(IGuaranteeEscrow.NotActive.selector, id));
        vm.prank(landlord);
        escrow.release(id);
    }

    function test_Release_AnyoneAfterLeaseAndClaimWindow() public {
        uint256 id = _create(2_000 * USD, 12.5e8);
        uint256 tenantBalance = stock.balanceOf(tenant);

        vm.expectRevert(IGuaranteeEscrow.LeaseNotOver.selector);
        vm.prank(tenant);
        escrow.release(id);

        vm.warp(leaseEnd + CLAIM_WINDOW + 1);
        vm.prank(stranger);
        escrow.release(id);

        assertEq(stock.balanceOf(tenant) - tenantBalance, 12.5e8, "collateral always returns to the tenant");
    }

    function test_Release_BlockedWhileClaimIsOpen() public {
        uint256 id = _create(2_000 * USD, 12.5e8);
        vm.warp(leaseEnd + 1);
        vm.prank(landlord);
        escrow.fileClaim(id, 500 * USD, IGuaranteeEscrow.ClaimReason.Damages);

        vm.warp(leaseEnd + CLAIM_WINDOW + 1);
        vm.expectRevert(IGuaranteeEscrow.ClaimInProgress.selector);
        vm.prank(tenant);
        escrow.release(id);
    }

    // ───────────────────────────── Oracle and admin ─────────────────────────────

    function testFuzz_Oracle_ConversionRoundTrip(uint256 amount, uint256 price) public {
        amount = bound(amount, 1, 1_000_000 * SHARE);
        price = bound(price, 1e6, 100_000e8); // $0.01 to $100,000 per share
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
        vm.expectRevert(abi.encodeWithSelector(IGuaranteeEscrow.FeeTooHigh.selector, uint16(301)));
        escrow.setFee(301);
        escrow.setFee(0);
        vm.stopPrank();

        _create(2_000 * USD, 12.5e8);
        assertEq(stock.balanceOf(treasury), 0);
    }

    // ───────────────────────────── Helpers ─────────────────────────────

    function _params(address arbiter_, uint256 coverageUsd, uint256 collateral)
        private
        view
        returns (IGuaranteeEscrow.CreateParams memory)
    {
        return IGuaranteeEscrow.CreateParams({
            landlord: landlord,
            arbiter: arbiter_,
            token: address(stock),
            collateral: collateral,
            coverageUsd: coverageUsd,
            endsAt: leaseEnd,
            leaseHash: keccak256("lease.pdf")
        });
    }

    function _create(uint256 coverageUsd, uint256 collateral) private returns (uint256 id) {
        vm.prank(tenant);
        id = escrow.createGuarantee(_params(arbiter, coverageUsd, collateral));
    }

    function _disputedClaim(uint256 amountUsd) private returns (uint256 id) {
        id = _create(2_000 * USD, 12.5e8);
        vm.prank(landlord);
        escrow.fileClaim(id, amountUsd, IGuaranteeEscrow.ClaimReason.Damages);
        vm.prank(tenant);
        escrow.disputeClaim(id);
    }

    function _setPrice(int256 price) private {
        vm.prank(owner);
        feed.setAnswer(price);
    }
}
