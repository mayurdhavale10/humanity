// src/app/api/linkedin/publish/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongo";
import SocialProvider from "@/models/SocialProvider";
import { publishLinkedIn } from "@/lib/publishers/linkedin";

type ProviderDoc = {
  accessToken?: string;
  actorUrn?: string; // "urn:li:person:xxxx"
} & Record<string, any>;

export async function OPTIONS() {
  return NextResponse.json({ ok: true });
}

/**
 * POST /api/linkedin/publish
 * Body: { userEmail: string, imageUrl: string, caption?: string }
 * Uses saved SocialProvider { platform:"LINKEDIN", accessToken, actorUrn }
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
      return NextResponse.json({ error: "imageUrl must be https URL" }, { status: 400 });
    }

    const li = await SocialProvider.findOne({
      userEmail,
      platform: "LINKEDIN",
    })
      .lean<ProviderDoc>()
      .exec();

    if (!li?.accessToken || !li?.actorUrn) {
      return NextResponse.json(
        { error: "LinkedIn not connected for this user (missing token or actorUrn)" },
        { status: 400 }
      );
    }

    const { remoteId } = await publishLinkedIn({
      accessToken: li.accessToken!,
      actorUrn: li.actorUrn!,
      imageUrl,
      caption,
    });

    return NextResponse.json({ ok: true, remoteId });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || String(e) },
      { status: 500 }
    );
  }
}
