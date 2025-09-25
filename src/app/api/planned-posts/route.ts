// src/app/api/cron/run/route.ts
import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongo";
import PlannedPost from "@/models/PlannedPost";

export const runtime = "nodejs";

export async function GET() {
  try {
    await dbConnect();

    const now = new Date();

    // 1) Find queued posts whose time has arrived
    const duePosts = await PlannedPost.find({
      status: { $in: ["SCHEDULED", "QUEUED"] },
      scheduledAt: { $lte: now },
    }).lean();

    if (!duePosts.length) {
      return NextResponse.json({ ok: true, ran: now, processed: 0 });
    }

    let processed = 0;
    for (const post of duePosts) {
      try {
        // 🔗 Call your existing Instagram publish API
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/instagram/publish`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              imageUrl: post.media?.url || post.media,
              caption: post.caption,
            }),
          }
        );

        const data = await res.json();

        if (res.ok && data.ok) {
          await PlannedPost.findByIdAndUpdate(post._id, {
            status: "PUBLISHED",
            publishedAt: new Date(),
          });
        } else {
          await PlannedPost.findByIdAndUpdate(post._id, {
            status: "FAILED",
            error: data.error || "Unknown error",
          });
        }
      } catch (err: any) {
        await PlannedPost.findByIdAndUpdate(post._id, {
          status: "FAILED",
          error: err.message,
        });
      }
      processed++;
    }

    return NextResponse.json({ ok: true, ran: now, processed });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Cron run failed" },
      { status: 500 }
    );
  }
}
