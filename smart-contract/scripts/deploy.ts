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

  // Deploy MockUSDT
  console.log("\n📦 Deploying MockUSDT...");
  const MockUSDT = await ethers.getContractFactory("MockUSDT");
  const mockUSDT = await MockUSDT.deploy();
  await mockUSDT.waitForDeployment();
  const mockUSDTAddress = await mockUSDT.getAddress();
  console.log("MockUSDT deployed to:", mockUSDTAddress);

  // Deploy MockToken (U2U simulation)
  console.log("\n📦 Deploying MockToken (U2U simulation)...");
  const MockToken = await ethers.getContractFactory("MockToken");
  const mockToken = await MockToken.deploy("Mock U2U", "mU2U", ethers.parseEther("1000000"));
  await mockToken.waitForDeployment();
  const mockTokenAddress = await mockToken.getAddress();
  console.log("MockToken deployed to:", mockTokenAddress);

  // Deploy WrappedU2U
  console.log("\n📦 Deploying WrappedU2U...");
  const WrappedU2U = await ethers.getContractFactory("WrappedU2U");
  const wrappedU2U = await WrappedU2U.deploy();
  await wrappedU2U.waitForDeployment();
  const wrappedU2UAddress = await wrappedU2U.getAddress();
  console.log("WrappedU2U deployed to:", wrappedU2UAddress);

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

  // Pre-fund strategy with MockUSDT (pair token) via direct transfer (more reliable)
  console.log("\n💰 Pre-funding strategy with MockUSDT...");
  const fundAmount = ethers.parseEther("100000");
  await mockUSDT.transfer(simpleStrategyAddress, fundAmount);
  console.log("Strategy funded with MockUSDT via direct transfer");

  console.log("\n✅ Deployment completed successfully!");
  console.log("\n📋 Contract Addresses:");
  console.log("MockUSDT:", mockUSDTAddress);
  console.log("MockToken (U2U):", mockTokenAddress);
  console.log("WrappedU2U:", wrappedU2UAddress);
  console.log("MockRouter:", mockRouterAddress);
  console.log("YieldVault:", yieldVaultAddress);
  console.log("SimpleStrategy:", simpleStrategyAddress);
  console.log("AIController:", controllerAddress);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});


