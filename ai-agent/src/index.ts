import { slippageJob } from "./jobs/slippageJob";
import { harvestJob } from "./jobs/harvestJob";

async function loop() {
  try { await slippageJob(); } catch (e) { console.error("Slippage job error:", e); }

  // Run harvest job every loop (since strategy doesn't have pendingRewards function)
  try {
    await harvestJob();
  } catch (e) {
    console.error("Harvest job error:", e);
  }
}

setInterval(loop, 60_000); // running every 60 seconds
console.log("AI Agent (minimal) running...");