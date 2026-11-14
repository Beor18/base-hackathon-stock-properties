// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {MockERC20} from "./MockERC20.sol";

/// @title MockUSDC
/// @notice Demo USDC (6 decimals) with a capped faucet, for local chains and testnets.
contract MockUSDC is MockERC20 {
    constructor(uint256 faucetCap_, address owner_) MockERC20("USD Coin (demo)", "USDC", 6, faucetCap_, owner_) {}
}
