// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

import {AggregatorV3Interface} from "../interfaces/AggregatorV3Interface.sol";

/// @title MockPriceFeed
/// @notice Chainlink-compatible feed for local chains and testnets. The owner pushes prices mirrored
///         from the real feeds. In `alwaysFresh` mode the feed reports the current block time so demo
///         deployments keep working without a price keeper.
contract MockPriceFeed is AggregatorV3Interface, Ownable {
    uint8 public immutable decimals;
    bool public immutable alwaysFresh;
    string public description;

    int256 private _answer;
    uint256 private _updatedAt;
    uint80 private _roundId;

    constructor(uint8 decimals_, string memory description_, int256 answer_, bool alwaysFresh_) Ownable(msg.sender) {
        decimals = decimals_;
        description = description_;
        alwaysFresh = alwaysFresh_;
        _setAnswer(answer_, block.timestamp);
    }

    function setAnswer(int256 answer) external onlyOwner {
        _setAnswer(answer, block.timestamp);
    }

    /// @notice Sets a price with an explicit timestamp, to reproduce stale feeds in tests.
    function setAnswerAt(int256 answer, uint256 updatedAt) external onlyOwner {
        _setAnswer(answer, updatedAt);
    }

    function latestRoundData() external view returns (uint80, int256, uint256, uint256, uint80) {
        uint256 updatedAt = alwaysFresh ? block.timestamp : _updatedAt;
        return (_roundId, _answer, updatedAt, updatedAt, _roundId);
    }

    function _setAnswer(int256 answer, uint256 updatedAt) private {
        _answer = answer;
        _updatedAt = updatedAt;
        _roundId++;
    }
}
