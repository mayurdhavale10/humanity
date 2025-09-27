// src/app/api/cron/run/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongo";
import PlannedPost from "@/models/PlannedPost";
import SocialProvider from "@/models/SocialProvider";

const GRAPH_V = "v19.0";
const DEMO_EMAIL = process.env.DEMO_USER_EMAIL || "demo@local.dev";
const CRON_SECRET = process.env.CRON_SECRET || "";

// Preferred: fixed Page token + IG user id from env (avoid /me/accounts in prod)
const IG_PAGE_ACCESS_TOKEN = process.env.IG_PAGE_ACCESS_TOKEN || "";
const IG_USER_ID = process.env.IG_USER_ID || "";

type ProviderDoc = { accessToken?: string } & Record<string, any>;

function log(...args: any[]) {
  // keep logs compact but informative in serverless logs
  console.log("[CRON]", ...args);
}

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
  // Fall-back path if you don't have IG_PAGE_ACCESS_TOKEN/IG_USER_ID in env
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
  // 1) create media container
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

  // 2) poll until ready
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
  // 0) simple auth
  const secret = new URL(req.url).searchParams.get("secret");
  if (!CRON_SECRET || secret !== CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();

  const now = new Date();

  // 1) Pick due posts for this user, status QUEUED/SCHEDULED, platform instagram (case-insensitive)
  const due = await PlannedPost.find({
    userEmail: DEMO_EMAIL,
    status: { $in: ["QUEUED", "SCHEDULED"] },
    scheduledAt: { $lte: now },
    // platforms: case-insensitive match for "instagram"
    platforms: { $elemMatch: { $regex: /^instagram$/i } },
  })
    .sort({ scheduledAt: 1 })
    .limit(10)
    .exec();

  if (!due.length) {
    return NextResponse.json({ ok: true, processed: {} });
  }

  log("START", { now: now.toISOString(), picked: due.map(d => String(d._id)) });

  const processed: Record<string, any> = {};

  // 2) Resolve IG context once per run (env first, fallback to user token)
  let pageAccessToken = IG_PAGE_ACCESS_TOKEN;
  let instagramBusinessId = IG_USER_ID;

  if (!pageAccessToken || !instagramBusinessId) {
    const provider = await SocialProvider.findOne({
      userEmail: DEMO_EMAIL,
      platform: "INSTAGRAM",
    }).lean<ProviderDoc>().exec();

    const userToken = provider?.accessToken || "";
    if (!userToken) {
      // If we can’t resolve context at all, mark each post as FAILED and return
      for (const post of due) {
        post.status = "FAILED";
        (post as any).error = "No Instagram credentials configured.";
        (post as any).attempts = ((post as any).attempts || 0) + 1;
        await post.save();
        processed[String(post._id)] = { ok: false, error: "No Instagram credentials configured." };
      }
      return NextResponse.json({ ok: true, processed });
    }

    try {
      const ctx = await resolveViaUserToken(userToken);
      pageAccessToken = ctx.pageAccessToken;
      instagramBusinessId = ctx.instagramBusinessId;
    } catch (e: any) {
      // Bubble the same clear error to each post
      for (const post of due) {
        post.status = "FAILED";
        (post as any).error = String(e?.message || e);
        (post as any).attempts = ((post as any).attempts || 0) + 1;
        await post.save();
        processed[String(post._id)] = { ok: false, error: (post as any).error };
      }
      return NextResponse.json({ ok: true, processed });
    }
  }

  // 3) Publish each due post with robust status flipping
  for (const post of due) {
    const idStr = String(post._id);
    try {
      // Validate media URL field (accept both nested and flat)
      const mediaUrl =
        (post as any)?.media?.imageUrl?.toString().trim() ||
        (post as any)?.mediaUrl?.toString().trim() ||
        (post as any)?.imageUrl?.toString().trim();

      if (!mediaUrl || !/^https?:\/\/.+/i.test(mediaUrl)) {
        throw new Error("Invalid media URL on post");
      }

      // Create container, wait, then publish
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

      processed[idStr] = { ok: true, publishId: publish?.id };
      log("PUBLISH_OK", { id: idStr, creationId: creationId, mediaUrl });
    } catch (err: any) {
      // Failure → mark FAILED and carry the reason
      post.status = "FAILED";
      post.publishedAt = new Date();
      (post as any).error = String(err?.message || err);
      (post as any).attempts = ((post as any).attempts || 0) + 1;
      await post.save();

      processed[idStr] = { ok: false, error: (post as any).error };
      console.error("[CRON] PUBLISH_FAIL", { id: idStr, error: (post as any).error });
      // continue to next post
    }
  }

  log("END", { processedKeys: Object.keys(processed) });

  return NextResponse.json({ ok: true, processed });
}
