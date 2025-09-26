// src/app/api/planned-posts/[id]/run-now/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongo";
import PlannedPost from "@/models/PlannedPost";

// Force a specific planned post to run ASAP by queueing it for "now"
export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }  // <-- NOTE the Promise here
) {
  try {
    const { id } = await ctx.params;        // <-- await the params
    await dbConnect();

    const post = await PlannedPost.findByIdAndUpdate(
      id,
      {
        $set: {
          status: "QUEUED",
          scheduledAt: new Date(Date.now() - 1000), // make it due immediately
          updatedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, post });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to queue post" },
      { status: 500 }
    );
  }
}
