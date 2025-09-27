export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";

function getRedirectUri() {
  return (
    process.env.X_REDIRECT_URI ??
    (process.env.NEXT_PUBLIC_BASE_URL
      ? `${process.env.NEXT_PUBLIC_BASE_URL.replace(/\/+$/, "")}/api/oauth/providers/x/callback`
      : undefined)
  );
}

export async function GET(req: NextRequest) {
  const clientId = process.env.X_CLIENT_ID;
  const redirectUri = getRedirectUri();

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: "Missing X_CLIENT_ID or X_REDIRECT_URI / NEXT_PUBLIC_BASE_URL" },
      { status: 500 }
    );
  }

  const scope = [
    "tweet.read",
    "tweet.write",
    "users.read",
    "offline.access",
  ].join(" ");

  const state = Math.random().toString(36).slice(2);
  const authUrl =
    `https://twitter.com/i/oauth2/authorize` +
    `?response_type=code` +
    `&client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${encodeURIComponent(scope)}` +
    `&state=${encodeURIComponent(state)}` +
    `&code_challenge=plain-nopkce` +         // simple (no PKCE); OK for server-side demo
    `&code_challenge_method=plain`;

  if (new URL(req.url).searchParams.get("debug") === "1") {
    return NextResponse.json({ authUrl, redirectUri, scope });
  }

  return NextResponse.redirect(authUrl);
}
