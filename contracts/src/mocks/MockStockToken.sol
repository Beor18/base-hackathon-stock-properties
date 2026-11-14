// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title MockStockToken
/// @notice Stand-in for a Coinbase tokenized stock on local chains and testnets, where the real
///         B20 tokens do not exist. Anyone can mint a small demo balance from the faucet.
/// @dev Never deployed on Base mainnet: there the oracle lists the real token addresses.
contract MockStockToken is ERC20 {
    /// @notice Address of the real token on Base mainnet that this mock mirrors (for metadata lookups).
    address public immutable mirrorOf;
    /// @notice Whole tokens minted per faucet call.
    uint256 public immutable faucetAmount;

    uint8 private immutable _decimals;

    constructor(string memory name_, string memory symbol_, uint8 decimals_, address mirrorOf_, uint256 faucetAmount_)
        ERC20(name_, symbol_)
    {
        _decimals = decimals_;
        mirrorOf = mirrorOf_;
        faucetAmount = faucetAmount_;
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    /// @notice Mints the demo amount to the caller.
    function faucet() external {
        _mint(msg.sender, faucetAmount * 10 ** _decimals);
    }
}
