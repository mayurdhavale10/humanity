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

function toAbsolute(u: string) {
  if (/^https?:\/\//i.test(u)) return u;
  return `${BASE_URL}${u.startsWith("/") ? "" : "/"}${u}`;
}

export async function OPTIONS() {
  return NextResponse.json({ ok: true });
}

/**
 * POST /api/demo/launch
 * Body: { platform: "INSTAGRAM"|"LINKEDIN"|"X", imageUrl: string, caption?: string }
 * 1) creates a PlannedPost (queued, scheduled for now)
 * 2) immediately triggers run-now on that new post (server-to-server with secret)
 */
export async function POST(req: NextRequest) {
  try {
    if (!CRON_SECRET) {
      return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const platform = String(body?.platform || "INSTAGRAM").toUpperCase() as Platform;

    const rawUrl = String(body?.imageUrl || "").trim();
    const imageUrl = toAbsolute(rawUrl); // <-- normalize to absolute
    const caption = String(body?.caption || "");

    if (!imageUrl || !/^https?:\/\/.+/i.test(imageUrl)) {
      return NextResponse.json({ error: "Valid imageUrl is required" }, { status: 400 });
    }
    if (!["INSTAGRAM", "LINKEDIN", "X"].includes(platform)) {
      return NextResponse.json({ error: "Unsupported platform" }, { status: 400 });
    }

    await dbConnect();

    // 1) create planned post scheduled for "now"
    const post = await PlannedPost.create({
      userEmail: DEMO_EMAIL,
      platforms: [platform],          // keep UPPERCASE to match enum
      status: "QUEUED",
      kind: "IMAGE",
      caption,
      media: { imageUrl },            // <-- store the absolute URL
      scheduledAt: new Date(Date.now() - 1000), // due immediately
    });

    // 2) trigger run-now internally (server→server; secret not exposed to browser)
    const runUrl = `${BASE_URL}/api/planned-posts/${post._id}/run-now?secret=${encodeURIComponent(
      CRON_SECRET
    )}`;

    const res = await fetch(runUrl, { method: "POST" });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return NextResponse.json(
        { ok: false, postId: String(post._id), error: data?.error || `HTTP ${res.status}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      postId: String(post._id),
      publishId: data?.publishId,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
