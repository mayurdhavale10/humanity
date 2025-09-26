// src/app/api/planned-posts/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongo";
import PlannedPost, { IPlannedPost } from "@/models/PlannedPost";

// POST /api/planned-posts  -> create a planned post
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = (await req.json()) as Partial<IPlannedPost>;

    // very light validation
    if (!body?.userEmail || !body?.platforms?.length || !body?.kind || !body?.caption) {
      return NextResponse.json(
        { error: "Missing required fields: userEmail, platforms, kind, caption" },
        { status: 400 }
      );
    }

    const post = await PlannedPost.create({
      userEmail: body.userEmail,
      platforms: body.platforms,
      status: body.status ?? "DRAFT",
      kind: body.kind,
      caption: body.caption,
      media: body.media ?? null,
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
    });

    return NextResponse.json({ ok: true, post }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to create planned post" },
      { status: 500 }
    );
  }
}

// GET /api/planned-posts?email=demo@local.dev  -> list posts for a user
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

    return NextResponse.json({ ok: true, posts });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to list planned posts" },
      { status: 500 }
    );
  }
}
