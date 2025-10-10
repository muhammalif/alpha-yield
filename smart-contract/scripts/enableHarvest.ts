import { ethers } from "hardhat";

async function main() {
  const signers = await ethers.getSigners();
  const deployer = signers[0];

  // AIController address from latest deployment
  const controllerAddress = "0xee2aE9Dd768d221AA51b252D3127c996AB531d1a";
  const controller = await ethers.getContractAt("AIController", controllerAddress, deployer);

  console.log("Enabling harvest...");
  await controller.setShouldHarvest(true);
  console.log("Harvest enabled!");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});