import mongoose from "mongoose";

const uri = process.env.DATABASE_URL!;
if (!uri) throw new Error("Missing DATABASE_URL");

type Cached = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
// @ts-expect-error attach cache to global to avoid re-connecting in dev
let cached: Cached = global._mongooseCache ?? { conn: null, promise: null };
// @ts-expect-error
global._mongooseCache = cached;

export async function dbConnect() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, {
      // dbName is optional if you included it in the URI (…/humanityhack)
      // dbName: "humanityhack",
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
