export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongo";
import SocialProvider from "@/models/SocialProvider";

const GRAPH_V = "v19.0";
const DEMO_EMAIL = process.env.DEMO_USER_EMAIL || "demo@local.dev";

type ProviderDoc = {
  platform: string; userEmail: string; accessToken: string;
  accountRef?: string; meta?: Record<string, any>;
};

function jerr(msg: string, status = 400, extra?: any) {
  return NextResponse.json({ error: msg, ...(extra || {}) }, { status });
}

async function fetchJson(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  let body: any = null; try { body = await res.json(); } catch {}
  if (!res.ok) {
    const msg = body?.error?.message || (typeof body === "string" ? body : JSON.stringify(body));
    throw new Error(`${res.status} ${res.statusText}: ${msg}`);
  }
  return body;
}

async function resolvePageAndIg(userToken: string) {
  // 1) which pages does this token’s user see?
  const pages = await fetchJson(
    `https://graph.facebook.com/${GRAPH_V}/me/accounts?fields=id,name,access_token` +
    `&access_token=${encodeURIComponent(userToken)}`
  );
  const list: Array<{id:string;name:string;access_token:string}> = pages?.data || [];
  if (!list.length) {
    throw new Error(
      "No Facebook Pages found for this user. " +
      "Re-connect with the Page admin profile (the same profile listed under Page → Settings → Page access → People with Facebook access)."
    );
  }

  // 2) find first page linked to an IG Business account
  for (const p of list) {
    try {
      const pd = await fetchJson(
        `https://graph.facebook.com/${GRAPH_V}/${p.id}` +
        `?fields=instagram_business_account&access_token=${encodeURIComponent(p.access_token)}`
      );
      const igId = pd?.instagram_business_account?.id;
      if (!igId) continue;

      let igUsername = "";
      try {
        const u = await fetchJson(
          `https://graph.facebook.com/${GRAPH_V}/${igId}?fields=username` +
          `&access_token=${encodeURIComponent(p.access_token)}`
        );
        igUsername = u?.username || "";
      } catch {}

      return { pageId: p.id, pageName: p.name, pageAccessToken: p.access_token, igBusinessId: igId, igUsername };
    } catch { /* try next page */ }
  }

  throw new Error(
    "You have Pages, but none are linked to an Instagram Business account. " +
    "Open the Page → Settings → Linked accounts → connect an Instagram Professional (Business) account."
  );
}

export async function POST(req: NextRequest) {
  try {
    const { imageUrl, caption } = (await req.json()) as { imageUrl?: string; caption?: string };
    if (!imageUrl) return jerr("imageUrl is required (public URL)");

    await dbConnect();
    const provider = (await SocialProvider.findOne({
      userEmail: DEMO_EMAIL, platform: "INSTAGRAM",
    }).lean()) as ProviderDoc | null;

    if (!provider?.accessToken) return jerr("Instagram not connected. Connect IG first.");

    const ctx = await resolvePageAndIg(provider.accessToken);

    // 1) create media
    const create = await fetchJson(
      `https://graph.facebook.com/${GRAPH_V}/${ctx.igBusinessId}/media` +
      `?image_url=${encodeURIComponent(imageUrl)}` +
      `&caption=${encodeURIComponent(caption || "")}` +
      `&access_token=${encodeURIComponent(ctx.pageAccessToken)}`
    );
    if (!create?.id) throw new Error("Failed to create media container.");

    // 2) publish
    const publish = await fetchJson(
      `https://graph.facebook.com/${GRAPH_V}/${ctx.igBusinessId}/media_publish` +
      `?creation_id=${encodeURIComponent(create.id)}` +
      `&access_token=${encodeURIComponent(ctx.pageAccessToken)}`
    );

    return NextResponse.json({
      ok: true,
      publish,
      context: { pageId: ctx.pageId, pageName: ctx.pageName, igBusinessId: ctx.igBusinessId, igUsername: ctx.igUsername || provider.accountRef }
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Publish failed" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
