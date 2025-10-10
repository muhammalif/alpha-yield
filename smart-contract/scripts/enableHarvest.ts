import { ethers } from "hardhat";

async function main() {
  const signers = await ethers.getSigners();
  const deployer = signers[0];

  const controllerAddress = process.env.CONTROLLER_ADDRESS;

  if (!controllerAddress) {
    throw new Error("Missing required environment variable: CONTROLLER_ADDRESS");
  }
  const controller = await ethers.getContractAt("AIController", controllerAddress, deployer);

  console.log("Enabling harvest...");
  await controller.setShouldHarvest(true);
  console.log("Harvest enabled!");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});