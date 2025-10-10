import { ethers } from "hardhat";

async function main() {
  const signers = await ethers.getSigners();
  const deployer = signers[0];

  // AIController address from latest deployment
  const controllerAddress = "0xb0adB1a08E10264C6bDF8c33b8EA3633EcC9Cc44";
  const controller = await ethers.getContractAt("AIController", controllerAddress, deployer);

  console.log("Enabling harvest...");
  await controller.setShouldHarvest(true);
  console.log("Harvest enabled!");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});