import { Queue } from "bullmq";
export const publishQueue = new Queue("publish", { connection: { url: process.env.REDIS_URL! } });
