import { ethers } from "hardhat";

async function main() {
  const vaultAddress = "0x5Cdf36Dff5f1bbDd7D65eEd044729beEc7B13eB4";
  const vault = await ethers.getContractAt("YieldVault", vaultAddress);

  const strategy = await vault.strategyRouter();
  console.log("Strategy in vault:", strategy);

  const token = await vault.token();
  console.log("Token in vault:", token);

  const totalAssets = await vault.totalAssets();
  console.log("Total assets:", totalAssets);
}

main().catch(console.error);