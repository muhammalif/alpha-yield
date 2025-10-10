// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interface/IStrategy.sol";
import "./interface/IMockRouter.sol";
import "./interface/IAIController.sol";

interface IYieldVault {
    function addRewards(uint256 amount) external;
}

contract SimpleStrategy is IStrategy, Ownable, ReentrancyGuard {
    bool private pausedState;

    modifier whenNotPaused() {
        require(!pausedState, "SimpleStrategy: paused");
        _;
    }

    function paused() public view returns (bool) {
        return pausedState;
    }
    using SafeERC20 for IERC20;

    IERC20 public immutable token; // U2U token
    IERC20 public immutable pairToken; // Mock pair token
    address public mockRouter; // MockRouter address
    address public vault; // Vault address for rewardss
    address public aiController; // optional AI controller

    uint256 private totalAssets;
    uint256 private liquidityProvided;
    uint256 public constant SLIPPAGE_TOLERANCE = 2000; // 20% slippage

    modifier onlyVault() {
        require(msg.sender == vault, "SimpleStrategy: only vault can call this function");
        _;
    }

    constructor(address _token, address _pairToken, address _mockRouter, address _vault) Ownable(msg.sender) {
        require(_token != address(0), "SimpleStrategy: token address cannot be zero");
        require(_pairToken != address(0), "SimpleStrategy: pair token address cannot be zero");
        require(_mockRouter != address(0), "SimpleStrategy: mock router address cannot be zero");
        require(_vault != address(0), "SimpleStrategy: vault address cannot be zero");
        token = IERC20(_token);
        pairToken = IERC20(_pairToken);
        mockRouter = _mockRouter;
        vault = _vault;
    }

    function setMockRouter(address _mockRouter) external onlyOwner {
        require(_mockRouter != address(0), "SimpleStrategy: mock router cannot be zero");
        mockRouter = _mockRouter;
    }

    function depositToStrategy(uint256 amount, uint256 slippageTolerance, uint256 deadline) external override nonReentrant whenNotPaused onlyVault {
        require(amount > 0, "SimpleStrategy: deposit amount must be greater than zero");
        require(slippageTolerance <= 1000, "SimpleStrategy: slippage tolerance too high"); // Max 10%
        // Override slippage from AI controller if set
        if (aiController != address(0)) {
            uint256 aiBps = IAIController(aiController).targetSlippageBps();
            if (aiBps > 0 && aiBps <= 10000) {
                slippageTolerance = aiBps;
            }
        }
        // Approve max for gas efficiency
        token.forceApprove(mockRouter, type(uint256).max);
        pairToken.forceApprove(mockRouter, type(uint256).max);

        // Provide liquidity with user-defined slippage tolerance
        uint256 amountAMin = amount * (10000 - slippageTolerance) / 10000;
        uint256 amountBMin = amount * (10000 - slippageTolerance) / 10000;
        (uint256 amountA,, uint256 liquidity) = IMockRouter(mockRouter).addLiquidity(
            address(token),
            address(pairToken),
            amount,
            amount,
            amountAMin,
            amountBMin,
            address(this),
            deadline
        );

        totalAssets += amountA;
        liquidityProvided += liquidity;
    }

    function withdrawFromStrategy(uint256 amount, uint256 slippageTolerance, uint256 deadline) external override nonReentrant whenNotPaused onlyVault {
        require(amount > 0, "SimpleStrategy: withdraw amount must be greater than zero");
        require(slippageTolerance <= 1000, "SimpleStrategy: slippage tolerance too high"); // Max 10%
        if (aiController != address(0)) {
            uint256 aiBps = IAIController(aiController).targetSlippageBps();
            if (aiBps > 0 && aiBps <= 10000) {
                slippageTolerance = aiBps;
            }
        }
        // Calculate liquidity to remove proportionally
        uint256 liquidityToRemove = (liquidityProvided * amount) / totalAssets;
        require(liquidityToRemove > 0 && liquidityToRemove <= liquidityProvided, "SimpleStrategy: insufficient liquidity");

        // Remove liquidity with user-defined slippage tolerance
        uint256 expectedAmountA = (liquidityToRemove * totalAssets) / liquidityProvided;
        uint256 expectedAmountB = expectedAmountA; // Assuming 1:1
        uint256 amountAMin = expectedAmountA * (10000 - slippageTolerance) / 10000;
        uint256 amountBMin = expectedAmountB * (10000 - slippageTolerance) / 10000;
        (uint256 amountA,) = IMockRouter(mockRouter).removeLiquidity(
            address(token),
            address(pairToken),
            liquidityToRemove,
            amountAMin,
            amountBMin,
            address(this),
            deadline
        );

        totalAssets -= amountA;
        liquidityProvided -= liquidityToRemove;

        // Transfer withdrawn tokens back to vault
        token.safeTransfer(msg.sender, amountA);
        // Optionally handle pairToken
    }

    // Function to claim rewards and reinvest them
    function harvest() external override onlyOwner whenNotPaused {
        require(mockRouter != address(0), "SimpleStrategy: mock router not set");
        require(totalAssets > 0, "SimpleStrategy: no assets to harvest");
        if (aiController != address(0)) {
            require(IAIController(aiController).shouldHarvest(), "SimpleStrategy: AI disallows harvest");
        }
        
        // Call MockRouter harvest to simulate yield generation
        IMockRouter(mockRouter).harvest();

        // Simulate yield generation: 1% of total assets as reward
        uint256 yieldAmount = totalAssets / 100; // 1% yield
        
        // Transfer yield to vault as reward and notify vault
        if (yieldAmount > 0 && token.balanceOf(address(this)) >= yieldAmount) {
            token.safeTransfer(vault, yieldAmount);
            IYieldVault(vault).addRewards(yieldAmount);
        }
    }

    function getStrategyBalance() public view override returns (uint256) {
        require(totalAssets >= 0, "SimpleStrategy: invalid total assets");
        return totalAssets;
    }

    function getAISlippage() external view override returns (uint256) {
        if (aiController != address(0)) {
            return IAIController(aiController).targetSlippageBps();
        }
        return 0;
    }

    // Function for pre-fund strategy with pairToken (MockUSDT)
    function fundPairToken(uint256 amount) external onlyOwner {
        require(amount > 0, "SimpleStrategy: amount must be greater than zero");
        pairToken.safeTransferFrom(msg.sender, address(this), amount);
        // Approve max for pairToken since it's pre-funded and reused
        pairToken.forceApprove(mockRouter, type(uint256).max);
    }

    function setVault(address _vault) external onlyOwner {
        require(_vault != address(0), "SimpleStrategy: vault cannot be zero address");
        vault = _vault;
    }

    function setAIController(address _controller) external onlyOwner {
        aiController = _controller; // zero address disables AI override
    }

    // Function to get pairToken balance in strategy
    function getPairTokenBalance() external view returns (uint256) {
        return pairToken.balanceOf(address(this));
    }

    function pause() external onlyOwner {
        pausedState = true;
    }

    function unpause() external onlyOwner {
        pausedState = false;
    }
}