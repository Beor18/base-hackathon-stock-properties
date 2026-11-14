// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {MockERC20} from "./MockERC20.sol";

/// @title MockStockToken
/// @notice Stand-in for a Coinbase tokenized stock on local chains and testnets, where the real B20
///         tokens do not exist. There is no faucet: stocks are bought through the DemoExchange, like the
///         real ones are bought through an aggregator.
/// @dev Never deployed on Base mainnet: there the oracle lists the real token addresses.
contract MockStockToken is MockERC20 {
    /// @notice Address of the real token on Base mainnet that this mock mirrors (for metadata lookups).
    address public immutable mirrorOf;

    constructor(string memory name_, string memory symbol_, uint8 decimals_, address mirrorOf_, address owner_)
        MockERC20(name_, symbol_, decimals_, 0, owner_)
    {
        mirrorOf = mirrorOf_;
    }
}
