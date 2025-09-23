import type { Job } from "bullmq";
export async function publishJob(job: Job) {
  console.log("Publish job payload:", job.data);
  // TODO: route to X/LinkedIn/IG services.
}
