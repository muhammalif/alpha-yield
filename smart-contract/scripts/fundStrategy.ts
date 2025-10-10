import { ethers } from "hardhat";

async function main() {
  console.log("Funding strategy with pUSDT...");

  const signers = await ethers.getSigners();
  if (!signers.length) {
    throw new Error("No signer configured. Set PRIVATE_KEY in .env for the 'solaris' network.");
  }
  const deployer = signers[0];
  const deployerAddress = await deployer.getAddress();
  console.log("Funding from account:", deployerAddress);

  // Mainnet addresses
  const strategyAddress = process.env.STRATEGY_ADDRESS;
  const pUSDTAddress = process.env.PEGGED_USDT_ADDRESS;

  if (!strategyAddress || !pUSDTAddress) {
    throw new Error("Missing required environment variables: STRATEGY_ADDRESS, PEGGED_USDT_ADDRESS");
  }

  // Get pUSDT contract
  const pUSDT = await ethers.getContractAt("IERC20", pUSDTAddress);

  // Check deployer balance
  const balance = await pUSDT.balanceOf(deployerAddress);
  console.log("Deployer pUSDT balance:", ethers.formatEther(balance));

  // Amount to fund (e.g., 1000 pUSDT)
  const fundAmount = ethers.parseEther("1000");
  console.log("Funding amount:", ethers.formatEther(fundAmount));

  // Transfer pUSDT to strategy
  const tx = await pUSDT.transfer(strategyAddress, fundAmount);
  await tx.wait();
  console.log("Funded strategy with pUSDT. Tx:", tx.hash);

  // Verify strategy balance
  const strategyBalance = await pUSDT.balanceOf(strategyAddress);
  console.log("Strategy pUSDT balance:", ethers.formatEther(strategyBalance));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});