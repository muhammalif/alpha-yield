import { ethers } from "hardhat";

async function main() {
  const signers = await ethers.getSigners();
  const deployer = signers[0];

  const vaultAddress = process.env.VAULT_ADDRESS;
  const strategyAddress = process.env.STRATEGY_ADDRESS;
  const mockRouterAddress = process.env.MOCK_ROUTER_ADDRESS;
  const wrappedU2UAddress = process.env.WRAPPED_U2U_ADDRESS;
  const peggedUSDTAddress = process.env.PEGGED_USDT_ADDRESS;

  if (!vaultAddress || !strategyAddress || !mockRouterAddress || !wrappedU2UAddress || !peggedUSDTAddress) {
    throw new Error("Missing required environment variables: VAULT_ADDRESS, STRATEGY_ADDRESS, MOCK_ROUTER_ADDRESS, WRAPPED_U2U_ADDRESS, PEGGED_USDT_ADDRESS");
  }

  const vault = await ethers.getContractAt("YieldVault", vaultAddress, deployer);
  const strategy = await ethers.getContractAt("SimpleStrategy", strategyAddress, deployer);
  const mockRouter = await ethers.getContractAt("MockRouter", mockRouterAddress, deployer);
  const wU2U = await ethers.getContractAt("WrappedU2U", wrappedU2UAddress, deployer);
  const pUSDT = await ethers.getContractAt("IERC20", peggedUSDTAddress, deployer);

  console.log("=== VAULT STATE ===");
  console.log("Vault totalAssets:", await vault.totalAssets());
  console.log("Vault balances[deployer]:", await vault.balances(deployer.address));
  console.log("Vault WU2U balance:", await wU2U.balanceOf(vaultAddress));

  console.log("\n=== STRATEGY STATE ===");
  console.log("Strategy totalAssets:", await strategy.getStrategyBalance());
  // liquidityProvided is private
  console.log("Strategy WU2U balance:", await wU2U.balanceOf(strategyAddress));
  console.log("Strategy pUSDT balance:", await pUSDT.balanceOf(strategyAddress));

  console.log("\n=== MOCK ROUTER STATE ===");
  console.log("MockRouter token0:", await mockRouter.token0());
  console.log("MockRouter token1:", await mockRouter.token1());
  const [reserve0, reserve1] = await mockRouter.getReserves();
  console.log("MockRouter reserve0 (WU2U):", reserve0);
  console.log("MockRouter reserve1 (pUSDT):", reserve1);
  console.log("MockRouter totalLiquidity:", await mockRouter.totalLiquidity());
  console.log("MockRouter liquidity[strategy]:", await mockRouter.liquidity(strategyAddress));
  console.log("MockRouter WU2U balance:", await wU2U.balanceOf(mockRouterAddress));
  console.log("MockRouter pUSDT balance:", await pUSDT.balanceOf(mockRouterAddress));

  console.log("\n=== WU2U CONTRACT STATE ===");
  console.log("WU2U total supply:", await wU2U.totalSupply());
  console.log("WU2U ETH balance:", await ethers.provider.getBalance(wrappedU2UAddress));

  console.log("\n=== AI CONTROLLER STATE ===");
  const aiControllerAddress = await strategy.aiController();
  if (aiControllerAddress !== ethers.ZeroAddress) {
    const aiController = await ethers.getContractAt("AIController", aiControllerAddress, deployer);
    console.log("AI targetSlippageBps:", await aiController.targetSlippageBps());
    console.log("AI shouldHarvest:", await aiController.shouldHarvest());
  } else {
    console.log("No AI controller set");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});