// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title IDemoExchange
/// @notice Demo market for local chains and testnets: buys and sells mock stocks at the oracle price,
///         paid in mock USDC or mock wARS, with a fee to the treasury. Stands in for the DEX aggregator
///         used on mainnet, including as a whitelisted router for claim settlements.
interface IDemoExchange {
    /// @notice How a pay token is priced in USD.
    /// @dev `feed == address(0)` means 1 token = 1 USD (USDC). Otherwise the Chainlink-style feed quotes
    ///      USD per token, or tokens per USD when `inverse` is set (the USD / ARS feed quotes ARS per USD).
    struct PayToken {
        address feed;
        bool inverse;
        bool enabled;
        uint8 decimals;
        uint8 feedDecimals;
    }

    event Bought(
        address indexed buyer,
        address indexed recipient,
        address indexed stock,
        address payToken,
        uint256 amountIn,
        uint256 amountOut,
        uint256 fee
    );
    event Sold(
        address indexed seller,
        address indexed recipient,
        address indexed stock,
        uint256 amountIn,
        uint256 amountOut,
        uint256 fee
    );
    event PayTokenSet(address indexed token, address feed, bool inverse, bool enabled);
    event FeeUpdated(uint16 feeBps);
    event TreasuryUpdated(address treasury);

    error ZeroAddress();
    error InvalidAmount();
    error FeeTooHigh(uint16 feeBps);
    error PayTokenNotEnabled(address token);
    error StockNotEnabled(address stock);
    error InvalidFeedPrice(address feed, int256 answer);
    error InsufficientOutput(uint256 amountOut, uint256 minOut);

    /// @notice Pays `amountIn` of `payToken` (approve it first) for stock sent to `recipient`.
    /// @dev The fee is taken from `amountIn`, in the pay token.
    function buy(address stock, address payToken, uint256 amountIn, uint256 minOut, address recipient)
        external
        returns (uint256 amountOut);

    /// @notice Sells `amountIn` stock (approve it first) for USDC sent to `recipient`.
    /// @dev The fee is taken from the USDC proceeds.
    function sell(address stock, uint256 amountIn, uint256 minOut, address recipient)
        external
        returns (uint256 amountOut);

    /// @return amountOut Stock `buy` would return.
    /// @return fee Pay tokens kept as fee.
    function quoteBuy(address stock, address payToken, uint256 amountIn)
        external
        view
        returns (uint256 amountOut, uint256 fee);

    /// @return amountOut USDC `sell` would return.
    /// @return fee USDC kept as fee.
    function quoteSell(address stock, uint256 amountIn) external view returns (uint256 amountOut, uint256 fee);

    function getPayToken(address token) external view returns (PayToken memory);

    /// @notice USD value (18 decimals) of `amount` pay tokens.
    function payTokenToUsd(address token, uint256 amount) external view returns (uint256);

    function usdc() external view returns (address);

    function treasury() external view returns (address);

    function feeBps() external view returns (uint16);
}
