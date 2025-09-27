// src/app/api/planned-posts/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // avoid any static optimization on Vercel

import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongo";
import PlannedPost, { IPlannedPost } from "@/models/PlannedPost";

// Keep this aligned with your Mongoose enum in PlannedPost schema
const PLATFORM_ENUM = ["INSTAGRAM", "X", "LINKEDIN"] as const;
type PlatformEnum = typeof PLATFORM_ENUM[number];

// Allow preflight / health checks
export async function OPTIONS() {
  return NextResponse.json({ ok: true });
}

// POST /api/planned-posts -> create a planned post
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = (await req.json()) as Partial<IPlannedPost> & {
      media?: { imageUrl?: string };
      imageUrl?: string;
      mediaUrl?: string;
      platforms?: string[];
    };

    // ---- Required fields ----
    if (!body?.userEmail) {
      return NextResponse.json({ error: "userEmail required" }, { status: 400 });
    }
    if (!Array.isArray(body?.platforms) || body.platforms.length === 0) {
      return NextResponse.json({ error: "platforms required" }, { status: 400 });
    }
    if (!body?.kind) {
      return NextResponse.json({ error: "kind required" }, { status: 400 });
    }
    if (!body?.caption) {
      return NextResponse.json({ error: "caption required" }, { status: 400 });
    }
    if (!body?.scheduledAt) {
      return NextResponse.json({ error: "scheduledAt required" }, { status: 400 });
    }

    // ---- Parse scheduledAt (UI sends UTC ISO; store as Date) ----
    const when = new Date(body.scheduledAt as any);
    if (isNaN(when.getTime())) {
      return NextResponse.json({ error: "scheduledAt invalid" }, { status: 400 });
    }

    // ---- Normalize & validate platforms against schema enum (UPPERCASE) ----
    const platforms = (body.platforms as string[])
      .map((p) => String(p).toUpperCase()) as PlatformEnum[];

    for (const p of platforms) {
      if (!PLATFORM_ENUM.includes(p)) {
        return NextResponse.json(
          { error: `platforms contains unsupported value "${p}". Allowed: ${PLATFORM_ENUM.join(", ")}` },
          { status: 400 }
        );
      }
    }

    // ---- Media (for kind=IMAGE) ----
    let imageUrl =
      body.media?.imageUrl?.trim() ??
      body.imageUrl?.trim() ??
      body.mediaUrl?.trim() ??
      "";

    if (body.kind === "IMAGE") {
      if (!imageUrl) {
        return NextResponse.json({ error: "media.imageUrl required for IMAGE" }, { status: 400 });
      }
      // strip trailing junk like ')' or spaces
      imageUrl = imageUrl.replace(/[)\s]+$/g, "");
      // basic sanity: https and image-like extension
      if (!/^https:\/\/.+/i.test(imageUrl) || !/\.(jpe?g|png|webp)(\?.*)?$/i.test(imageUrl)) {
        return NextResponse.json(
          { error: "Provide a valid https image URL (jpg/png/webp)" },
          { status: 400 }
        );
      }
    } else {
      imageUrl = imageUrl || "";
    }

    // ---- Status default: SCHEDULED so cron can pick it up ----
    const status = body.status ?? "SCHEDULED";

    const post = await PlannedPost.create({
      userEmail: body.userEmail,
      platforms,               // ✅ uppercase, matches schema enum
      status,
      kind: body.kind,
      caption: body.caption,
      media: imageUrl ? { imageUrl } : body.media ?? null,
      scheduledAt: when,       // store UTC date directly
    });

    return NextResponse.json({ ok: true, post }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to create planned post" },
      { status: 500 }
    );
  }
}

// GET /api/planned-posts?email=demo@local.dev -> list posts for a user
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
