// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract MockRouter {
    using SafeERC20 for IERC20;

    address public token0;
    address public token1;
    uint256 public reserve0;
    uint256 public reserve1;
    mapping(address => uint256) public liquidity;
    uint256 public totalLiquidity;

    event LiquidityAdded(address indexed provider, uint256 amountA, uint256 amountB, uint256 liquidity);
    event LiquidityRemoved(address indexed provider, uint256 amountA, uint256 amountB, uint256 liquidity);
    event Swap(address indexed sender, uint256 amountIn, uint256 amountOut, address tokenIn, address tokenOut);

    constructor(address _token0, address _token1) {
        token0 = _token0;
        token1 = _token1;
    }

    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external returns (uint256 amountA, uint256 amountB, uint256 liquidityMinted) {
        require(tokenA == token0 && tokenB == token1 || tokenA == token1 && tokenB == token0, "Invalid token pair");
        require(block.timestamp <= deadline, "Deadline exceeded");

        // Simplified 1:1 ratio for mock
        amountA = amountADesired;
        amountB = amountBDesired;
        require(amountA >= amountAMin && amountB >= amountBMin, "Insufficient amounts");

        IERC20(tokenA).safeTransferFrom(msg.sender, address(this), amountA);
        IERC20(tokenB).safeTransferFrom(msg.sender, address(this), amountB);

        reserve0 += (tokenA == token0 ? amountA : amountB);
        reserve1 += (tokenA == token0 ? amountB : amountA);

        // Mint liquidity tokens proportionally (simplified)
        liquidityMinted = amountA; // Assume 1:1
        totalLiquidity += liquidityMinted;
        liquidity[to] += liquidityMinted;

        emit LiquidityAdded(to, amountA, amountB, liquidityMinted);
    }

    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint256 _liquidity,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external returns (uint256 amountA, uint256 amountB) {
        require(tokenA == token0 && tokenB == token1 || tokenA == token1 && tokenB == token0, "Invalid token pair");
        require(block.timestamp <= deadline, "Deadline exceeded");
        require(liquidity[to] >= _liquidity, "Insufficient liquidity");

        // Simplified 1:1 ratio
        amountA = _liquidity;
        amountB = _liquidity;
        require(amountA >= amountAMin && amountB >= amountBMin, "Insufficient amounts");

        liquidity[to] -= _liquidity;
        totalLiquidity -= _liquidity;

        reserve0 -= (tokenA == token0 ? amountA : amountB);
        reserve1 -= (tokenA == token0 ? amountB : amountA);

        IERC20(tokenA).safeTransfer(to, amountA);
        IERC20(tokenB).safeTransfer(to, amountB);

        emit LiquidityRemoved(to, amountA, amountB, _liquidity);
    }

    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts) {
        require(path.length == 2, "Only direct swaps supported");
        require(block.timestamp <= deadline, "Deadline exceeded");

        address tokenIn = path[0];
        address tokenOut = path[1];
        require((tokenIn == token0 && tokenOut == token1) || (tokenIn == token1 && tokenOut == token0), "Invalid swap path");

        // Simplified swap with 0.3% fee
        uint256 fee = amountIn * 3 / 1000;
        uint256 amountOut = amountIn - fee;
        require(amountOut >= amountOutMin, "Insufficient output amount");

        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);

        if (tokenIn == token0) {
            reserve0 += amountIn;
            reserve1 -= amountOut;
        } else {
            reserve1 += amountIn;
            reserve0 -= amountOut;
        }

        IERC20(tokenOut).safeTransfer(to, amountOut);

        amounts = new uint256[](2);
        amounts[0] = amountIn;
        amounts[1] = amountOut;

        emit Swap(msg.sender, amountIn, amountOut, tokenIn, tokenOut);
    }

    // Mock harvest function for yield simulation (adds fixed rewards to reserves)
    function harvest() external {
        // For mock purposes, simulate yield by adding tokens to reserves
        // In a real scenario, this would claim rewards from the protocol
        uint256 reward = totalLiquidity / 100; // 1% reward
        if (reward > 0) {
            // Assume the contract has tokens to add, but in mock, we skip actual minting
            // For testing, you can pre-fund the contract with tokens
            reserve0 += reward / 2;
            reserve1 += reward / 2;
        }
    }

    function getReserves() external view returns (uint256 _reserve0, uint256 _reserve1) {
        _reserve0 = reserve0;
        _reserve1 = reserve1;
    }
}