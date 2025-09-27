// src/app/api/planned-posts/[id]/run-now/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongo";
import PlannedPost from "@/models/PlannedPost";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }   // <- match Next’s (buggy) expectation
) {
  try {
    // protect with secret (query or Bearer)
    const secret =
      req.nextUrl.searchParams.get("secret") ??
      req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await ctx.params;         // <- must await due to Promise type
    await dbConnect();

    const post = await PlannedPost.findByIdAndUpdate(
      id,
      {
        $set: {
          status: "QUEUED",
          scheduledAt: new Date(Date.now() - 1000), // due immediately
          updatedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });
    return NextResponse.json({ ok: true, post });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to queue post" }, { status: 500 });
  }
}
