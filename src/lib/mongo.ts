// src/lib/mongo.ts
import mongoose from "mongoose";

type Cached = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
// @ts-expect-error attach cache to global to avoid re-connecting in dev
let cached: Cached = global._mongooseCache ?? { conn: null, promise: null };
// @ts-expect-error
global._mongooseCache = cached;

export async function dbConnect() {
  if (cached.conn) return cached.conn;

  const uri = process.env.DATABASE_URL; // ← read lazily
  if (!uri) {
    // In build or missing env: skip connecting; callers must handle null
    return null as unknown as typeof mongoose;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri /* { dbName: "humanityhack" } */);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
