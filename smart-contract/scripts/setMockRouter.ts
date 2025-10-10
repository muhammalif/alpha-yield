import { ethers } from "hardhat";

async function main() {
  const strategyAddress = process.env.STRATEGY_ADDRESS;
  const mockRouterAddress = process.env.MOCK_ROUTER_ADDRESS;

  if (!strategyAddress || !mockRouterAddress) {
    throw new Error("Missing required environment variables: STRATEGY_ADDRESS, MOCK_ROUTER_ADDRESS");
  }

  const strategy = await ethers.getContractAt("SimpleStrategy", strategyAddress);

  console.log("Setting mockRouter...");
  await strategy.setMockRouter(mockRouterAddress);
  console.log("MockRouter set!");
}

main().catch(console.error);