// src/app/api/instagram/context/route.ts
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongo";
import SocialProvider from "@/models/SocialProvider";

const GRAPH_V = "v19.0";
const DEMO_EMAIL = process.env.DEMO_USER_EMAIL || "demo@local.dev";

type ProviderDoc = {
  platform: string;
  userEmail: string;
  accessToken: string;
  accountRef?: string;
  meta?: Record<string, any>;
  expiresAt?: Date;
};

async function j(url: string) {
  const r = await fetch(url);
  let body: any = null;
  try { body = await r.json(); } catch {}
  return { ok: r.ok, status: r.status, body };
}

export async function GET() {
  await dbConnect();

  // Ensure we get a single, properly-typed doc
  const provRaw = await SocialProvider
    .findOne({ userEmail: DEMO_EMAIL, platform: "INSTAGRAM" })
    .select("platform userEmail accessToken accountRef meta expiresAt")
    .lean();

  const prov = provRaw as unknown as ProviderDoc | null;

  if (!prov?.accessToken) {
    return NextResponse.json({ error: "No IG token saved" }, { status: 400 });
  }

  const userToken = prov.accessToken;

  const me = await j(
    `https://graph.facebook.com/${GRAPH_V}/me?fields=id,name&access_token=${encodeURIComponent(userToken)}`
  );

  const accounts = await j(
    `https://graph.facebook.com/${GRAPH_V}/me/accounts?fields=id,name,access_token&access_token=${encodeURIComponent(userToken)}`
  );

  let chosen: { id: string; name: string; access_token: string } | null = null;
  if (Array.isArray(accounts.body?.data) && accounts.body.data.length) {
    // pick the first page (you can add selection later)
    chosen = accounts.body.data[0];
  }

  let ig: any = null;
  if (chosen?.id && chosen?.access_token) {
    ig = await j(
      `https://graph.facebook.com/${GRAPH_V}/${chosen.id}?fields=instagram_business_account&access_token=${encodeURIComponent(chosen.access_token)}`
    );
  }

  return NextResponse.json({
    ok: true,
    token_for: me.body,             // { id, name } of the FB user on the token
    pages: accounts.body,           // result of /me/accounts
    picked_page: chosen ? { id: chosen.id, name: chosen.name } : null,
    ig_business: ig?.body ?? null,  // should include { instagram_business_account: { id } }
  });
}
