import { ethers } from "hardhat";

async function main() {
  const strategyAddress = "0x25499A7342409a23D6C885eAAE1CCeE8Ca61dA95";
  const mockRouterAddress = "0xea6A09f507fa662462700Ec28c8e105cc5ee1AD9";

  const strategy = await ethers.getContractAt("SimpleStrategy", strategyAddress);

  console.log("Setting mockRouter...");
  await strategy.setMockRouter(mockRouterAddress);
  console.log("MockRouter set!");
}

main().catch(console.error);