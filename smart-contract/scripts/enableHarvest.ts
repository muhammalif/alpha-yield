import { ethers } from "hardhat";

async function main() {
  const signers = await ethers.getSigners();
  const deployer = signers[0];

  // AIController address from latest deployment
  const controllerAddress = "0xBE93F5176a7870Da45dBC4921419a1B58267e1a8";
  const controller = await ethers.getContractAt("AIController", controllerAddress, deployer);

  console.log("Enabling harvest...");
  await controller.setShouldHarvest(true);
  console.log("Harvest enabled!");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});