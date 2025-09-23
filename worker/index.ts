import { Worker, Job } from "bullmq";
import mongoose from "mongoose";
import { Schema, model, models } from "mongoose";

const REDIS_URL = process.env.REDIS_URL!;
const MONGO_URI = process.env.DATABASE_URL!;
if (!REDIS_URL) throw new Error("Missing REDIS_URL");
if (!MONGO_URI) throw new Error("Missing DATABASE_URL");

// --- Minimal PlannedPost model (dup of src/models/PlannedPost.ts) ---
const PlannedPostSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true, required: true },
    platforms: { type: [String], enum: ["X", "LINKEDIN", "INSTAGRAM"], required: true },
    status: { type: String, enum: ["DRAFT","SCHEDULED","QUEUED","PUBLISHED","FAILED"], default: "DRAFT", index: true },
    kind: { type: String, enum: ["TEXT","IMAGE","VIDEO"], required: true },
    caption: { type: String, required: true },
    media: Schema.Types.Mixed,
    scheduledAt: { type: Date, index: true },
    publishedAt: Date,
    error: String,
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);
const PlannedPost = models.PlannedPost || model("PlannedPost", PlannedPostSchema);

// --- Connect Mongo once ---
async function connectMongo() {
  await mongoose.connect(MONGO_URI, { dbName: "humanityhack" }); // omit dbName if included in URI
  console.log("Worker connected to Mongo");
}

// --- Job handler ---
async function handlePublish(job: Job<{ postId: string }>) {
  const { postId } = job.data;
  const post = await PlannedPost.findById(postId);
  if (!post) {
    console.warn("Post not found:", postId);
    return;
  }

  try {
    // TODO: call platform adapters for each post.platforms
    // e.g., await publishToX(post), await publishToLinkedIn(post)...
    console.log("Publishing:", postId, "→", post.platforms.join(", "), "|", post.caption);

    post.status = "PUBLISHED";
    post.publishedAt = new Date();
    post.error = null as any;
    await post.save();
  } catch (err: any) {
    post.status = "FAILED";
    post.error = String(err?.message || err);
    await post.save();
    throw err; // let BullMQ apply backoff/retry
  }
}

// --- Boot worker ---
(async () => {
  await connectMongo();

  new Worker(
    "publish",
    async (job) => handlePublish(job),
    { connection: { url: REDIS_URL } }
  );

  console.log("Publish worker running…");
})();
