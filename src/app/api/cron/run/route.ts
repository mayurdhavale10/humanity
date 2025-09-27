// src/app/api/cron/run/route.ts
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

function log(...args: any[]) {
  console.log("[CRON]", ...args);
}

async function fetchJson(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  const raw = await res.text();
  let body: any;
  try {
    body = JSON.parse(raw);
  } catch {
    body = raw;
  }
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

  const maxTries = 6,
    delayMs = 5000;
  for (let i = 0; i < maxTries; i++) {
    const status = await fetchJson(
      `https://graph.facebook.com/${GRAPH_V}/${creationId}?fields=status_code,status&access_token=${encodeURIComponent(
        pageToken
      )}`
    );
    const code = status?.status_code;
    if (code === "FINISHED") return creationId;
    if (code === "ERROR") throw new Error("Media container processing failed.");
    await new Promise((r) => setTimeout(r, delayMs));
  }
  throw new Error("Media container is not ready yet.");
}

export async function GET(req: NextRequest) {
  // Optional auth: only enforce if CRON_SECRET exists
  const incomingSecret =
    new URL(req.url).searchParams.get("secret") ??
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (CRON_SECRET && incomingSecret !== CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();

  // pick due posts (no email filter)
  const due = await PlannedPost.find({
    status: { $in: ["QUEUED", "SCHEDULED"] },
    scheduledAt: { $lte: new Date() },
    platforms: { $elemMatch: { $regex: /^instagram$/i } },
  })
    .sort({ scheduledAt: 1 })
    .limit(10)
    .exec();

  if (!due.length) return NextResponse.json({ ok: true, processed: {} });

  log("START", {
    now: new Date().toISOString(),
    picked: due.map((d) => String(d._id)),
  });

  let pageAccessToken = IG_PAGE_ACCESS_TOKEN;
  let instagramBusinessId = IG_USER_ID;

  const processed: Record<string, any> = {};

  for (const post of due) {
    const idStr = String(post._id);

    // optional: skip in case someone flips it mid-run
    if ((post as any).status === "PUBLISHED") {
      processed[idStr] = { ok: true, skipped: "already published" };
      continue;
    }

    try {
      // Decide tokens this iteration
      let pageToken = pageAccessToken;
      let igId = instagramBusinessId;

      if (!pageToken || !igId) {
        const provider = await SocialProvider.findOne({
          userEmail: (post as any).userEmail,
          platform: "INSTAGRAM",
        })
          .lean<ProviderDoc>()
          .exec();

        const userToken = provider?.accessToken || "";
        if (!userToken) throw new Error("No Instagram credentials configured.");

        const ctx = await resolveViaUserToken(userToken);
        pageToken = ctx.pageAccessToken;
        igId = ctx.instagramBusinessId;
      }

      // Media URL (support different shapes)
      const mediaUrl =
        (post as any)?.media?.imageUrl?.toString().trim() ||
        (post as any)?.mediaUrl?.toString().trim() ||
        (post as any)?.imageUrl?.toString().trim();
      if (!mediaUrl || !/^https?:\/\/.+/i.test(mediaUrl)) {
        throw new Error("Invalid media URL on post");
      }

      // Create container → wait → publish
      const creationId = await createContainerAndWait(
        igId,
        pageToken,
        mediaUrl,
        (post as any).caption || ""
      );

      const publish = await fetchJson(
        `https://graph.facebook.com/${GRAPH_V}/${igId}/media_publish`,
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            creation_id: String(creationId),
            access_token: pageToken,
          }).toString(),
        }
      );

      // ✅ After successful publish, flip status and append results (enum-safe)
      post.status = "PUBLISHED";
      post.publishedAt = new Date();
      (post as any).error = null;
      (post as any).attempts = ((post as any).attempts || 0) + 1;

      const results: any[] = Array.isArray((post as any).results)
        ? (post as any).results
        : [];
      results.push({
        platform: "INSTAGRAM", // MUST match schema enum (not "instagram")
        remoteId: publish?.id,
        postedAt: new Date(),
        source: "cron",
      });
      (post as any).results = results;

      await post.save();

      processed[idStr] = { ok: true, publishId: publish?.id };
      log("PUBLISH_OK", { id: idStr, creationId, mediaUrl });
    } catch (err: any) {
      post.status = "FAILED";
      post.publishedAt = new Date();
      (post as any).error = String(err?.message || err);
      (post as any).attempts = ((post as any).attempts || 0) + 1;
      await post.save();

      processed[idStr] = { ok: false, error: (post as any).error };
      console.error("[CRON] PUBLISH_FAIL", { id: idStr, error: (post as any).error });
    }
  }

  log("END", { processedKeys: Object.keys(processed) });

  return NextResponse.json({ ok: true, processed });
}
