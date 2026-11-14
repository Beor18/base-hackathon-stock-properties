// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {MockERC20} from "./MockERC20.sol";

/// @title MockWARS
/// @notice Demo wrapped Argentine peso (18 decimals, 1 token = 1 ARS) with a capped faucet,
///         for local chains and testnets.
contract MockWARS is MockERC20 {
    constructor(uint256 faucetCap_, address owner_)
        MockERC20("Peso Argentino (demo)", "wARS", 18, faucetCap_, owner_)
    {}
}
