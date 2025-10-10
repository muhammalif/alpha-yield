import { ethers } from "hardhat";

async function main() {
  const strategyAddress = "0xB98AFAC9B8Eb06211646dED6109c801af5964D9A";
  const mockRouterAddress = "0x5B43b1f153fe2E5fe5d634eB2669d53dcBf94cBd";

  const strategy = await ethers.getContractAt("SimpleStrategy", strategyAddress);

  console.log("Setting mockRouter...");
  await strategy.setMockRouter(mockRouterAddress);
  console.log("MockRouter set!");
}

main().catch(console.error);