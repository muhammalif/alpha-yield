import { ethers } from "hardhat";

async function main() {
  const vaultAddress = "0x7e80B8e7dF6F8A09BD2899D3BD49B26EA2cf9c40";
  const vault = await ethers.getContractAt("YieldVault", vaultAddress);

  const strategy = await vault.strategyRouter();
  console.log("Strategy in vault:", strategy);

  const token = await vault.token();
  console.log("Token in vault:", token);

  const totalAssets = await vault.totalAssets();
  console.log("Total assets:", totalAssets);
}

main().catch(console.error);