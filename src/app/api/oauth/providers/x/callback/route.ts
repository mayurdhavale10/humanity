export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongo";
import SocialProvider from "@/models/SocialProvider";

function getRedirectUri() {
  return (
    process.env.X_REDIRECT_URI ??
    (process.env.NEXT_PUBLIC_BASE_URL
      ? `${process.env.NEXT_PUBLIC_BASE_URL.replace(/\/+$/, "")}/api/oauth/providers/x/callback`
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
      typeof body === "object" && (body?.error_description || body?.error || body?.message)
        ? body.error_description || body.error || body.message
        : `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return body;
}

export async function GET(req: NextRequest) {
  try {
    const clientId = process.env.X_CLIENT_ID!;
    const clientSecret = process.env.X_CLIENT_SECRET!;
    const redirectUri = getRedirectUri();
    const userEmail = process.env.DEMO_USER_EMAIL || "demo@local.dev";

    if (!clientId || !clientSecret || !redirectUri) {
      return NextResponse.json(
        { error: "Missing X_CLIENT_ID / X_CLIENT_SECRET / X_REDIRECT_URI" },
        { status: 500 }
      );
    }

    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const error = url.searchParams.get("error");
    if (error) return NextResponse.json({ ok: false, error }, { status: 400 });
    if (!code) return NextResponse.json({ ok: false, error: "Missing code" }, { status: 400 });

    // 1) Exchange code for tokens
    const tokenResp = await fetchJson("https://api.twitter.com/2/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      // Using client_secret POST (Basic also works)
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
        code_verifier: "plain-nopkce", // must match the "challenge" if using plain
      }).toString(),
    });

    const accessToken = tokenResp?.access_token as string | undefined;
    const refreshToken = tokenResp?.refresh_token as string | undefined;
    const expiresIn = Number(tokenResp?.expires_in || 0);
    if (!accessToken) throw new Error("No access_token from X");

    // 2) Who am I?
    const me = await fetchJson("https://api.twitter.com/2/users/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const actorId = me?.data?.id as string | undefined;
    const username = me?.data?.username as string | undefined;

    await dbConnect();
    await SocialProvider.findOneAndUpdate(
      { userEmail, platform: "X" },
      {
        $set: {
          userEmail,
          platform: "X",
          accessToken,
          refreshToken: refreshToken || undefined,
          expiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000) : undefined,
          accountRef: "x",
          meta: { actorId, username, connectedAt: new Date(), token_type: "bearer" },
        },
      },
      { upsert: true, new: true }
    ).lean();

    const html = `
      <html><body style="font-family:system-ui;padding:24px">
        <h2>X (Twitter) connected ✅</h2>
        <p><b>User:</b> ${username || actorId || "me"}</p>
        <p>You can close this window and return to the app.</p>
      </body></html>`;
    return new NextResponse(html, { headers: { "Content-Type": "text/html" } });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
