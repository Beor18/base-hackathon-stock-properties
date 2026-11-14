// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title MockERC20
/// @notice Base for the demo tokens used on local chains and testnets, where the real assets do not exist.
///         The owner names one minter (the DemoExchange). Holders can burn their own balance, and anyone
///         can top up a small balance from the faucet when it is enabled.
/// @dev Never deployed on Base mainnet.
abstract contract MockERC20 is ERC20, Ownable {
    /// @notice The faucet tops the caller up to this balance, in token units. Zero disables it.
    uint256 public immutable faucetCap;
    /// @notice The only account allowed to mint.
    address public minter;

    uint8 private immutable _decimals;

    event MinterUpdated(address minter);
    event FaucetUsed(address indexed account, uint256 amount);

    error NotMinter();
    error FaucetDisabled();
    error FaucetCapReached(uint256 balance, uint256 cap);

    constructor(string memory name_, string memory symbol_, uint8 decimals_, uint256 faucetCap_, address owner_)
        ERC20(name_, symbol_)
        Ownable(owner_)
    {
        _decimals = decimals_;
        faucetCap = faucetCap_;
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    function setMinter(address minter_) external onlyOwner {
        minter = minter_;
        emit MinterUpdated(minter_);
    }

    function mint(address to, uint256 amount) external {
        if (msg.sender != minter) revert NotMinter();
        _mint(to, amount);
    }

    /// @notice Burns tokens from the caller's own balance.
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }

    /// @notice Tops the caller's balance up to `faucetCap`.
    /// @return amount Tokens minted.
    function faucet() external returns (uint256 amount) {
        if (faucetCap == 0) revert FaucetDisabled();
        uint256 balance = balanceOf(msg.sender);
        if (balance >= faucetCap) revert FaucetCapReached(balance, faucetCap);

        amount = faucetCap - balance;
        _mint(msg.sender, amount);
        emit FaucetUsed(msg.sender, amount);
    }
}
