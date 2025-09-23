// src/lib/queue.ts
import { Queue } from "bullmq";

let q: Queue | null = null;

function isBuildTime() {
  // Next sets this during prod build
  return process.env.NEXT_PHASE === "phase-production-build";
}

export function getPublishQueue(): Queue | null {
  if (isBuildTime()) return null; // <-- avoid Redis in build
  if (!process.env.REDIS_URL) return null; // optional: skip if not configured

  if (!q) {
    q = new Queue("publish", {
      connection: { url: process.env.REDIS_URL as string },
    });
  }
  return q;
}
