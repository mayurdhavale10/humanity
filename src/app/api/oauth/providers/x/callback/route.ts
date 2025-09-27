export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import SocialProvider from "@/models/SocialProvider";
import { dbConnect } from "@/lib/mongo";

const CLIENT_ID = process.env.X_CLIENT_ID!;
const CLIENT_SECRET = process.env.X_CLIENT_SECRET!;
const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/+$/, "") || "http://localhost:3000";
const REDIRECT_URI = `${BASE_URL}/api/oauth/providers/x/callback`;

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code) return NextResponse.json({ error:"missing code" }, { status:400 });

  const code_verifier = req.cookies.get("x_code_verifier")?.value;
  if (!code_verifier) return NextResponse.json({ error:"missing code_verifier" }, { status:400 });

  // Exchange code → tokens (user-context)
  const tokenRes = await fetch("https://api.twitter.com/2/oauth2/token", {
    method:"POST",
    headers:{ "Content-Type":"application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      code,
      code_verifier,
    }),
  });

  const raw = await tokenRes.text();
  let json: any; try { json = JSON.parse(raw); } catch { json = raw; }
  if (!tokenRes.ok) {
    return NextResponse.json({ error: "token exchange failed", detail: json }, { status: 500 });
  }

  const accessToken = json.access_token as string;      // REQUIRED for posting
  const refreshToken = json.refresh_token as string|undefined;
  const scope = json.scope as string|undefined;
  const tokenType = json.token_type as string|undefined;
  const expiresIn = json.expires_in as number|undefined;

  // Optionally verify which user this is:
  const meRes = await fetch("https://api.twitter.com/2/users/me", {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const me = await meRes.json().catch(()=>null);

  await dbConnect();
  await SocialProvider.findOneAndUpdate(
    { userEmail: "demo@local.dev", platform: "X" },
    {
      $set: {
        platform: "X",
        userEmail: "demo@local.dev",
        accessToken,
        refreshToken: refreshToken || null,
        expiresAt: expiresIn ? new Date(Date.now() + expiresIn*1000) : null,
        accountRef: me?.data?.username || "x",
        meta: {
          token_type: tokenType,
          scope,
          user_id: me?.data?.id,
          connectedAt: new Date().toISOString(),
        },
      },
    },
    { upsert: true, new: true }
  );

  const res = NextResponse.redirect(`${BASE_URL}/composer`);
  res.cookies.delete("x_code_verifier");
  return res;
}
