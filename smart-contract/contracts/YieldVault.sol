// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interface/IStrategy.sol";

interface IWU2U {
    function deposit() external payable;
}

contract YieldVault is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable token;
    address public strategyRouter;

    // Mapping to track each user's balance
    mapping(address => uint256) public balances;
    // Total supply in vault
    uint256 public totalAssets;
    // Mapping to track claimed rewards
    mapping(address => uint256) public claimedRewards;
    // Total rewards available to claim
    uint256 public totalRewards;

    bool private pausedState;

    modifier whenNotPaused() {
        require(!pausedState, "YieldVault: paused");
        _;
    }

    function paused() public view returns (bool) {
        return pausedState;
    }

    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);

    constructor(address _token, address _strategyRouter) Ownable(msg.sender) {
        require(_token != address(0), "YieldVault: token address cannot be zero");
        token = IERC20(_token);
        if (_strategyRouter != address(0)) {
        strategyRouter = _strategyRouter;
        }
    }


    // Deposit function for ERC-20 tokens
    function deposit(uint256 amount) external nonReentrant {
        require(amount > 0, "YieldVault: deposit amount must be greater than zero");
        require(amount <= token.balanceOf(msg.sender), "YieldVault: insufficient token balance");
        token.safeTransferFrom(msg.sender, address(this), amount);

        balances[msg.sender] += amount;
        totalAssets += amount;

        // Transfer tokens to strategy before investment
        token.safeTransfer(strategyRouter, amount);

        // Ask the router to invest funds
        IStrategy(strategyRouter).depositToStrategy(amount, 50, block.timestamp + 3600); // Default 0.5% slippage, 1h deadline

        emit Deposited(msg.sender, amount);
    }


    // U2U native deposit function (auto-wrap to WU2U then invest)
    function depositNative() external payable nonReentrant {
        require(msg.value > 0, "YieldVault: deposit amount must be greater than zero");

        // Wrap U2U to WU2U on vault token address
        IWU2U(address(token)).deposit{ value: msg.value }();

        balances[msg.sender] += msg.value;
        totalAssets += msg.value;

        // Transfer WU2U to strategy before investment
        token.safeTransfer(strategyRouter, msg.value);

        // Invest via strategy (use default slippage 0.5% and deadline 1 hour)
        IStrategy(strategyRouter).depositToStrategy(msg.value, 50, block.timestamp + 3600);

        emit Deposited(msg.sender, msg.value);
    }



    // Withdraw function
    function withdraw(uint256 amount) external nonReentrant {
        require(amount > 0, "YieldVault: withdraw amount must be greater than zero");
        uint256 userBalance = balances[msg.sender];
        require(userBalance >= amount, "YieldVault: insufficient balance");

        // Ask the router to withdraw funds
        IStrategy(strategyRouter).withdrawFromStrategy(amount, 50, block.timestamp + 3600); // Default 0.5% slippage, 1h deadline

        balances[msg.sender] -= amount;
        totalAssets -= amount;

        token.safeTransfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }

    // Function to get the total assets managed by the router
    function getStrategyAssets() external view returns (uint256) {
        return IStrategy(strategyRouter).getStrategyBalance();
    }


    // Function to claim rewards
    function claimRewards() external nonReentrant {
        uint256 userShare = balances[msg.sender];
        require(userShare > 0, "YieldVault: no balance to claim rewards");
        require(totalRewards > 0, "YieldVault: no rewards available");

        // Calculate rewards based on ownership proportion
        uint256 userReward = (userShare * totalRewards) / totalAssets;
        uint256 pendingReward = userReward - claimedRewards[msg.sender];
        require(pendingReward > 0, "YieldVault: no pending rewards");

        // Make sure the vault has enough tokens for the transfer.
        require(token.balanceOf(address(this)) >= pendingReward, "YieldVault: insufficient reward balance");

        claimedRewards[msg.sender] += pendingReward;

        // Transfer reward
        token.safeTransfer(msg.sender, pendingReward);

        emit RewardsClaimed(msg.sender, pendingReward);
    }



    function pause() external onlyOwner {
        pausedState = true;
    }

    function unpause() external onlyOwner {
        pausedState = false;
    }

    function setStrategy(address _strategy) external onlyOwner {
        require(_strategy != address(0), "YieldVault: strategy cannot be zero address");
        strategyRouter = _strategy;
    }

    // Function to increase reward (called by strategy after harvest)
    function addRewards(uint256 amount) external {
        require(msg.sender == strategyRouter, "YieldVault: only strategy can add rewards");
        require(amount > 0, "YieldVault: reward amount must be greater than zero");
        
        totalRewards += amount;
    }
}