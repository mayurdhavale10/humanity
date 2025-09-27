// src/app/api/planned-posts/[id]/run-now/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongo";
import PlannedPost from "@/models/PlannedPost";
import SocialProvider from "@/models/SocialProvider";

const GRAPH_V = "v19.0";
const CRON_SECRET = process.env.CRON_SECRET || "";
const IG_PAGE_ACCESS_TOKEN = process.env.IG_PAGE_ACCESS_TOKEN || "";
const IG_USER_ID = process.env.IG_USER_ID || "";

type ProviderDoc = { accessToken?: string } & Record<string, any>;

async function fetchJson(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  const raw = await res.text();
  let body: any;
  try { body = JSON.parse(raw); } catch { body = raw; }

  if (!res.ok) {
    console.error("📉 Graph error", { url, status: res.status, body });
    const msg =
      typeof body === "object" && body?.error?.message
        ? body.error.message
        : `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return body;
}

async function resolveViaUserToken(userToken: string) {
  // Resolve Page token + IG Business ID using a user token (fallback)
  const pagesResp = await fetchJson(
    `https://graph.facebook.com/${GRAPH_V}/me/accounts?fields=id,name,access_token&access_token=${encodeURIComponent(
      userToken
    )}`
  );

  const pages: Array<{ id: string; name: string; access_token: string }> =
    Array.isArray(pagesResp?.data) ? pagesResp.data : [];

  if (!pages.length) throw new Error("No Facebook Pages found for this user.");

  for (const p of pages) {
    const pageDetails = await fetchJson(
      `https://graph.facebook.com/${GRAPH_V}/${p.id}?fields=instagram_business_account&access_token=${encodeURIComponent(
        p.access_token
      )}`
    );
    const igId = pageDetails?.instagram_business_account?.id as string | undefined;
    if (igId) {
      return {
        pageId: p.id,
        pageName: p.name,
        pageAccessToken: p.access_token,
        instagramBusinessId: igId,
      };
    }
  }

  throw new Error("Pages found, but none linked to an Instagram Business account.");
}

async function createContainerAndWait(
  igId: string,
  pageToken: string,
  imageUrl: string,
  caption: string
) {
  // 1) Create media container
  const creation = await fetchJson(
    `https://graph.facebook.com/${GRAPH_V}/${igId}/media`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        image_url: imageUrl,
        caption: caption || "",
        access_token: pageToken,
      }).toString(),
    }
  );

  const creationId = creation?.id as string | undefined;
  if (!creationId) throw new Error("Failed to create media container.");

  // 2) Poll until FINISHED (max ~30s)
  const maxTries = 6;
  const delayMs = 5000;
  for (let i = 0; i < maxTries; i++) {
    const status = await fetchJson(
      `https://graph.facebook.com/${GRAPH_V}/${creationId}?fields=status_code,status&access_token=${encodeURIComponent(
        pageToken
      )}`
    );
    const code = status?.status_code; // FINISHED | IN_PROGRESS | ERROR
    if (code === "FINISHED") return creationId;
    if (code === "ERROR") throw new Error("Media container processing failed.");
    await new Promise((r) => setTimeout(r, delayMs));
  }
  throw new Error("Media container is not ready yet.");
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> } // matches current Next 15 typegen expectation
) {
  // Auth (query ?secret= or Bearer)
  const secret =
    req.nextUrl.searchParams.get("secret") ??
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (CRON_SECRET && secret !== CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params; // must await because of Promise-typed params
  await dbConnect();

  const post = await PlannedPost.findById(id);
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  // Validate platform
  const platforms = ((post as any).platforms || []).map((p: string) => String(p).toLowerCase());
  if (!platforms.includes("instagram")) {
    return NextResponse.json({ error: "Post is not targeted at Instagram" }, { status: 400 });
  }

  // Get media URL (accept common field shapes)
  const mediaUrl =
    (post as any)?.media?.imageUrl?.toString().trim() ||
    (post as any)?.mediaUrl?.toString().trim() ||
    (post as any)?.imageUrl?.toString().trim();

  if (!mediaUrl || !/^https?:\/\/.+/i.test(mediaUrl)) {
    return NextResponse.json({ error: "Invalid or missing media URL on post" }, { status: 400 });
  }

  try {
    // Resolve IG context: prefer env Page token + IG user id, fallback to user's saved token
    let pageAccessToken = IG_PAGE_ACCESS_TOKEN;
    let instagramBusinessId = IG_USER_ID;

    if (!pageAccessToken || !instagramBusinessId) {
      const provider = await SocialProvider.findOne({
        userEmail: (post as any).userEmail,
        platform: "INSTAGRAM",
      }).lean<ProviderDoc>().exec();

      const userToken = provider?.accessToken || "";
      if (!userToken) {
        throw new Error("No Instagram credentials configured.");
      }

      const ctxResolved = await resolveViaUserToken(userToken);
      pageAccessToken = ctxResolved.pageAccessToken;
      instagramBusinessId = ctxResolved.instagramBusinessId;
    }

    // Create container → wait → publish
    const creationId = await createContainerAndWait(
      instagramBusinessId,
      pageAccessToken,
      mediaUrl,
      (post as any).caption || ""
    );

    const publish = await fetchJson(
      `https://graph.facebook.com/${GRAPH_V}/${instagramBusinessId}/media_publish`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          creation_id: String(creationId),
          access_token: pageAccessToken,
        }).toString(),
      }
    );

    // Success → mark PUBLISHED
    post.status = "PUBLISHED";
    post.publishedAt = new Date();
    (post as any).error = null;
    (post as any).attempts = ((post as any).attempts || 0) + 1;

    const results: any[] = Array.isArray((post as any).results)
      ? (post as any).results
      : [];
    results.push({
      platform: "instagram",
      remoteId: publish?.id,
      postedAt: new Date(),
    });
    (post as any).results = results;

    await post.save();

    return NextResponse.json({ ok: true, publishId: publish?.id });
  } catch (e: any) {
    // Failure → mark FAILED and surface error
    (post as any).status = "FAILED";
    (post as any).publishedAt = new Date();
    (post as any).error = String(e?.message || e);
    (post as any).attempts = ((post as any).attempts || 0) + 1;
    await post.save();

    return NextResponse.json(
      { ok: false, error: (post as any).error },
      { status: 500 }
    );
  }
}
