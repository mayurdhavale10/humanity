// src/app/api/oauth/providers/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongo";
import SocialProvider from "@/models/SocialProvider";

export async function GET() {
  // TEMP for dev until NextAuth is wired
  const userEmail = "demo@local.dev";

  try {
    await dbConnect();
    const providers = await SocialProvider.find({ userEmail }).lean();
    return NextResponse.json(providers ?? []);
  } catch (err: any) {
    console.error("GET /api/oauth/providers error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
