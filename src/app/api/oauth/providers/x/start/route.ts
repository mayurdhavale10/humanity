export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/+$/, "") ||
  "http://localhost:3000";
const X_CLIENT_ID = process.env.X_CLIENT_ID || "";

function b64url(buf: ArrayBuffer) {
  return Buffer.from(new Uint8Array(buf))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

async function sha256(input: string) {
  // TextEncoder().encode returns Uint8Array; pass its .buffer to digest
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data.buffer);
  return new Uint8Array(hash);
}

function makeRandom(len = 43) {
  const alphabet =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~";
  let out = "";
  for (let i = 0; i < len; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

export async function GET() {
  if (!X_CLIENT_ID) {
    return NextResponse.json(
      { error: "X_CLIENT_ID missing" },
      { status: 500 }
    );
  }

  // Build PKCE pieces
  const state = makeRandom(32);
  const code_verifier = makeRandom(64);
  const hash = await sha256(code_verifier);
  const code_challenge = b64url(hash.buffer);

  const redirect_uri = `${BASE_URL}/api/oauth/providers/x/callback`;
  const scope = [
    "tweet.read",
    "tweet.write",
    "users.read",
    "offline.access",
  ].join(" ");

  const authUrl = new URL("https://twitter.com/i/oauth2/authorize");
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", X_CLIENT_ID);
  authUrl.searchParams.set("redirect_uri", redirect_uri);
  authUrl.searchParams.set("scope", scope);
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("code_challenge", code_challenge);
  authUrl.searchParams.set("code_challenge_method", "S256");

  // Set short-lived, httpOnly cookies to read back in callback
  const res = NextResponse.redirect(authUrl.toString(), { status: 302 });
  res.cookies.set("x_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60,
  });
  res.cookies.set("x_oauth_code_verifier", code_verifier, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60,
  });
  return res;
}
