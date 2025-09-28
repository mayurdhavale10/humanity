export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongo";
import SocialProvider from "@/models/SocialProvider";

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/+$/, "") ||
  "http://localhost:3000";
const X_CLIENT_ID = process.env.X_CLIENT_ID || "";
const DEMO_EMAIL = process.env.DEMO_USER_EMAIL || "demo@local.dev";

async function formPost(url: string, data: Record<string, string>) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    // IMPORTANT: for PKCE public client, NO Authorization header
    body: new URLSearchParams(data).toString(),
  });
  const raw = await res.text();
  let body: any = raw;
  try {
    body = JSON.parse(raw);
  } catch {}
  if (!res.ok) {
    throw new Error(
      body?.error_description || body?.error || `HTTP ${res.status}`
    );
  }
  return body;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code) {
    return NextResponse.json({ error: "missing code" }, { status: 400 });
  }
  const cookieState = req.cookies.get("x_oauth_state")?.value || "";
  const code_verifier = req.cookies.get("x_oauth_code_verifier")?.value || "";

  if (!cookieState || state !== cookieState) {
    return NextResponse.json({ error: "state mismatch" }, { status: 400 });
  }
  if (!code_verifier) {
    return NextResponse.json(
      { error: "missing code_verifier" },
      { status: 400 }
    );
  }
  if (!X_CLIENT_ID) {
    return NextResponse.json(
      { error: "X_CLIENT_ID missing" },
      { status: 500 }
    );
  }

  const redirect_uri = `${BASE_URL}/api/oauth/providers/x/callback`;

  // Exchange code → tokens (NO Authorization header for PKCE public client)
  let token: {
    token_type: string;
    expires_in: number;
    access_token: string;
    scope?: string;
    refresh_token?: string;
  };
  try {
    token = await formPost("https://api.twitter.com/2/oauth2/token", {
      grant_type: "authorization_code",
      client_id: X_CLIENT_ID,
      redirect_uri,
      code,
      code_verifier,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "token exchange failed", detail: String(e?.message || e) },
      { status: 400 }
    );
  }

  // Who am I (to prove users.read scope & get ID/username)
  const meRes = await fetch("https://api.twitter.com/2/users/me", {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  const meRaw = await meRes.text();
  let me: any = meRaw;
  try {
    me = JSON.parse(meRaw);
  } catch {}
  if (!meRes.ok) {
    return NextResponse.json(
      { error: "users.me failed", detail: me },
      { status: 400 }
    );
  }

  await dbConnect();
  await SocialProvider.findOneAndUpdate(
    { userEmail: DEMO_EMAIL, platform: "X" },
    {
      userEmail: DEMO_EMAIL,
      platform: "X",
      accessToken: token.access_token,
      refreshToken: token.refresh_token || null,
      accountRef: me?.data?.id || "x",
      expiresAt: new Date(Date.now() + token.expires_in * 1000),
      meta: {
        token_type: token.token_type,
        scope: token.scope,
        username: me?.data?.username,
        connectedAt: new Date().toISOString(),
      },
    },
    { upsert: true, new: true }
  );

  // Clean cookies & bounce somewhere nice
  const res = NextResponse.redirect(`${BASE_URL}/composer`);
  res.cookies.delete("x_oauth_state");
  res.cookies.delete("x_oauth_code_verifier");
  return res;
}
