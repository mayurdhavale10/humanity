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

async function postForm(url: string, params: Record<string, string>) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params).toString(),
  });
  const raw = await res.text();
  let body: any; try { body = JSON.parse(raw); } catch { body = raw; }
  if (!res.ok) {
    const msg = typeof body === "object" && (body?.error_description || body?.message)
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
    const userEmail = process.env.DEMO_USER_EMAIL || "demo@local.dev"; // swap to session later

    if (!clientId || !clientSecret || !redirectUri) {
      return NextResponse.json(
        { error: "Missing LINKEDIN_CLIENT_ID / LINKEDIN_CLIENT_SECRET / LINKEDIN_REDIRECT_URI" },
        { status: 500 }
      );
    }

    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const err = url.searchParams.get("error");
    if (err) return NextResponse.json({ ok: false, error: err }, { status: 400 });
    if (!code) return NextResponse.json({ ok: false, error: "Missing code" }, { status: 400 });

    // 1) Exchange code for token
    const token = await postForm("https://www.linkedin.com/oauth/v2/accessToken", {
      grant_type: "authorization_code",
      code: code!,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    });

    const accessToken = token.access_token as string;
    const expiresIn = Number(token.expires_in || 0);
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    // 2) Fetch profile to build actor URN
    const meRes = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const meRaw = await meRes.text();
    const me = (() => { try { return JSON.parse(meRaw); } catch { return {}; } })();
    if (!meRes.ok) throw new Error(typeof me === "object" && me?.message ? me.message : "Failed to fetch userinfo");

    // userinfo sub is the member ID for building URN
    const actorUrn = me?.sub ? `urn:li:person:${me.sub}` : undefined;

    await dbConnect();
    await SocialProvider.findOneAndUpdate(
      { userEmail, platform: "LINKEDIN" },
      {
        $set: {
          userEmail,
          platform: "LINKEDIN",
          accessToken,
          expiresAt,
          meta: { actorUrn, token_type: "Bearer", connectedAt: new Date() },
        },
      },
      { new: true, upsert: true }
    ).lean();

    const html =
      `<html><body style="font-family:system-ui;padding:24px">
        <h2>LinkedIn connected ✅</h2>
        <p><b>Actor URN:</b> ${actorUrn || "(unknown)"}</p>
        <p>You can close this window and return to the app.</p>
      </body></html>`;
    return new NextResponse(html, { headers: { "Content-Type": "text/html" } });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
