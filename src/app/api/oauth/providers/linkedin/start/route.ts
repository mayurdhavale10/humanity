export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";

function getRedirectUri() {
  return (
    process.env.LINKEDIN_REDIRECT_URI ??
    (process.env.NEXT_PUBLIC_BASE_URL
      ? `${process.env.NEXT_PUBLIC_BASE_URL.replace(/\/+$/, "")}/api/oauth/providers/linkedin/callback`
      : undefined)
  );
}

export async function GET(req: NextRequest) {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const redirectUri = getRedirectUri();
  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: "Missing LINKEDIN_CLIENT_ID or LINKEDIN_REDIRECT_URI / NEXT_PUBLIC_BASE_URL" },
      { status: 500 }
    );
  }

  // Minimum scopes for posting from a member account
  const scope = [
    "w_member_social",   // create posts
    "openid", "profile", "email" // optional but helpful
  ].join(" ");

  const state = Math.random().toString(36).slice(2);
  const authUrl =
    `https://www.linkedin.com/oauth/v2/authorization` +
    `?response_type=code` +
    `&client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${encodeURIComponent(scope)}` +
    `&state=${encodeURIComponent(state)}`;

  // Optional quick debug: /start?debug=1 to see what we’ll use
  if (new URL(req.url).searchParams.get("debug") === "1") {
    return NextResponse.json({ authUrl, redirectUri, scope });
  }

  return NextResponse.redirect(authUrl);
}
