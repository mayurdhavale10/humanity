// src/app/api/oauth/providers/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongo";
import SocialProvider from "@/models/SocialProvider";

/**
 * Returns all social providers connected by the current user.
 * Currently still using demo@local.dev until real auth is wired.
 */
export async function GET() {
  try {
    await dbConnect();

    // Guard: skip if DB connection not established
    const g = global as unknown as { _mongooseCache?: { conn?: unknown } };
    if (!g._mongooseCache?.conn) {
      return NextResponse.json([]);
    }

    // TODO: Replace with session / auth context once you have it
    const userEmail = process.env.DEMO_USER_EMAIL || "demo@local.dev";

    const providers = await SocialProvider.find({ userEmail }).lean();

    // Sanitize: never return raw access tokens or refresh tokens
    const safeProviders = (providers ?? []).map((p: any) => ({
      platform: p.platform,
      accountRef: p.accountRef,
      expiresAt: p.expiresAt,
      meta: p.meta,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));

    return NextResponse.json(safeProviders);
  } catch (err) {
    console.error("GET /api/oauth/providers error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
