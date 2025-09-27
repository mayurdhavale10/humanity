export const runtime = "nodejs";

import { NextResponse } from "next/server";

function getRedirectUri() {
  return (
    process.env.LINKEDIN_REDIRECT_URI ??
    (process.env.NEXT_PUBLIC_BASE_URL
      ? `${process.env.NEXT_PUBLIC_BASE_URL.replace(/\/+$/, "")}/api/oauth/providers/linkedin/callback`
      : undefined)
  );
}

export async function GET() {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const redirectUri = getRedirectUri();

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: "Missing LINKEDIN_CLIENT_ID or redirect URI (set LINKEDIN_REDIRECT_URI or NEXT_PUBLIC_BASE_URL)" },
      { status: 500 }
    );
  }

  // Minimal scopes for personal posting: r_liteprofile w_member_social
  const scope = encodeURIComponent("r_liteprofile w_member_social");
  const state = Math.random().toString(36).slice(2);

  const url =
    `https://www.linkedin.com/oauth/v2/authorization` +
    `?response_type=code` +
    `&client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${scope}` +
    `&state=${encodeURIComponent(state)}`;

  return NextResponse.redirect(url);
}
