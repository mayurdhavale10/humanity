// src/app/api/oauth/providers/x/start/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";

const CLIENT_ID = process.env.X_CLIENT_ID!;
const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/+$/, "") || "http://localhost:3000";
const REDIRECT_URI = `${BASE_URL}/api/oauth/providers/x/callback`;
const SCOPE = ["tweet.write", "tweet.read", "users.read", "offline.access"].join(" ");

// base64url from ArrayBuffer
function base64url(ab: ArrayBuffer) {
  return Buffer.from(new Uint8Array(ab))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export async function GET() {
  // 1) Generate code_verifier (43–128 chars URL-safe)
  const verifierBytes = crypto.getRandomValues(new Uint8Array(32));
  const code_verifier = base64url(verifierBytes.buffer);

  // 2) code_challenge = BASE64URL(SHA256(code_verifier))
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(code_verifier) // pass ArrayBuffer of the string
  );
  const code_challenge = base64url(digest);

  // 3) Build authorize URL (PKCE S256)
  const authUrl = new URL("https://twitter.com/i/oauth2/authorize");
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", CLIENT_ID);
  authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
  authUrl.searchParams.set("scope", SCOPE);
  authUrl.searchParams.set("state", crypto.randomUUID());
  authUrl.searchParams.set("code_challenge", code_challenge);
  authUrl.searchParams.set("code_challenge_method", "S256");

  // 4) Store verifier in a short-lived, httpOnly cookie
  const res = NextResponse.redirect(authUrl.toString(), 302);
  res.cookies.set("x_code_verifier", code_verifier, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600, // 10 minutes
    path: "/",
  });
  return res;
}
