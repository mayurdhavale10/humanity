// src/app/api/instagram/whoami/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongo";
import SocialProvider from "@/models/SocialProvider";

const GRAPH_V = "v19.0";
const DEMO_EMAIL = process.env.DEMO_USER_EMAIL || "demo@local.dev";

// Minimal shape of what we read from Mongo
type SocialProviderLean = {
  userEmail: string;
  platform: string;
  accessToken?: string;
  accountRef?: string;
  meta?: Record<string, any>;
};

async function j(url: string) {
  const r = await fetch(url);
  const b = await r.json().catch(() => null);
  return { ok: r.ok, status: r.status, body: b };
}

export async function GET() {
  await dbConnect();

  // ✅ Give TS an explicit type for the lean doc
  const provider = await SocialProvider
    .findOne({ userEmail: DEMO_EMAIL, platform: "INSTAGRAM" })
    .lean<SocialProviderLean>();

  if (!provider?.accessToken) {
    return NextResponse.json({ error: "No IG token saved" }, { status: 400 });
  }

  const token = provider.accessToken as string;

  const me    = await j(`https://graph.facebook.com/${GRAPH_V}/me?fields=id,name&access_token=${encodeURIComponent(token)}`);
  const pages = await j(`https://graph.facebook.com/${GRAPH_V}/me/accounts?fields=id,name&access_token=${encodeURIComponent(token)}`);

  return NextResponse.json({
    ok: true,
    token_for: me.body,   // FB user { id, name } the token belongs to
    pages: pages.body,    // Pages visible to THAT user
  });
}
