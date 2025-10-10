import { ethers } from "hardhat";
import { getCreate2Address, keccak256, AbiCoder } from "ethers";

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

  // Get current nonce for prediction
  let nonce = await deployer.provider.getTransactionCount(deployerAddress);
  console.log("Current nonce:", nonce);

  // Predict addresses using nonce
  const predictAddress = (currentNonce: number) => {
    return ethers.getCreateAddress({ from: deployerAddress, nonce: currentNonce });
  };

  // Deploy MockUSDT
  console.log("\n📦 Deploying MockUSDT...");
  console.log("Predicted MockUSDT address:", predictAddress(nonce));
  const MockUSDT = await ethers.getContractFactory("MockUSDT");
  const mockUSDT = await MockUSDT.deploy();
  await mockUSDT.waitForDeployment();
  console.log("MockUSDT deployed to:", await mockUSDT.getAddress());
  nonce++;
  nonce++;

  // Deploy MockToken (for U2U simulation)
  console.log("\n📦 Deploying MockToken (U2U simulation)...");
  console.log("Predicted MockToken address:", predictAddress(nonce + 1));
  const MockToken = await ethers.getContractFactory("MockToken");
  const mockToken = await MockToken.deploy("Mock U2U", "mU2U", ethers.parseEther("1000000"));
  await mockToken.waitForDeployment();
  console.log("MockToken deployed to:", await mockToken.getAddress());
  nonce++;

  // Deploy WrappedU2U
  console.log("\n📦 Deploying WrappedU2U...");
  console.log("Predicted WrappedU2U address:", predictAddress(nonce));
  const WrappedU2U = await ethers.getContractFactory("WrappedU2U");
  const wrappedU2U = await WrappedU2U.deploy();
  await wrappedU2U.waitForDeployment();
  console.log("WrappedU2U deployed to:", await wrappedU2U.getAddress());
  nonce++;

  // Deploy MockRouter
  console.log("\n📦 Deploying MockRouter...");
  console.log("Predicted MockRouter address:", predictAddress(nonce));
  const MockRouter = await ethers.getContractFactory("MockRouter");
  const mockRouter = await MockRouter.deploy(await mockToken.getAddress(), await mockUSDT.getAddress());
  await mockRouter.waitForDeployment();
  console.log("MockRouter deployed to:", await mockRouter.getAddress());
  nonce++;

  // Deploy YieldVault
  console.log("\n📦 Deploying YieldVault...");
  console.log("Predicted YieldVault address:", predictAddress(nonce));
  const YieldVault = await ethers.getContractFactory("YieldVault");
  const yieldVault = await YieldVault.deploy(await wrappedU2U.getAddress(), ethers.ZeroAddress);
  await yieldVault.waitForDeployment();
  console.log("YieldVault deployed to:", await yieldVault.getAddress());
  nonce++;

  // Deploy SimpleStrategy
  console.log("\n📦 Deploying SimpleStrategy...");
  console.log("Predicted SimpleStrategy address:", predictAddress(nonce));
  const SimpleStrategy = await ethers.getContractFactory("SimpleStrategy");
  const simpleStrategy = await SimpleStrategy.deploy(
    await mockToken.getAddress(),
    await mockUSDT.getAddress(),
    await mockRouter.getAddress(),
    await yieldVault.getAddress()
  );
  await simpleStrategy.waitForDeployment();
  console.log("SimpleStrategy deployed to:", await simpleStrategy.getAddress());
  nonce++;

  // Set strategy in vault
  console.log("\n🔗 Setting strategy in vault...");
  await yieldVault.setStrategy(await simpleStrategy.getAddress());
  console.log("Strategy set in vault");

  // (Optional) Deploy AIController and wire to strategy
  console.log("\n🤖 Deploying AIController...");
  console.log("Predicted AIController address:", predictAddress(nonce));
  const AIController = await ethers.getContractFactory("AIController");
  const controller = await AIController.deploy(deployerAddress, deployerAddress);
  await controller.waitForDeployment();
  console.log("AIController deployed to:", await controller.getAddress());
  nonce++;

  console.log("\n🔗 Setting AI controller in strategy...");
  await simpleStrategy.setAIController(await controller.getAddress());
  console.log("AI controller set in strategy");

  // Pre-fund strategy with MockUSDT (pair token) via direct transfer (more reliable)
  console.log("\n💰 Pre-funding strategy with MockUSDT...");
  const fundAmount = ethers.parseEther("100000");
  await mockUSDT.transfer(await simpleStrategy.getAddress(), fundAmount);
  console.log("Strategy funded with MockUSDT via direct transfer");

   // Note: Skipping WU2U funding for now - add liquidity manually if needed

  console.log("\n✅ Deployment completed successfully!");
  console.log("\n📋 Contract Addresses:");
  console.log("MockUSDT:", await mockUSDT.getAddress());
  console.log("MockToken (U2U):", await mockToken.getAddress());
  console.log("WrappedU2U:", await wrappedU2U.getAddress());
  console.log("MockRouter:", await mockRouter.getAddress());
  console.log("YieldVault:", await yieldVault.getAddress());
  console.log("SimpleStrategy:", await simpleStrategy.getAddress());
  console.log("AIController:", await controller.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});


