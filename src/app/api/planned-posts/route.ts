// src/app/api/planned-posts/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongo";
import PlannedPost from "@/models/PlannedPost";
import { getEffectiveEmail } from "@/lib/auth";

// Keep aligned with your Mongoose enum
const PLATFORM_ENUM = ["INSTAGRAM", "X", "LINKEDIN"] as const;
type PlatformEnum = (typeof PLATFORM_ENUM)[number];

export async function OPTIONS() {
  return NextResponse.json({ ok: true });
}

// POST /api/planned-posts → create (Demo or User auto-selected)
export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const body = (await req.json().catch(() => ({}))) as {
      userEmail?: string;
      platforms?: string[];
      status?: string;
      kind?: "IMAGE" | "TEXT";
      caption?: string;
      media?: { imageUrl?: string };
      imageUrl?: string;
      mediaUrl?: string;
      scheduledAt?: string | Date;
      useDemo?: boolean;
    };

    // Decide Demo vs User
    const url = new URL(req.url);
    const useDemo = url.searchParams.get("demo") === "1" || body?.useDemo === true;

    const userEmail = await getEffectiveEmail({
      useDemo,
      fallbackBodyEmail: body?.userEmail, // optional fallback
    });

    if (!userEmail) {
      return NextResponse.json(
        { error: "Not signed in and no demo mode. Add ?demo=1 or sign in." },
        { status: 401 }
      );
    }

    // Required fields
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

    // Parse scheduledAt
    const when = new Date(body.scheduledAt as any);
    if (isNaN(when.getTime())) {
      return NextResponse.json({ error: "scheduledAt invalid" }, { status: 400 });
    }

    // Normalize & validate platforms (UPPERCASE)
    const platforms = body.platforms.map((p) => String(p).toUpperCase()) as PlatformEnum[];
    for (const p of platforms) {
      if (!PLATFORM_ENUM.includes(p)) {
        return NextResponse.json(
          { error: `Unsupported platform "${p}". Allowed: ${PLATFORM_ENUM.join(", ")}` },
          { status: 400 }
        );
      }
    }

    // Media parsing (for IMAGE kind)
    let imageUrl =
      body.media?.imageUrl?.trim() ??
      body.imageUrl?.trim() ??
      body.mediaUrl?.trim() ??
      "";

    if (body.kind === "IMAGE") {
      if (!imageUrl) {
        return NextResponse.json({ error: "media.imageUrl required for IMAGE" }, { status: 400 });
      }
      imageUrl = imageUrl.replace(/[)\s]+$/g, ""); // strip stray chars
      if (!/^https:\/\/.+/i.test(imageUrl) || !/\.(jpe?g|png|webp)(\?.*)?$/i.test(imageUrl)) {
        return NextResponse.json(
          { error: "Provide a valid https image URL (jpg/png/webp)" },
          { status: 400 }
        );
      }
    } else {
      imageUrl = imageUrl || "";
    }

    // Default status SCHEDULED so cron can pick it up (or QUEUED if you prefer)
    const status = body.status ?? "SCHEDULED";

    const post = await PlannedPost.create({
      userEmail,
      platforms, // UPPERCASE
      status,
      kind: body.kind,
      caption: body.caption,
      media: imageUrl ? { imageUrl } : body.media ?? null,
      scheduledAt: when,
    });

    return NextResponse.json({ ok: true, post }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to create planned post" },
      { status: 500 }
    );
  }
}

// GET /api/planned-posts?email=... OR /api/planned-posts?demo=1
// If no email query, we resolve Demo vs User automatically via session.
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const url = new URL(req.url);
    const queryEmail = url.searchParams.get("email") || "";
    const useDemo = url.searchParams.get("demo") === "1";

    const userEmail =
      queryEmail ||
      (await getEffectiveEmail({
        useDemo,
      }));

    if (!userEmail) {
      return NextResponse.json(
        { error: "Missing email and not authenticated (add ?demo=1 or sign in)" },
        { status: 401 }
      );
    }

    const posts = await PlannedPost.find({ userEmail }).sort({ createdAt: -1 }).lean().exec();
    return NextResponse.json({ ok: true, posts });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to list planned posts" },
      { status: 500 }
    );
  }
}
