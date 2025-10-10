import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Starting deployment...");

  const signers = await ethers.getSigners();
  if (!signers.length) {
    throw new Error("No signer configured. Set PRIVATE_KEY in .env for the 'nebulas' network.");
  }
  const deployer = signers[0];
  const deployerAddress = await deployer.getAddress();
  console.log("Deploying contracts with account:", deployerAddress);
  console.log("Account balance:", (await deployer.provider.getBalance(deployerAddress)).toString());

  // Use mainnet addresses
  const wrappedU2UAddress = "0xA99cf32e9aAa700f9E881BA9BF2C57A211ae94df"; // WU2U mainnet
  const mockUSDTAddress = "0x0820957B320E901622385Cc6C4fca196b20b939F"; // pUSDT mainnet
  console.log("Using WU2U:", wrappedU2UAddress);
  console.log("Using pUSDT:", mockUSDTAddress);

  // Deploy MockRouter
  console.log("\n📦 Deploying MockRouter...");
  const MockRouter = await ethers.getContractFactory("MockRouter");
  const mockRouter = await MockRouter.deploy(wrappedU2UAddress, mockUSDTAddress);
  await mockRouter.waitForDeployment();
  const mockRouterAddress = await mockRouter.getAddress();
  console.log("MockRouter deployed to:", mockRouterAddress);

  // Deploy YieldVault
  console.log("\n📦 Deploying YieldVault...");
  const YieldVault = await ethers.getContractFactory("YieldVault");
  const yieldVault = await YieldVault.deploy(wrappedU2UAddress, ethers.ZeroAddress);
  await yieldVault.waitForDeployment();
  const yieldVaultAddress = await yieldVault.getAddress();
  console.log("YieldVault deployed to:", yieldVaultAddress);

  // Deploy SimpleStrategy
  console.log("\n📦 Deploying SimpleStrategy...");
  const SimpleStrategy = await ethers.getContractFactory("SimpleStrategy");
  const simpleStrategy = await SimpleStrategy.deploy(
    wrappedU2UAddress,
    mockUSDTAddress,
    mockRouterAddress,
    yieldVaultAddress
  );
  await simpleStrategy.waitForDeployment();
  const simpleStrategyAddress = await simpleStrategy.getAddress();
  console.log("SimpleStrategy deployed to:", simpleStrategyAddress);

  // Set strategy in vault
  console.log("\n🔗 Setting strategy in vault...");
  await yieldVault.setStrategy(simpleStrategyAddress);
  console.log("Strategy set in vault");

  // Deploy AIController
  console.log("\n🤖 Deploying AIController...");
  const AIController = await ethers.getContractFactory("AIController");
  const controller = await AIController.deploy(deployerAddress, deployerAddress);
  await controller.waitForDeployment();
  const controllerAddress = await controller.getAddress();
  console.log("AIController deployed to:", controllerAddress);

  console.log("\n🔗 Setting AI controller in strategy...");
  await simpleStrategy.setAIController(controllerAddress);
  console.log("AI controller set in strategy");

  // Note: Fund strategy with pUSDT manually after deployment (transfer pUSDT to strategy address)
  console.log("\n💰 Note: Manually fund strategy with pUSDT after deployment");

  console.log("\n✅ Deployment completed successfully!");
  console.log("\n📋 Contract Addresses:");
  console.log("WU2U (mainnet):", wrappedU2UAddress);
  console.log("pUSDT (mainnet):", mockUSDTAddress);
  console.log("MockRouter:", mockRouterAddress);
  console.log("YieldVault:", yieldVaultAddress);
  console.log("SimpleStrategy:", simpleStrategyAddress);
  console.log("AIController:", controllerAddress);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});


