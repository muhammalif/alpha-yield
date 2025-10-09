// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IStrategy {
    function depositToStrategy(uint256 amount, uint256 slippageTolerance, uint256 deadline) external;
    function withdrawFromStrategy(uint256 amount, uint256 slippageTolerance, uint256 deadline) external;
    function harvest() external;
    function getStrategyBalance() external view returns (uint256);
    function getAISlippage() external view returns (uint256);
}