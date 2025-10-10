import { ethers } from "hardhat";

async function main() {
  const strategyAddress = "0x01b9303b472dE88f00D3C72946B8322f9B9eC1f6";
  const mockRouterAddress = "0x658F329ce0E14f0F33E01541Ce732CbfD86e76de";

  const strategy = await ethers.getContractAt("SimpleStrategy", strategyAddress);

  console.log("Setting mockRouter...");
  await strategy.setMockRouter(mockRouterAddress);
  console.log("MockRouter set!");
}

main().catch(console.error);