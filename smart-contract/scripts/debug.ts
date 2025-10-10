import { ethers } from "hardhat";

async function main() {
  const signers = await ethers.getSigners();
  const deployer = signers[0];

  const vaultAddress = "0x05CC0e60fF05946f4f5366a112BEb570b25C4AC9";
  const strategyAddress = "0x01b9303b472dE88f00D3C72946B8322f9B9eC1f6";
  const mockRouterAddress = "0x658F329ce0E14f0F33E01541Ce732CbfD86e76de";
  const wrappedU2UAddress = "0x37a339c9222238C53C63bfE06f6eA02e7682f3B3";
  const mockUSDTAddress = "0x43862a05B5E0000ddFD11bb72576681a21918C9D";

  const vault = await ethers.getContractAt("YieldVault", vaultAddress, deployer);
  const strategy = await ethers.getContractAt("SimpleStrategy", strategyAddress, deployer);
  const mockRouter = await ethers.getContractAt("MockRouter", mockRouterAddress, deployer);
  const wU2U = await ethers.getContractAt("WrappedU2U", wrappedU2UAddress, deployer);
  const mUSDT = await ethers.getContractAt("MockUSDT", mockUSDTAddress, deployer);

  console.log("=== VAULT STATE ===");
  console.log("Vault totalAssets:", await vault.totalAssets());
  console.log("Vault balances[deployer]:", await vault.balances(deployer.address));
  console.log("Vault WU2U balance:", await wU2U.balanceOf(vaultAddress));

  console.log("\n=== STRATEGY STATE ===");
  console.log("Strategy totalAssets:", await strategy.getStrategyBalance());
  // liquidityProvided is private
  console.log("Strategy WU2U balance:", await wU2U.balanceOf(strategyAddress));
  console.log("Strategy mUSDT balance:", await mUSDT.balanceOf(strategyAddress));

  console.log("\n=== MOCK ROUTER STATE ===");
  console.log("MockRouter token0:", await mockRouter.token0());
  console.log("MockRouter token1:", await mockRouter.token1());
  const [reserve0, reserve1] = await mockRouter.getReserves();
  console.log("MockRouter reserve0 (WU2U):", reserve0);
  console.log("MockRouter reserve1 (mUSDT):", reserve1);
  console.log("MockRouter totalLiquidity:", await mockRouter.totalLiquidity());
  console.log("MockRouter liquidity[strategy]:", await mockRouter.liquidity(strategyAddress));
  console.log("MockRouter WU2U balance:", await wU2U.balanceOf(mockRouterAddress));
  console.log("MockRouter mUSDT balance:", await mUSDT.balanceOf(mockRouterAddress));

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