// src/app/api/oauth/[platform]/connect/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { dbConnect } from "@/lib/mongo";
import SocialProvider from "@/models/SocialProvider";

type ProviderCfg = {
  clientId: string;
  clientSecret?: string;
  authUrl: string;
  tokenUrl: string;
  scopes: string[];
  redirectUri: string;
  pkce?: boolean;
  clientAuth?: "basic" | "body";
};

async function getProviderConfig(platform: string) {
  try {
    const mod = await import(`../../_providers/${platform}.ts`);
    return mod.default as ProviderCfg;
  } catch {
    return null;
  }
}

function base64url(buf: Buffer) {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}
function sha256(s: string) {
  return crypto.createHash("sha256").update(s).digest();
}

async function exchangeCode(opts: {
  tokenUrl: string;
  clientId: string;
  clientSecret?: string;
  code: string;
  redirectUri: string;
  codeVerifier?: string;
  clientAuth?: "basic" | "body";
}) {
  const { tokenUrl, clientId, clientSecret, code, redirectUri, codeVerifier, clientAuth } = opts;

  const form = new URLSearchParams();
  form.set("grant_type", "authorization_code");
  form.set("code", code);
  form.set("redirect_uri", redirectUri);
  form.set("client_id", clientId);
  if (codeVerifier) form.set("code_verifier", codeVerifier);

  const headers: Record<string, string> = { "Content-Type": "application/x-www-form-urlencoded" };

  if (clientSecret) {
    if (clientAuth === "basic") {
      const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
      headers.Authorization = `Basic ${basic}`;
    } else {
      form.set("client_secret", clientSecret);
    }
  }

  const res = await fetch(tokenUrl, { method: "POST", headers, body: form.toString() });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed: ${res.status} ${text}`);
  }
  return res.json();
}

// ✅ NAMED EXPORT ONLY
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ platform: string }> }
) {
  const { platform } = await ctx.params;
  const provider = await getProviderConfig(platform);
  if (!provider) return NextResponse.json({ error: "Unknown provider" }, { status: 400 });

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  const cookieStore = await cookies();
  const secure = process.env.NODE_ENV === "production";

  if (error) return NextResponse.json({ error, provider: platform }, { status: 400 });

  // 1) Start OAuth
  if (!code) {
    const auth = new URL(provider.authUrl);
    auth.searchParams.set("response_type", "code");
    auth.searchParams.set("client_id", provider.clientId);
    auth.searchParams.set("redirect_uri", provider.redirectUri);
    auth.searchParams.set("scope", provider.scopes.join(","));
    const stateVal = crypto.randomUUID();
    auth.searchParams.set("state", stateVal);

    // 🔁 Force Facebook to re-prompt for any newly added scopes
    auth.searchParams.set("auth_type", "rerequest");
    auth.searchParams.set("auth_type", "reauthorize"); // forces account chooser



    cookieStore.set(`oauth_state_${platform}`, stateVal, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: 600,
    });

    if (provider.pkce) {
      const codeVerifier = base64url(crypto.randomBytes(32));
      const challenge = base64url(sha256(codeVerifier));
      auth.searchParams.set("code_challenge", challenge);
      auth.searchParams.set("code_challenge_method", "S256");
      cookieStore.set(`pkce_${platform}`, codeVerifier, {
        httpOnly: true,
        secure,
        sameSite: "lax",
        path: "/",
        maxAge: 600,
      });
    }

    return NextResponse.redirect(auth.toString());
  }

  // 2) Callback → exchange tokens
  const expectedState = cookieStore.get(`oauth_state_${platform}`)?.value;
  if (!expectedState || expectedState !== state) {
    return NextResponse.json({ error: "Invalid state" }, { status: 400 });
  }
  const codeVerifier = cookieStore.get(`pkce_${platform}`)?.value || undefined;

  try {
    const token = await exchangeCode({
      tokenUrl: provider.tokenUrl,
      clientId: provider.clientId,
      clientSecret: provider.clientSecret,
      code,
      redirectUri: provider.redirectUri,
      codeVerifier,
      clientAuth: provider.clientAuth,
    });

    // TEMP: hardcode identity during dev
    const userEmail = "demo@local.dev";
    const conn = await dbConnect();
    if (!conn) {
      return NextResponse.json({ error: "DB not configured" }, { status: 500 });
    }

    const expiresAt = token.expires_in ? new Date(Date.now() + token.expires_in * 1000) : undefined;

    // Instagram identity (basic display style). For Graph posting, use the 3-hop resolve.
    let accountRef = platform;
    let meta: any = { token_type: token.token_type };

    if (platform.toLowerCase() === "instagram") {
      try {
        const meRes = await fetch(
          `https://graph.facebook.com/v19.0/me?fields=id,username&access_token=${token.access_token}`
        );
        const meData = await meRes.json();
        if (meData?.username) {
          accountRef = meData.username;
          meta.id = meData.id;
        }
      } catch (err) {
        console.error("Failed to fetch Instagram user info:", err);
      }
    }

    const saved = await SocialProvider.findOneAndUpdate(
      { userEmail, platform: platform.toUpperCase() },
      {
        accessToken: token.access_token,
        refreshToken: token.refresh_token,
        accountRef,
        expiresAt,
        meta,
      },
      { new: true, upsert: true }
    );

    // clear cookies
    cookieStore.set(`oauth_state_${platform}`, "", { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 0 });
    cookieStore.set(`pkce_${platform}`, "", { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 0 });

    return NextResponse.json({ ok: true, platform, provider: saved });
  } catch (err: unknown) {
    return NextResponse.json({ error: String((err as Error)?.message || err) }, { status: 500 });
  }
}
