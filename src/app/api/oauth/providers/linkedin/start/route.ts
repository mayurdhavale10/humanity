// src/app/api/oauth/providers/linkedin/start/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";

const GRAPH_V = "v19.0";

function getLinkedInRedirect() {
  // This is Facebook’s OAuth for IG; keeping name generic
  return (
    process.env.IG_REDIRECT_URI ??
    (process.env.NEXT_PUBLIC_BASE_URL
      ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/oauth/providers/instagram/callback`
      : undefined)
  );
}

export async function GET(_req: NextRequest) {
  const appId = process.env.IG_APP_ID;
  const redirectUri = getLinkedInRedirect();

  if (!appId || !redirectUri) {
    return NextResponse.json(
      { error: "IG_APP_ID or IG_REDIRECT_URI (or NEXT_PUBLIC_BASE_URL) missing" },
      { status: 500 }
    );
  }

  const scope = [
    "pages_show_list",
    "pages_read_engagement",
    "pages_manage_posts",
    "pages_manage_metadata",
    "instagram_basic",
    "instagram_content_publish",
  ].join(",");

  const url =
    `https://www.facebook.com/${GRAPH_V}/dialog/oauth` +
    `?client_id=${encodeURIComponent(appId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent(scope)}` +
    `&state=${encodeURIComponent(Math.random().toString(36).slice(2))}`;

  return NextResponse.redirect(url);
}
