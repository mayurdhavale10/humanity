// src/app/api/oauth/providers/instagram/callback/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongo";
import SocialProvider from "@/models/SocialProvider";

const GRAPH_V = "v19.0";

function getRedirectUri() {
  return (
    process.env.IG_REDIRECT_URI ??
    (process.env.NEXT_PUBLIC_BASE_URL
      ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/oauth/providers/instagram/callback`
      : undefined)
  );
}

async function fetchJson(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  const raw = await res.text();
  let body: any;
  try { body = JSON.parse(raw); } catch { body = raw; }
  if (!res.ok) {
    const msg =
      typeof body === "object" && (body?.error?.message || body?.message)
        ? body.error?.message || body.message
        : `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return body;
}

export async function GET(req: NextRequest) {
  try {
    const appId = process.env.IG_APP_ID!;
    const appSecret = process.env.IG_APP_SECRET!;
    const redirectUri = getRedirectUri();
    const userEmail = process.env.DEMO_USER_EMAIL || "demo@local.dev"; // TODO: replace with session email

    if (!appId || !appSecret || !redirectUri) {
      return NextResponse.json(
        { error: "Missing IG_APP_ID / IG_APP_SECRET / IG_REDIRECT_URI" },
        { status: 500 }
      );
    }

    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const error = url.searchParams.get("error");

    if (error) {
      return NextResponse.json({ ok: false, error }, { status: 400 });
    }
    if (!code) {
      return NextResponse.json({ ok: false, error: "Missing code" }, { status: 400 });
    }

    // 1) Exchange code -> short-lived user token
    const tokenResp = await fetchJson(
      `https://graph.facebook.com/${GRAPH_V}/oauth/access_token` +
        `?client_id=${encodeURIComponent(appId)}` +
        `&client_secret=${encodeURIComponent(appSecret)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&code=${encodeURIComponent(code)}`
    );
    const shortToken = tokenResp?.access_token as string | undefined;
    if (!shortToken) throw new Error("No access_token returned (code exchange).");

    // 2) Upgrade to long-lived user token (recommended)
    const longResp = await fetchJson(
      `https://graph.facebook.com/${GRAPH_V}/oauth/access_token` +
        `?grant_type=fb_exchange_token` +
        `&client_id=${encodeURIComponent(appId)}` +
        `&client_secret=${encodeURIComponent(appSecret)}` +
        `&fb_exchange_token=${encodeURIComponent(shortToken)}`
    );
    const userToken = (longResp?.access_token as string) || shortToken;

    // 3) Resolve Page(s) → pick first that has instagram_business_account
    const pages = await fetchJson(
      `https://graph.facebook.com/${GRAPH_V}/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${encodeURIComponent(
        userToken
      )}`
    );

    const list: Array<{
      id: string;
      name: string;
      access_token: string;
      instagram_business_account?: { id: string };
    }> = Array.isArray(pages?.data) ? pages.data : [];

    // Pick the first page with an IG business account
    const chosen = list.find((p) => p.instagram_business_account?.id);
    if (!chosen) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "No Facebook Page with an Instagram Business account linked. Link IG to a Page and try again.",
        },
        { status: 400 }
      );
    }

    const pageId = chosen.id;
    const pageAccessToken = chosen.access_token;
    const instagramBusinessId = chosen.instagram_business_account!.id;

    // 4) Persist in SocialProvider (store user token; you can also store page token & ig id)
    await dbConnect();

    const doc = await SocialProvider.findOneAndUpdate(
      { userEmail, platform: "INSTAGRAM" },
      {
        $set: {
          userEmail,
          platform: "INSTAGRAM",
          accessToken: userToken, // long-lived user token
          pageId,
          instagramBusinessId,
          meta: {
            pageName: chosen.name,
            connectedAt: new Date(),
          },
        },
      },
      { upsert: true, new: true }
    ).lean();

    // 5) Simple human-friendly finish (you can redirect to /dashboard with a toast)
    const html = `
      <html>
        <body style="font-family:system-ui;padding:24px">
          <h2>Instagram connected ✅</h2>
          <p><b>Page:</b> ${chosen.name} (${pageId})</p>
          <p><b>IG Business ID:</b> ${instagramBusinessId}</p>
          <p>You can close this window and schedule your posts.</p>
        </body>
      </html>`;
    return new NextResponse(html, { headers: { "Content-Type": "text/html" } });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
