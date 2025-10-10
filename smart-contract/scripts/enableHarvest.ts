import { ethers } from "hardhat";

async function main() {
  const signers = await ethers.getSigners();
  const deployer = signers[0];

  // AIController address from latest deployment
  const controllerAddress = "0x03ea1E83E1DB1128246fFEd62a97b8C459725c9F";
  const controller = await ethers.getContractAt("AIController", controllerAddress, deployer);

  console.log("Enabling harvest...");
  await controller.setShouldHarvest(true);
  console.log("Harvest enabled!");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});