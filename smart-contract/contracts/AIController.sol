// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interface/IAIController.sol";

contract AIController is Ownable, IAIController {
    address public strategist;
    uint256 public override targetSlippageBps; // 0..10000
    bool public override shouldHarvest;

    event StrategistUpdated(address indexed strategist);
    event TargetSlippageUpdated(uint256 bps);
    event ShouldHarvestUpdated(bool value);

    constructor(address initialOwner, address initialStrategist) Ownable(initialOwner) {
        strategist = initialStrategist;
    }

    modifier onlyStrategist() {
        require(msg.sender == strategist, "AIController: not strategist");
        _;
    }

    function setStrategist(address s) external onlyOwner {
        require(s != address(0), "AIController: zero address");
        strategist = s;
        emit StrategistUpdated(s);
    }

    function setTargetSlippage(uint256 bps) external onlyStrategist {
        require(bps <= 10000, "AIController: invalid bps");
        targetSlippageBps = bps;
        emit TargetSlippageUpdated(bps);
    }

    function setShouldHarvest(bool v) external onlyStrategist {
        shouldHarvest = v;
        emit ShouldHarvestUpdated(v);
    }
}


