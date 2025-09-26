// src/app/api/cron/run/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongo";
import PlannedPost, { IPlannedPost } from "@/models/PlannedPost";

export async function GET() {
  await dbConnect();

  const now = new Date();

  // Find IG posts that are due
  const candidates = await PlannedPost.find({
    status: "QUEUED",
    scheduledAt: { $lte: now },
    platforms: { $in: ["INSTAGRAM"] },
  }).limit(10);

  const processed: Array<{ id: string; ok: boolean; error?: string }> = [];

  for (const post of candidates) {
    // Safely read the image URL from post.media.imageUrl
    const imageUrl =
      (post as unknown as { media?: { imageUrl?: string } })?.media?.imageUrl;

    if (!imageUrl) {
      post.status = "FAILED";
      post.error = "Missing media.imageUrl";
      await post.save();
      processed.push({ id: String(post._id), ok: false, error: post.error });
      continue;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/instagram/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl,                 // ✅ correct field
          caption: post.caption,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "Publish failed");
      }

      // Mark as published
      post.status = "PUBLISHED";
      post.publishedAt = new Date();
      await post.save();

      processed.push({ id: String(post._id), ok: true });
    } catch (err: any) {
      post.status = "FAILED";
      post.error = err?.message || "Publish failed";
      await post.save();
      processed.push({ id: String(post._id), ok: false, error: post.error });
    }
  }

  return NextResponse.json({ ok: true, processed });
}
