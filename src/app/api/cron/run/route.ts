// src/app/api/cron/run/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongo";
import PlannedPost from "@/models/PlannedPost";

export async function GET() {
  await dbConnect();
  const now = new Date();

  const posts = await PlannedPost.find({
    status: "queued",
    scheduledAt: { $lte: now },
  }).limit(5); // batch size

  const results = [];

  for (const post of posts) {
    try {
      // Call your existing publish endpoint
      const resp = await fetch(`${process.env.BASE_URL}/api/instagram/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: post.mediaUrl,
          caption: post.caption,
        }),
      });
      const data = await resp.json();

      if (!resp.ok) throw new Error(data.error || "Publish failed");

      post.status = "posted";
      post.resultId = data.publish?.id || "";
      await post.save();

      results.push({ id: post._id, status: "posted" });
    } catch (err: any) {
      post.status = "failed";
      post.error = err.message;
      await post.save();

      results.push({ id: post._id, status: "failed", error: err.message });
    }
  }

  return NextResponse.json({ ok: true, processed: results });
}
