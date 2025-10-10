import { ethers } from "hardhat";

async function main() {
  const strategyAddress = "0xD9CA71f7544830dFEB0A9bc420203be9fcC86Cf3";
  const mockRouterAddress = "0x3b982CbeCAb10ef2667374077E95CEee8ABe4a54";

  const strategy = await ethers.getContractAt("SimpleStrategy", strategyAddress);

  console.log("Setting mockRouter...");
  await strategy.setMockRouter(mockRouterAddress);
  console.log("MockRouter set!");
}

main().catch(console.error);