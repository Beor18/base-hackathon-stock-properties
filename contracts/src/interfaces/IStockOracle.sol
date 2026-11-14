// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title IStockOracle
/// @notice Registry of tokenized stocks accepted as collateral and their USD prices.
/// @dev USD values use 18 decimals everywhere ("WAD"). Token amounts use the token's own decimals.
interface IStockOracle {
    /// @notice How fresh a price must be for a given action.
    /// - `Collateral`: adding value to the escrow (create, top up). Weekend/holiday closes are acceptable.
    /// - `Settlement`: moving value out of the escrow (claim payout, excess withdrawal). Requires a live market price.
    enum PriceUse {
        Collateral,
        Settlement
    }

    struct Stock {
        address feed; // Chainlink aggregator proxy quoting USD per whole token
        uint16 collateralRatioBps; // collateral value required per unit of coverage, e.g. 12_500 = 125%
        uint8 tokenDecimals;
        uint8 feedDecimals;
        bool enabled; // disabled stocks keep pricing existing reservations but cannot back new ones
    }

    event StockListed(address indexed token, address indexed feed, uint16 collateralRatioBps, bool enabled);

    error ZeroAddress();
    error InvalidCollateralRatio(uint16 collateralRatioBps);
    error InvalidMaxAge();
    error StockNotListed(address token);
    error InvalidPrice(address token, int256 answer);
    error StalePrice(address token, uint256 updatedAt, uint256 maxAge);

    /// @notice Maximum price age accepted when value leaves the escrow.
    function settlementMaxAge() external view returns (uint256);

    /// @notice Maximum price age accepted when value enters the escrow.
    function collateralMaxAge() external view returns (uint256);

    /// @notice Listing data for `token`. Reverts if the token was never listed.
    function getStock(address token) external view returns (Stock memory);

    /// @notice Every token that was ever listed (enabled or not).
    function listedTokens() external view returns (address[] memory);

    /// @notice Latest price without a freshness check. Intended for UIs, never for settlement.
    /// @return priceUsd USD per whole token, 18 decimals.
    /// @return updatedAt Timestamp of the last feed update.
    function latestPrice(address token) external view returns (uint256 priceUsd, uint256 updatedAt);

    /// @notice USD value (18 decimals) of `amount` tokens. Reverts if the price is too old for `use`.
    function toUsd(address token, uint256 amount, PriceUse use) external view returns (uint256 usdValue);

    /// @notice Token amount worth `usdValue` (18 decimals), rounded down. Reverts if the price is too old for `use`.
    function toTokens(address token, uint256 usdValue, PriceUse use) external view returns (uint256 amount);
}
