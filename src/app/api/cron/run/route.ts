// src/app/api/cron/run/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongo";
import PlannedPost from "@/models/PlannedPost";

const CRON_SECRET = process.env.CRON_SECRET;
const GRAPH_BATCH_LIMIT = 10; // safety cap per run

export async function GET(req: NextRequest) {
  // --- Auth guard (required) ---
  const url = new URL(req.url);
  const provided = url.searchParams.get("secret");
  if (!CRON_SECRET || provided !== CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();

  // Find posts due now (or earlier) that are queued and include Instagram
  const now = new Date();
  const due = await PlannedPost.find({
    status: "QUEUED",
    scheduledAt: { $lte: now },
    platforms: { $in: ["INSTAGRAM"] },
  })
    .sort({ scheduledAt: 1 })
    .limit(GRAPH_BATCH_LIMIT)
    .exec();

  const processed: Array<{ id: string; status: string; error?: string }> = [];

  for (const post of due) {
    try {
      // Expecting media.imageUrl per our POST /api/planned-posts contract
      const imageUrl: string | undefined =
        (post as any)?.media?.imageUrl || (post as any)?.mediaUrl;

      if (!imageUrl) {
        await PlannedPost.findByIdAndUpdate(post._id, {
          status: "FAILED",
          error: "Missing media.imageUrl",
          publishedAt: new Date(),
        });
        processed.push({ id: String(post._id), status: "FAILED", error: "Missing media.imageUrl" });
        continue;
      }

      // Call your existing publish endpoint
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/instagram/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl,
          caption: post.caption || "",
        }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.ok) {
        const msg =
          body?.error ||
          `Publish failed with HTTP ${res.status} ${res.statusText}`;
        await PlannedPost.findByIdAndUpdate(post._id, {
          status: "FAILED",
          error: msg,
          publishedAt: new Date(),
        });
        processed.push({ id: String(post._id), status: "FAILED", error: msg });
        continue;
      }

      // Success
      await PlannedPost.findByIdAndUpdate(post._id, {
        status: "PUBLISHED",
        publishedAt: new Date(),
        error: undefined,
      });
      processed.push({ id: String(post._id), status: "PUBLISHED" });
    } catch (err: any) {
      await PlannedPost.findByIdAndUpdate(post._id, {
        status: "FAILED",
        error: err?.message || String(err),
        publishedAt: new Date(),
      });
      processed.push({
        id: String(post._id),
        status: "FAILED",
        error: err?.message || String(err),
      });
    }
  }

  return NextResponse.json({ ok: true, processed });
}
