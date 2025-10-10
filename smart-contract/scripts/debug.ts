import { ethers } from "hardhat";

async function main() {
  const signers = await ethers.getSigners();
  const deployer = signers[0];

  // Contract addresses from latest deployment
  const vaultAddress = "0xFE9AC1a46c71Fc0Ba2Fb38AD8d79962cc3A380B1";
  const strategyAddress = "0x25499A7342409a23D6C885eAAE1CCeE8Ca61dA95";
  const mockRouterAddress = "0xea6A09f507fa662462700Ec28c8e105cc5ee1AD9";
  const wrappedU2UAddress = "0xCab3dF50209d455d5E8831fB835d0BB381d74cB5";
  const mockUSDTAddress = "0x5728c12528150EeBDc005b9cbDc113Aa7E4eD589";

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