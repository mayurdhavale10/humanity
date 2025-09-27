// src/app/api/planned-posts/[id]/debug/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { dbConnect } from "@/lib/mongo";
import PlannedPost from "@/models/PlannedPost";

/**
 * Optional auth:
 * - Set DEBUG_SECRET in Vercel envs if you want to protect this endpoint.
 * - Call as /api/planned-posts/:id/debug?secret=YOUR_DEBUG_SECRET
 */
const DEBUG_SECRET = process.env.DEBUG_SECRET || "";

function resolveMediaUrl(post: any): string | null {
  return (
    post?.media?.imageUrl?.toString().trim() ||
    post?.mediaUrl?.toString().trim() ||
    post?.imageUrl?.toString().trim() ||
    null
  );
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Optional auth
    if (DEBUG_SECRET) {
      const url = new URL(req.url);
      const incoming =
        url.searchParams.get("secret") ??
        req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
      if (incoming !== DEBUG_SECRET) {
        return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
      }
    }

    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ ok: false, error: "Invalid post id" }, { status: 400 });
    }

    await dbConnect();

    const doc = await PlannedPost.findById(id).lean();
    if (!doc) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }

    const now = new Date();
    const sched = doc.scheduledAt ? new Date(doc.scheduledAt) : null;
    const status = doc.status as string;

    // Eligibility for cron: queued/scheduled and due
    const isQueueStatus = ["QUEUED", "SCHEDULED"].includes(status);
    const isDue = sched ? sched.getTime() <= now.getTime() : false;
    const eligibleForCron = isQueueStatus && isDue;

    let whyNotEligible: string | null = null;
    if (!eligibleForCron) {
      if (!isQueueStatus) {
        whyNotEligible = `status is ${status}, not QUEUED/SCHEDULED`;
      } else if (!isDue) {
        whyNotEligible = `scheduledAt is in the future`;
      }
    }

    const mediaUrl = resolveMediaUrl(doc);
    const platforms = Array.isArray(doc.platforms) ? doc.platforms : [];
    const results = Array.isArray((doc as any).results) ? (doc as any).results : [];
    const attempts = (doc as any).attempts ?? 0;

    return NextResponse.json({
      ok: true,
      id: String(doc._id),
      status,
      userEmail: doc.userEmail,
      platforms,
      caption: doc.caption,
      mediaUrlResolved: mediaUrl,
      scheduledAtISO: sched ? sched.toISOString() : null,
      serverNowISO: now.toISOString(),
      eligibleForCron,
      whyNotEligible,
      error: (doc as any).error ?? null,
      attempts,
      publishedAtISO: doc.publishedAt ? new Date(doc.publishedAt).toISOString() : null,
      results, // includes { platform, remoteId, postedAt, source? }
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || String(e) },
      { status: 500 }
    );
  }
}
