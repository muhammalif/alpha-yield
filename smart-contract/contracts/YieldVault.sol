// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interface/IStrategy.sol";

interface IWU2U {
    function deposit() external payable;
    function withdraw(uint256 wad) external;
}

contract YieldVault is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable token;
    address public strategyRouter;

    // Mapping to track each user's balance
    mapping(address => uint256) public balances;
    // Total supply in vault
    uint256 public totalAssets;
    // Reward per share (accumulated)
    uint256 public rewardPerShare;
    // Mapping to track user's reward debt (for accurate calculation)
    mapping(address => uint256) public rewardDebt;

    bool private pausedState;
    uint256 public constant MAX_SLIPPAGE_BPS = 1000; // Max 10% slippage
    uint256 public constant MAX_DEPOSIT_PERCENT = 1000; // Max 10% of totalAssets per tx

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
    function deposit(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "YieldVault: deposit amount must be greater than zero");
        require(amount <= token.balanceOf(msg.sender), "YieldVault: insufficient token balance");
        require(totalAssets == 0 || amount <= (totalAssets * MAX_DEPOSIT_PERCENT) / 10000, "YieldVault: deposit amount exceeds rate limit");

        address user = msg.sender;
        uint256 userBalance = balances[user];
        uint256 currentRewardPerShare = rewardPerShare;

        // Claim any pending rewards before updating balance
        if (userBalance > 0) {
            uint256 pending = (userBalance * currentRewardPerShare) / 1e18 - rewardDebt[user];
            if (pending > 0 && token.balanceOf(address(this)) >= pending) {
                rewardDebt[user] = rewardDebt[user] + pending;
                token.safeTransfer(user, pending);
                emit RewardsClaimed(user, pending);
            }
        }

        token.safeTransferFrom(user, address(this), amount);

        balances[user] = userBalance + amount;
        totalAssets += amount;

        // Update reward debt for new balance
        rewardDebt[user] = (balances[user] * currentRewardPerShare) / 1e18;

        // Transfer tokens to strategy before investment
        token.safeTransfer(strategyRouter, amount);

        // Use AI controller slippage if available, else default 50
        uint256 slippage = 50; // Default 0.5%
        if (strategyRouter != address(0)) {
            try IStrategy(strategyRouter).getAISlippage() returns (uint256 aiSlippage) {
                if (aiSlippage > 0 && aiSlippage <= MAX_SLIPPAGE_BPS) {
                    slippage = aiSlippage;
                }
            } catch {}
        }
        IStrategy(strategyRouter).depositToStrategy(amount, slippage, block.timestamp + 3600);

        emit Deposited(user, amount);
    }


    // U2U native deposit function (auto-wrap to WU2U then invest)
    function depositNative() external payable nonReentrant whenNotPaused {
        uint256 amount = msg.value;
        require(amount > 0, "YieldVault: deposit amount must be greater than zero");
        require(totalAssets == 0 || amount <= (totalAssets * MAX_DEPOSIT_PERCENT) / 10000, "YieldVault: deposit amount exceeds rate limit");

        address user = msg.sender;
        uint256 userBalance = balances[user];
        uint256 currentRewardPerShare = rewardPerShare;

        // Claim any pending rewards before updating balance
        if (userBalance > 0) {
            uint256 pending = (userBalance * currentRewardPerShare) / 1e18 - rewardDebt[user];
            if (pending > 0 && token.balanceOf(address(this)) >= pending) {
                rewardDebt[user] = rewardDebt[user] + pending;
                token.safeTransfer(user, pending);
                emit RewardsClaimed(user, pending);
            }
        }

        // Wrap U2U to WU2U on vault token address
        IWU2U(address(token)).deposit{ value: amount }();
        emit Deposited(user, amount);

        balances[user] = userBalance + amount;
        totalAssets += amount;

        // Update reward debt for new balance
        rewardDebt[user] = (balances[user] * currentRewardPerShare) / 1e18;

        // Transfer WU2U to strategy before investment
        uint256 vaultBalance = token.balanceOf(address(this));
        require(vaultBalance >= amount, "Vault insufficient WU2U");
        emit Withdrawn(user, amount); // Temp event before transfer
        token.safeTransfer(strategyRouter, amount);

        // Use AI controller slippage if available, else default 50
        uint256 slippage = 50; // Default 0.5%
        if (strategyRouter != address(0)) {
            try IStrategy(strategyRouter).getAISlippage() returns (uint256 aiSlippage) {
                if (aiSlippage > 0 && aiSlippage <= MAX_SLIPPAGE_BPS) {
                    slippage = aiSlippage;
                }
            } catch {}
        }
        IStrategy(strategyRouter).depositToStrategy(amount, slippage, block.timestamp + 3600);

        emit Deposited(user, amount);
    }



    // Withdraw function
    function withdraw(uint256 amount) external nonReentrant whenNotPaused {
        address user = msg.sender;
        require(balances[user] >= amount, "YieldVault: insufficient user balance");
        require(amount > 0, "YieldVault: withdraw amount must be greater than zero");
        require(amount <= totalAssets, "YieldVault: withdraw amount exceeds total invested assets");

        uint256 userBalance = balances[user];
        uint256 currentRewardPerShare = rewardPerShare;

        // Claim any pending rewards before updating balance
        if (userBalance > 0) {
            uint256 pending = (userBalance * currentRewardPerShare) / 1e18 - rewardDebt[user];
            if (pending > 0 && token.balanceOf(address(this)) >= pending) {
                rewardDebt[user] = rewardDebt[user] + pending;
                // Unwrap WU2U rewards to U2U and transfer
                IWU2U(address(token)).withdraw(pending);
                payable(user).transfer(pending);
                emit RewardsClaimed(user, pending);
            }
        }

        // Withdraw from strategy first
        if (strategyRouter != address(0)) {
            uint256 slippage = 1000; // Default 10% to handle higher slippage
            try IStrategy(strategyRouter).getAISlippage() returns (uint256 aiSlippage) {
                if (aiSlippage > 0 && aiSlippage <= MAX_SLIPPAGE_BPS) {
                    slippage = aiSlippage;
                }
            } catch {}
            IStrategy(strategyRouter).withdrawFromStrategy(amount, slippage, block.timestamp + 3600);
        }

        // Get actual received amount after strategy withdrawal
        uint256 received = token.balanceOf(address(this));
        require(received > 0, "YieldVault: no tokens received from strategy");

        balances[user] = userBalance - received;
        totalAssets -= received;

        // Update reward debt for new balance
        rewardDebt[user] = (balances[user] * currentRewardPerShare) / 1e18;

        // Unwrap WU2U to U2U and transfer native token to user
        IWU2U(address(token)).withdraw(received);
        payable(user).transfer(received);

        emit Withdrawn(user, received);
    }

    // Function to get the total assets managed by the router
    function getStrategyAssets() external view returns (uint256) {
        return IStrategy(strategyRouter).getStrategyBalance();
    }


    // Function to claim rewards
    function claimRewards() external nonReentrant {
        address user = msg.sender;
        uint256 userShare = balances[user];
        require(userShare > 0, "YieldVault: no balance to claim rewards");

        // Calculate pending rewards based on reward per share
        uint256 pendingReward = (userShare * rewardPerShare) / 1e18 - rewardDebt[user];
        require(pendingReward > 0, "YieldVault: no pending rewards");

        // Make sure the vault has enough tokens for the transfer.
        require(token.balanceOf(address(this)) >= pendingReward, "YieldVault: insufficient reward balance");

        // Update reward debt
        rewardDebt[user] = rewardDebt[user] + pendingReward;

        // Unwrap WU2U rewards to U2U and transfer
        IWU2U(address(token)).withdraw(pendingReward);
        payable(user).transfer(pendingReward);

        emit RewardsClaimed(user, pendingReward);
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

    // Emergency withdraw all assets from strategy to vault
    function emergencyWithdraw() external onlyOwner {
        require(strategyRouter != address(0), "YieldVault: no strategy set");
        uint256 strategyBalance = IStrategy(strategyRouter).getStrategyBalance();
        if (strategyBalance > 0) {
            IStrategy(strategyRouter).withdrawFromStrategy(strategyBalance, MAX_SLIPPAGE_BPS, block.timestamp + 3600);
        }
    }

    // Function to increase reward (called by strategy after harvest)
    function addRewards(uint256 amount) external {
        require(msg.sender == strategyRouter, "YieldVault: only strategy can add rewards");
        require(amount > 0, "YieldVault: reward amount must be greater than zero");
        uint256 assets = totalAssets;
        require(assets > 0, "YieldVault: no assets to distribute rewards");

        // Update reward per share
        rewardPerShare += (amount * 1e18) / assets;
    }
}