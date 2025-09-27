// src/app/api/demo/launch/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongo";
import PlannedPost from "@/models/PlannedPost";

const DEMO_EMAIL = process.env.DEMO_USER_EMAIL || "demo@local.dev";
const CRON_SECRET = process.env.CRON_SECRET || "";
const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/+$/, "") || "http://localhost:3000";

type Platform = "INSTAGRAM" | "LINKEDIN" | "X";
const ALLOWED: Platform[] = ["INSTAGRAM", "LINKEDIN", "X"];

function toAbsolute(u: string) {
  if (/^https?:\/\//i.test(u)) return u;
  return `${BASE_URL}${u.startsWith("/") ? "" : "/"}${u}`;
}

export async function OPTIONS() {
  return NextResponse.json({ ok: true });
}

/**
 * POST /api/demo/launch
 * Body: { platforms: Platform[], imageUrl: string, caption?: string }
 * 1) creates ONE PlannedPost (QUEUED, due now) with ALL requested platforms
 * 2) immediately triggers run-now on that new post (server-to-server with secret)
 */
export async function POST(req: NextRequest) {
  try {
    if (!CRON_SECRET) {
      return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const rawPlatforms: unknown = body?.platforms;

    // Accept array only; normalize to UPPERCASE and filter to allowed
    const platforms: Platform[] = Array.isArray(rawPlatforms)
      ? (rawPlatforms
          .map((p) => String(p).toUpperCase())
          .filter((p): p is Platform => ALLOWED.includes(p as Platform)))
      : [];

    const rawUrl = String(body?.imageUrl || "").trim();
    const imageUrl = toAbsolute(rawUrl);
    const caption = String(body?.caption || "");

    if (!platforms.length) {
      return NextResponse.json({ error: "At least one platform required" }, { status: 400 });
    }
    if (!/^https?:\/\/.+/i.test(imageUrl)) {
      return NextResponse.json({ error: "Valid imageUrl is required" }, { status: 400 });
    }

    await dbConnect();

    // Create one post due “now”
    const post = await PlannedPost.create({
      userEmail: DEMO_EMAIL,
      platforms, // keep UPPERCASE to satisfy schema enum
      status: "QUEUED",
      kind: "IMAGE",
      caption,
      media: { imageUrl }, // store normalized absolute URL
      scheduledAt: new Date(Date.now() - 1000), // immediately due
    });

    // Trigger run-now (server→server; secret never exposed to browser)
    const runUrl = `${BASE_URL}/api/planned-posts/${post._id}/run-now?secret=${encodeURIComponent(
      CRON_SECRET
    )}`;
    const res = await fetch(runUrl, { method: "POST" });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return NextResponse.json(
        {
          ok: false,
          postId: String(post._id),
          error: data?.error || `HTTP ${res.status}`,
        },
        { status: 500 }
      );
    }

    // run-now may return { results: [{platform, id}, ...] } or { publishIds: { ... } }
    // Normalize to a simple map if possible
    let publishIds: Record<string, string> | null = null;
    if (data?.results && Array.isArray(data.results)) {
      publishIds = {};
      for (const r of data.results) {
        if (r?.platform && r?.id) publishIds[r.platform.toLowerCase()] = r.id;
      }
    } else if (data?.publishIds && typeof data.publishIds === "object") {
      publishIds = data.publishIds as Record<string, string>;
    }

    return NextResponse.json({
      ok: true,
      postId: String(post._id),
      publishIds,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
