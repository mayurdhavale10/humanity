// src/app/api/cron/run/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongo";
import PlannedPost from "@/models/PlannedPost";
import SocialProvider from "@/models/SocialProvider";

const GRAPH_V = "v19.0";
const DEMO_EMAIL = process.env.DEMO_USER_EMAIL || "demo@local.dev";
const CRON_SECRET = process.env.CRON_SECRET || "";

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

async function resolveIgContext(userToken: string) {
  const pagesResp = await fetchJson(
    `https://graph.facebook.com/${GRAPH_V}/me/accounts?fields=id,name,access_token&access_token=${encodeURIComponent(
      userToken
    )}`
  );

  const pages: Array<{ id: string; name: string; access_token: string }> =
    Array.isArray(pagesResp?.data) ? pagesResp.data : [];

  if (!pages.length) {
    throw new Error("No Facebook Pages found for this user.");
  }

  for (const p of pages) {
    const pageDetails = await fetchJson(
      `https://graph.facebook.com/${GRAPH_V}/${p.id}?fields=instagram_business_account&access_token=${encodeURIComponent(
        p.access_token
      )}`
    );
    const igId = pageDetails?.instagram_business_account?.id;
    if (igId) {
      return {
        pageId: p.id,
        pageName: p.name,
        pageAccessToken: p.access_token,
        instagramBusinessId: igId,
      };
    }
  }

  throw new Error("Pages found but none linked to an Instagram Business account.");
}

async function createContainerAndWait(
  igId: string,
  pageToken: string,
  imageUrl: string,
  caption: string
) {
  // create container
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

  // poll until ready
  const maxTries = 6; // ~30s
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

export async function GET(req: NextRequest) {
  // simple auth
  const secret = new URL(req.url).searchParams.get("secret");
  if (!CRON_SECRET || secret !== CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();

  const now = new Date();

  // pick both SCHEDULED and QUEUED
  const due = await PlannedPost.find({
    userEmail: DEMO_EMAIL,
    status: { $in: ["QUEUED", "SCHEDULED"] },
    scheduledAt: { $lte: now },
    platforms: { $in: ["INSTAGRAM"] },
  })
    .sort({ scheduledAt: 1 })
    .limit(5)
    .exec();

  if (!due.length) return NextResponse.json({ ok: true, processed: {} });

  const processed: Record<string, any> = {};

  for (const post of due) {
    try {
      // validation
      const imageUrl = post?.media?.imageUrl?.toString().trim();
      if (!imageUrl || !/^https?:\/\/.+/i.test(imageUrl) || /[)\s]+$/.test(imageUrl)) {
        throw new Error("Invalid media.imageUrl");
      }

      // fetch provider (typed)
      const provider = (await SocialProvider.findOne({
        userEmail: DEMO_EMAIL,
        platform: "INSTAGRAM",
      })
        .lean<ProviderDoc>()
        .exec()) as ProviderDoc | null;

      if (!provider?.accessToken) throw new Error("No Instagram user token saved.");

      // resolve page token + ig id
      const ctx = await resolveIgContext(provider.accessToken);

      // create container and wait
      const creationId = await createContainerAndWait(
        ctx.instagramBusinessId,
        ctx.pageAccessToken,
        imageUrl,
        post.caption || ""
      );

      // publish
      const publish = await fetchJson(
        `https://graph.facebook.com/${GRAPH_V}/${ctx.instagramBusinessId}/media_publish`,
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            creation_id: String(creationId),
            access_token: ctx.pageAccessToken,
          }).toString(),
        }
      );

      // update (results must match your schema)
      post.status = "PUBLISHED";
      post.publishedAt = new Date();
      (post as any).attempts = ((post as any).attempts || 0) + 1;

      const results: any[] = Array.isArray((post as any).results)
        ? (post as any).results
        : [];

      results.push({
        platform: "INSTAGRAM",
        remoteId: publish?.id,
        postedAt: new Date(),
      });

      (post as any).results = results;
      await post.save();

      processed[String(post._id)] = { ok: true, publishId: publish?.id };
    } catch (err: any) {
      post.status = "FAILED";
      post.publishedAt = new Date();
      (post as any).error = String(err?.message || err);
      (post as any).attempts = ((post as any).attempts || 0) + 1;

      // keep results shape strict: don’t push `{ at, error }`
      await post.save();

      processed[String(post._id)] = { ok: false, error: (post as any).error };
    }
  }

  return NextResponse.json({ ok: true, processed });
}
