import { getClients } from "../controllerClient";

async function retryTx(fn: () => Promise<any>, retries = 3, delay = 1000) {
    for (let i = 0; i < retries; i++) {
        try {
            const tx = await fn();
            console.log(`Tx sent (attempt ${i + 1}):`, tx.hash);
            await tx.wait();
            console.log(`Tx mined (attempt ${i + 1}):`, tx.hash);
            return tx;
        } catch (error) {
            console.error(`Tx failed (attempt ${i + 1}/${retries}):`, error);
            if (i < retries - 1) await new Promise(res => setTimeout(res, delay));
        }
    }
    throw new Error("Tx failed after retries");
}

export async function harvestJob() {
    try {
        const { controller, strategy, vault } = getClients();

        // Check if vault has assets; skip if none
        const balanceBefore = await vault.totalAssets();
        console.log(`Vault total assets before harvest: ${balanceBefore}`);
        if (balanceBefore === 0n) {
            console.log("No assets in vault, skipping harvest");
            return;
        }

        // Heuristic: harvesting every N-minute-activated flag, then harvest called
        const shouldBefore = await controller.shouldHarvest();
        console.log(`Should harvest before: ${shouldBefore}`);
        if (!shouldBefore) {
            await retryTx(() => controller.setShouldHarvest(true));
            console.log("Set shouldHarvest to true");
            // Wait for state update
            await new Promise(res => setTimeout(res, 2000));
        }
        const shouldAfter = await controller.shouldHarvest();
        console.log(`Should harvest after: ${shouldAfter}`);

        await retryTx(() => strategy.harvest());
        console.log("Harvest executed successfully");

        // shutdown
        await retryTx(() => controller.setShouldHarvest(false));
        console.log("Set shouldHarvest to false");

        // Monitoring: Log vault balance after harvest
        const balanceAfter = await vault.totalAssets();
        console.log(`Vault total assets after harvest: ${balanceAfter}, change: ${balanceAfter - balanceBefore}`);
    } catch (error) {
        console.error("Harvest job failed:", error);
    }
}