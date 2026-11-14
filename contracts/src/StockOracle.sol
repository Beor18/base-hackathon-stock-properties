// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable, Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

import {AggregatorV3Interface} from "./interfaces/AggregatorV3Interface.sol";
import {IStockOracle} from "./interfaces/IStockOracle.sol";

/// @title StockOracle
/// @notice Lists the tokenized stocks Garante accepts and prices them in USD with Chainlink feeds.
/// @dev Coinbase tokenized-stock feeds on Base are total-return feeds: the answer already includes the
///      token's multiplier (dividends, splits), so `token amount x answer` is the position value.
///      Feeds follow market hours (24/5) and hold the last value while markets are closed, which is why
///      two freshness bounds exist: a lenient one to add collateral, a strict one to pay value out.
contract StockOracle is IStockOracle, Ownable2Step {
    uint256 private constant WAD = 1e18;
    uint16 private constant BPS = 10_000;
    uint16 public constant MAX_COLLATERAL_RATIO_BPS = 30_000;

    /// @inheritdoc IStockOracle
    uint256 public immutable settlementMaxAge;
    /// @inheritdoc IStockOracle
    uint256 public immutable collateralMaxAge;

    mapping(address token => Stock) private _stocks;
    address[] private _listedTokens;

    constructor(address owner_, uint256 settlementMaxAge_, uint256 collateralMaxAge_) Ownable(owner_) {
        if (settlementMaxAge_ == 0 || collateralMaxAge_ < settlementMaxAge_) revert InvalidMaxAge();
        settlementMaxAge = settlementMaxAge_;
        collateralMaxAge = collateralMaxAge_;
    }

    /// @notice Lists a stock or updates its feed, collateral ratio or enabled flag.
    /// @param collateralRatioBps Must be above 100% so the escrow always starts over-collateralized.
    function setStock(address token, address feed, uint16 collateralRatioBps, bool enabled) external onlyOwner {
        if (token == address(0) || feed == address(0)) revert ZeroAddress();
        if (collateralRatioBps <= BPS || collateralRatioBps > MAX_COLLATERAL_RATIO_BPS) {
            revert InvalidCollateralRatio(collateralRatioBps);
        }

        if (_stocks[token].feed == address(0)) _listedTokens.push(token);

        _stocks[token] = Stock({
            feed: feed,
            collateralRatioBps: collateralRatioBps,
            tokenDecimals: IERC20Metadata(token).decimals(),
            feedDecimals: AggregatorV3Interface(feed).decimals(),
            enabled: enabled
        });

        emit StockListed(token, feed, collateralRatioBps, enabled);
    }

    /// @inheritdoc IStockOracle
    function getStock(address token) public view returns (Stock memory stock) {
        stock = _stocks[token];
        if (stock.feed == address(0)) revert StockNotListed(token);
    }

    /// @inheritdoc IStockOracle
    function listedTokens() external view returns (address[] memory) {
        return _listedTokens;
    }

    /// @inheritdoc IStockOracle
    function latestPrice(address token) external view returns (uint256 priceUsd, uint256 updatedAt) {
        Stock memory stock = getStock(token);
        uint256 answer;
        (answer, updatedAt) = _readFeed(token, stock);
        priceUsd = Math.mulDiv(answer, WAD, 10 ** stock.feedDecimals);
    }

    /// @inheritdoc IStockOracle
    function toUsd(address token, uint256 amount, PriceUse use) external view returns (uint256) {
        Stock memory stock = getStock(token);
        uint256 answer = _freshAnswer(token, stock, use);
        return Math.mulDiv(amount, answer * WAD, 10 ** (uint256(stock.tokenDecimals) + stock.feedDecimals));
    }

    /// @inheritdoc IStockOracle
    function toTokens(address token, uint256 usdValue, PriceUse use) external view returns (uint256) {
        Stock memory stock = getStock(token);
        uint256 answer = _freshAnswer(token, stock, use);
        return Math.mulDiv(usdValue, 10 ** (uint256(stock.tokenDecimals) + stock.feedDecimals), answer * WAD);
    }

    function _freshAnswer(address token, Stock memory stock, PriceUse use) private view returns (uint256 answer) {
        uint256 updatedAt;
        (answer, updatedAt) = _readFeed(token, stock);

        uint256 maxAge = use == PriceUse.Settlement ? settlementMaxAge : collateralMaxAge;
        if (block.timestamp - updatedAt > maxAge) revert StalePrice(token, updatedAt, maxAge);
    }

    function _readFeed(address token, Stock memory stock) private view returns (uint256 answer, uint256 updatedAt) {
        int256 rawAnswer;
        (, rawAnswer,, updatedAt,) = AggregatorV3Interface(stock.feed).latestRoundData();
        if (rawAnswer <= 0 || updatedAt == 0 || updatedAt > block.timestamp) revert InvalidPrice(token, rawAnswer);
        answer = uint256(rawAnswer);
    }
}
