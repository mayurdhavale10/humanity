export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongo";
import SocialProvider from "@/models/SocialProvider";

function getRedirectUri() {
  return (
    process.env.LINKEDIN_REDIRECT_URI ??
    (process.env.NEXT_PUBLIC_BASE_URL
      ? `${process.env.NEXT_PUBLIC_BASE_URL.replace(/\/+$/, "")}/api/oauth/providers/linkedin/callback`
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
      typeof body === "object" && (body?.error_description || body?.message)
        ? body.error_description || body.message
        : `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return body;
}

export async function GET(req: NextRequest) {
  try {
    const clientId = process.env.LINKEDIN_CLIENT_ID!;
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET!;
    const redirectUri = getRedirectUri();
    const userEmail = process.env.DEMO_USER_EMAIL || "demo@local.dev"; // TODO: replace with session email

    if (!clientId || !clientSecret || !redirectUri) {
      return NextResponse.json(
        { error: "Missing LINKEDIN_CLIENT_ID / LINKEDIN_CLIENT_SECRET / redirect URI" },
        { status: 500 }
      );
    }

    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const error = url.searchParams.get("error");
    // const state = url.searchParams.get("state"); // could validate if you persist state

    if (error) return NextResponse.json({ ok: false, error }, { status: 400 });
    if (!code) return NextResponse.json({ ok: false, error: "Missing code" }, { status: 400 });

    // 1) Exchange code -> access token
    const tokenRes = await fetchJson(
      "https://www.linkedin.com/oauth/v2/accessToken",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code: code,
          redirect_uri: redirectUri,
          client_id: clientId,
          client_secret: clientSecret,
        }).toString(),
      }
    );

    const accessToken = tokenRes?.access_token as string | undefined;
    const expiresInSec = tokenRes?.expires_in as number | undefined;
    if (!accessToken) throw new Error("No access_token from LinkedIn.");

    const expiresAt =
      typeof expiresInSec === "number"
        ? new Date(Date.now() + expiresInSec * 1000)
        : undefined;

    // 2) Fetch profile to get actor URN (urn:li:person:{id})
    const me = await fetchJson("https://api.linkedin.com/v2/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const personId = me?.id as string | undefined;
    if (!personId) throw new Error("Unable to read LinkedIn profile id.");

    const actorUrn = `urn:li:person:${personId}`;

    // 3) Save provider (do NOT expose token in client responses)
    await dbConnect();
    await SocialProvider.findOneAndUpdate(
      { userEmail, platform: "LINKEDIN" },
      {
        $set: {
          userEmail,
          platform: "LINKEDIN",
          accessToken,
          expiresAt: expiresAt ?? undefined,
          meta: {
            actorUrn,
            token_type: "Bearer",
            connectedAt: new Date(),
          },
        },
      },
      { upsert: true, new: true }
    ).lean();

    const html = `
      <html><body style="font-family:system-ui;padding:24px">
        <h2>LinkedIn connected ✅</h2>
        <p><b>Actor:</b> ${actorUrn}</p>
        <p>Token saved for ${userEmail}. You can close this window and return to the app.</p>
      </body></html>`;
    return new NextResponse(html, { headers: { "Content-Type": "text/html" } });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
