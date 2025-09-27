// src/app/api/linkedin/publish/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongo";
import SocialProvider from "@/models/SocialProvider";
import { publishToLinkedIn } from "@/lib/publishers/linkedin";

type ProviderDoc = {
  accessToken?: string;
  meta?: { actorUrn?: string };
} & Record<string, any>;

export async function OPTIONS() {
  return NextResponse.json({ ok: true });
}

/**
 * POST /api/linkedin/publish
 * Body: { userEmail: string, imageUrl: string, caption?: string }
 * Uses saved SocialProvider { platform:"LINKEDIN", accessToken, meta.actorUrn }
 */
export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const body = await req.json().catch(() => ({}));
    const userEmail = String(body?.userEmail || "").trim();
    const imageUrl = String(body?.imageUrl || "").trim();
    const caption = String(body?.caption || "");

    if (!userEmail || !imageUrl) {
      return NextResponse.json(
        { error: "userEmail and imageUrl required" },
        { status: 400 }
      );
    }
    if (!/^https?:\/\/.+/i.test(imageUrl)) {
      return NextResponse.json(
        { error: "imageUrl must be an absolute http(s) URL" },
        { status: 400 }
      );
    }

    const li = await SocialProvider.findOne({
      userEmail,
      platform: "LINKEDIN",
    })
      .lean<ProviderDoc>()
      .exec();

    const accessToken = li?.accessToken;
    const actorUrn = li?.meta?.actorUrn;

    if (!accessToken || !actorUrn) {
      return NextResponse.json(
        { error: "LinkedIn not connected for this user (missing token or actorUrn)" },
        { status: 400 }
      );
    }

    // Publish (image optional, but we’re requiring it here)
    const { id } = await publishToLinkedIn({
      accessToken,
      actorUrn,
      caption,
      imageUrl,
    });

    return NextResponse.json({ ok: true, remoteId: id });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || String(e) },
      { status: 500 }
    );
  }
}
