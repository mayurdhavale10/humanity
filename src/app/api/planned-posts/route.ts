export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongo";
import PlannedPost, { IPlannedPost } from "@/models/PlannedPost";

// CREATE a planned post
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();

    // minimal guard
    if (!body?.userEmail) {
      return NextResponse.json({ error: "userEmail is required" }, { status: 400 });
    }
    if (!Array.isArray(body?.platforms) || body.platforms.length === 0) {
      return NextResponse.json({ error: "platforms[] is required" }, { status: 400 });
    }
    if (!body?.kind) {
      return NextResponse.json({ error: "kind is required" }, { status: 400 });
    }

    const post = await PlannedPost.create(body);
    return NextResponse.json({ ok: true, post }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to create planned post" },
      { status: 500 }
    );
  }
}

// LIST planned posts for a user
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    if (!email) {
      return NextResponse.json({ error: "Missing ?email=" }, { status: 400 });
    }

    const posts = await PlannedPost.find({ userEmail: email })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return NextResponse.json({ ok: true, posts: posts as unknown as IPlannedPost[] });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to list planned posts" },
      { status: 500 }
    );
  }
}
