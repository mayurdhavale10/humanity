// worker/index.ts
import { Worker } from "bullmq";
import mongoose from "mongoose";

export async function startWorker() {
  // ... your current connectMongo + new Worker(...) code ...
}

// only run when executed: `node worker/index.ts`
if (require.main === module) {
  startWorker().catch((e) => {
    console.error("Worker failed to start", e);
    process.exit(1);
  });
}
