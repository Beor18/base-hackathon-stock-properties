// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable, Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

import {AggregatorV3Interface} from "../interfaces/AggregatorV3Interface.sol";
import {IDemoExchange} from "../interfaces/IDemoExchange.sol";
import {IStockOracle} from "../interfaces/IStockOracle.sol";
import {MockERC20} from "./MockERC20.sol";

/// @title DemoExchange
/// @notice Market maker for local chains and testnets. Prices stocks with the StockOracle and pay tokens
///         with their feeds, mints what it sells and burns what it buys, so it never runs out of liquidity.
/// @dev Must be the minter of every mock it trades. Never deployed on Base mainnet.
contract DemoExchange is IDemoExchange, Ownable2Step {
    using SafeERC20 for IERC20;

    uint16 private constant BPS = 10_000;
    uint256 private constant WAD = 1e18;
    uint16 public constant MAX_FEE_BPS = 300;

    IStockOracle public immutable oracle;
    /// @inheritdoc IDemoExchange
    address public immutable usdc;

    /// @inheritdoc IDemoExchange
    address public treasury;
    /// @inheritdoc IDemoExchange
    uint16 public feeBps;

    mapping(address token => PayToken) private _payTokens;

    constructor(address owner_, IStockOracle oracle_, address usdc_, address treasury_, uint16 feeBps_)
        Ownable(owner_)
    {
        if (address(oracle_) == address(0) || usdc_ == address(0)) revert ZeroAddress();
        oracle = oracle_;
        usdc = usdc_;
        _setPayToken(usdc_, address(0), false, true);
        _setTreasury(treasury_);
        _setFee(feeBps_);
    }

    // ───────────────────────────── Trading ─────────────────────────────

    /// @inheritdoc IDemoExchange
    function buy(address stock, address payToken, uint256 amountIn, uint256 minOut, address recipient)
        external
        returns (uint256 amountOut)
    {
        if (recipient == address(0)) revert ZeroAddress();
        uint256 fee;
        (amountOut, fee) = _quoteBuy(stock, payToken, amountIn);
        if (amountOut == 0 || amountOut < minOut) revert InsufficientOutput(amountOut, minOut);

        IERC20(payToken).safeTransferFrom(msg.sender, address(this), amountIn);
        if (fee > 0) IERC20(payToken).safeTransfer(treasury, fee);
        MockERC20(payToken).burn(amountIn - fee);
        MockERC20(stock).mint(recipient, amountOut);

        emit Bought(msg.sender, recipient, stock, payToken, amountIn, amountOut, fee);
    }

    /// @inheritdoc IDemoExchange
    function sell(address stock, uint256 amountIn, uint256 minOut, address recipient)
        external
        returns (uint256 amountOut)
    {
        if (recipient == address(0)) revert ZeroAddress();
        uint256 fee;
        (amountOut, fee) = _quoteSell(stock, amountIn);
        if (amountOut == 0 || amountOut < minOut) revert InsufficientOutput(amountOut, minOut);

        IERC20(stock).safeTransferFrom(msg.sender, address(this), amountIn);
        MockERC20(stock).burn(amountIn);
        if (fee > 0) MockERC20(usdc).mint(treasury, fee);
        MockERC20(usdc).mint(recipient, amountOut);

        emit Sold(msg.sender, recipient, stock, amountIn, amountOut, fee);
    }

    // ───────────────────────────── Views ─────────────────────────────

    /// @inheritdoc IDemoExchange
    function quoteBuy(address stock, address payToken, uint256 amountIn)
        external
        view
        returns (uint256 amountOut, uint256 fee)
    {
        return _quoteBuy(stock, payToken, amountIn);
    }

    /// @inheritdoc IDemoExchange
    function quoteSell(address stock, uint256 amountIn) external view returns (uint256 amountOut, uint256 fee) {
        return _quoteSell(stock, amountIn);
    }

    /// @inheritdoc IDemoExchange
    function getPayToken(address token) external view returns (PayToken memory) {
        return _payTokens[token];
    }

    /// @inheritdoc IDemoExchange
    function payTokenToUsd(address token, uint256 amount) external view returns (uint256) {
        return _toUsd(_enabledPayToken(token), amount);
    }

    // ───────────────────────────── Admin ─────────────────────────────

    /// @notice Lists a pay token. See `PayToken` for how `feed` and `inverse` are read.
    function setPayToken(address token, address feed, bool inverse, bool enabled) external onlyOwner {
        _setPayToken(token, feed, inverse, enabled);
    }

    function setFee(uint16 feeBps_) external onlyOwner {
        _setFee(feeBps_);
    }

    function setTreasury(address treasury_) external onlyOwner {
        _setTreasury(treasury_);
    }

    // ───────────────────────────── Internals ─────────────────────────────

    function _quoteBuy(address stock, address payToken, uint256 amountIn)
        private
        view
        returns (uint256 amountOut, uint256 fee)
    {
        if (amountIn == 0) revert InvalidAmount();
        if (!oracle.getStock(stock).enabled) revert StockNotEnabled(stock);
        PayToken memory pay = _enabledPayToken(payToken);

        fee = Math.mulDiv(amountIn, feeBps, BPS);
        amountOut = oracle.toTokens(stock, _toUsd(pay, amountIn - fee), IStockOracle.PriceUse.Collateral);
    }

    /// @dev Selling works for disabled stocks too, so existing reservations can always be settled.
    function _quoteSell(address stock, uint256 amountIn) private view returns (uint256 amountOut, uint256 fee) {
        if (amountIn == 0) revert InvalidAmount();
        uint256 valueUsd = oracle.toUsd(stock, amountIn, IStockOracle.PriceUse.Collateral);
        uint256 gross = _fromUsd(_payTokens[usdc], valueUsd);

        fee = Math.mulDiv(gross, feeBps, BPS);
        amountOut = gross - fee;
    }

    function _enabledPayToken(address token) private view returns (PayToken memory pay) {
        pay = _payTokens[token];
        if (!pay.enabled) revert PayTokenNotEnabled(token);
    }

    /// @dev USD value (18 decimals) of `amount` pay tokens, rounded down.
    function _toUsd(PayToken memory pay, uint256 amount) private view returns (uint256) {
        uint256 tokenUnit = 10 ** pay.decimals;
        if (pay.feed == address(0)) return Math.mulDiv(amount, WAD, tokenUnit);

        uint256 answer = _feedAnswer(pay.feed);
        uint256 feedUnit = 10 ** pay.feedDecimals;
        return pay.inverse
            ? Math.mulDiv(amount, WAD * feedUnit, tokenUnit * answer)
            : Math.mulDiv(amount, WAD * answer, tokenUnit * feedUnit);
    }

    /// @dev Pay tokens worth `usdValue` (18 decimals), rounded down.
    function _fromUsd(PayToken memory pay, uint256 usdValue) private view returns (uint256) {
        uint256 tokenUnit = 10 ** pay.decimals;
        if (pay.feed == address(0)) return Math.mulDiv(usdValue, tokenUnit, WAD);

        uint256 answer = _feedAnswer(pay.feed);
        uint256 feedUnit = 10 ** pay.feedDecimals;
        return pay.inverse
            ? Math.mulDiv(usdValue, tokenUnit * answer, WAD * feedUnit)
            : Math.mulDiv(usdValue, tokenUnit * feedUnit, WAD * answer);
    }

    /// @dev Demo feeds are kept fresh by the deploy and sync scripts, so only the sign is checked.
    function _feedAnswer(address feed) private view returns (uint256) {
        (, int256 answer,,,) = AggregatorV3Interface(feed).latestRoundData();
        if (answer <= 0) revert InvalidFeedPrice(feed, answer);
        // forge-lint: disable-next-line(unsafe-typecast) positive int256 always fits in uint256
        return uint256(answer);
    }

    function _setPayToken(address token, address feed, bool inverse, bool enabled) private {
        if (token == address(0)) revert ZeroAddress();
        _payTokens[token] = PayToken({
            feed: feed,
            inverse: inverse,
            enabled: enabled,
            decimals: IERC20Metadata(token).decimals(),
            feedDecimals: feed == address(0) ? 0 : AggregatorV3Interface(feed).decimals()
        });
        emit PayTokenSet(token, feed, inverse, enabled);
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
}
