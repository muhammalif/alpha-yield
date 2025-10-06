import { ethers } from "ethers";
import dotenv from "dotenv";
dotenv.config();

const rpc = process.env.RPC!;
const pk = process.env.PRIVATE_KEY_STRATEGIST!;
const controllerAddr = process.env.CONTROLLER_ADDRESS!;
const strategyAddr = process.env.STRATEGY_ADDRESS!;

const aiControllerAbi = [
    "function setTargetSlippage(uint256 bps) external",
    "function setShouldHarvest(bool v) external",
    "function targetSlippageBps() view returns (uint256)",
    "function shouldHarvest() view returns (bool)"
];
const strategyAbi = ["function harvest() external"];
const vaultAbi = ["function totalAssets() view returns (uint256)"];

export function getClients() {
    const provider = new ethers.JsonRpcProvider(rpc);
    const wallet = new ethers.Wallet(pk, provider);
    const controller = new ethers.Contract(controllerAddr, aiControllerAbi, wallet);
    const strategy = new ethers.Contract(strategyAddr, strategyAbi, wallet);
    const vault = new ethers.Contract(process.env.VAULT_ADDRESSS!, vaultAbi, provider); // Read-only for monitoring
    return { provider, wallet, controller, strategy, vault };
}