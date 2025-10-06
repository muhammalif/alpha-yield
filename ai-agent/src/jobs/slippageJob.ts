import { getClients } from "../controllerClient";
import dotenv from "dotenv";
dotenv.config();

async function retryTx(fn: () => Promise<any>, retries = 3, delay = 1000) {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error) {
            console.error(`Tx failed (attempt ${i + 1}/${retries}):`, error);
            if (i < retries - 1) await new Promise(res => setTimeout(res, delay));
        }
    }
    throw new Error("Tx failed after retries");
}

export async function slippageJob() {
    try {
        const { controller, provider } = getClients();
        const gasThreshold = parseInt(process.env.GAS_THRESHOLD_GWEI!);

        // Dynamic Heuristic: Check gas price, adjust slippage
        const feeData = await provider.getFeeData();
        const gasPriceGwei = Number(feeData.gasPrice) / 1e9; // Convert to Gwei
        const targetBps = gasPriceGwei > gasThreshold ? 60 : 40; // Higher slippage if gas is high

        console.log(`Gas price: ${gasPriceGwei} Gwei, setting slippage to ${targetBps} bps`);

        const current = await controller.targetSlippageBps();
        if (current !== BigInt(targetBps)) {
            await retryTx(() => controller.setTargetSlippage(targetBps));
        }
    } catch (error) {
        console.error("Slippage job failed:", error);
    }
}