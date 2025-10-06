// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IAIController {
    function targetSlippageBps() external view returns (uint256);
    function shouldHarvest() external view returns (bool);
}


