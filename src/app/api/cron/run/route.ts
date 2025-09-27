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

type ProviderDoc = { accessToken?: string; meta?: any } & Record<string, any>;

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

// ---------- Instagram helpers ----------
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

  const maxTries = 6;
  const delayMs = 5000;
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

// ---------- Cron handler ----------
export async function GET(req: NextRequest) {
  // Optional auth: only enforce if CRON_SECRET exists
  const incomingSecret =
    new URL(req.url).searchParams.get("secret") ??
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (CRON_SECRET && incomingSecret !== CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();

  // 1) Pick due posts for instagram or linkedin
  const due = await PlannedPost.find({
    status: { $in: ["QUEUED", "SCHEDULED"] },
    scheduledAt: { $lte: new Date() },
    platforms: { $elemMatch: { $regex: /^(instagram|linkedin)$/i } },
  })
    .sort({ scheduledAt: 1 })
    .limit(10)
    .exec();

  if (!due.length) return NextResponse.json({ ok: true, processed: {} });

  log("START", {
    now: new Date().toISOString(),
    picked: due.map((d) => String(d._id)),
  });

  // Cache env IG creds (if you configured them)
  let cachedPageAccessToken = IG_PAGE_ACCESS_TOKEN;
  let cachedIgUserId = IG_USER_ID;

  const processed: Record<string, any> = {};

  for (const post of due) {
    const idStr = String(post._id);

    // idempotency: skip if someone already flipped it
    if ((post as any).status === "PUBLISHED") {
      processed[idStr] = { ok: true, skipped: "already published" };
      continue;
    }

    // Parse platforms & common fields once
    const platforms = ((post as any).platforms || []).map((p: string) =>
      String(p).toLowerCase()
    );
    const wantsInstagram = platforms.includes("instagram");
    const wantsLinkedIn = platforms.includes("linkedin");

    const mediaUrl =
      (post as any)?.media?.imageUrl?.toString().trim() ||
      (post as any)?.mediaUrl?.toString().trim() ||
      (post as any)?.imageUrl?.toString().trim();
    const caption = (post as any).caption || "";

    try {
      // ---------- LinkedIn branch ----------
      if (wantsLinkedIn) {
        // Get LinkedIn creds for this user
        const liProv = await SocialProvider.findOne({
          userEmail: (post as any).userEmail,
          platform: "LINKEDIN",
        })
          .lean<ProviderDoc>()
          .exec();

        if (!liProv?.accessToken || !liProv?.meta?.actorUrn) {
          throw new Error("LinkedIn not connected for this user.");
        }

        // Dynamically import LinkedIn publisher
        const { publishToLinkedIn } = await import("@/lib/publishers/linkedin");

        // NOTE: LinkedIn can do text-only; pass imageUrl if you have one
        const { id: liId } = await publishToLinkedIn({
          accessToken: liProv.accessToken as string,
          actorUrn: liProv.meta.actorUrn as string,
          caption,
          imageUrl: mediaUrl || undefined,
        });

        // Record LinkedIn success (don’t flip to FAILED if IG later fails)
        (post as any).attempts = ((post as any).attempts || 0) + 1;
        (post as any).error = null;

        const resultsLI: any[] = Array.isArray((post as any).results)
          ? (post as any).results
          : [];
        resultsLI.push({
          platform: "LINKEDIN", // UPPERCASE per schema enum
          remoteId: liId,
          postedAt: new Date(),
          source: "cron",
        });
        (post as any).results = resultsLI;

        // If only LinkedIn was requested, we can finalize the doc now
        if (!wantsInstagram) {
          post.status = "PUBLISHED";
          post.publishedAt = new Date();
          await post.save();
          processed[idStr] = { ok: true, publishId: liId };
          log("PUBLISH_OK_LINKEDIN", { id: idStr, liId });
          continue;
        }
      }

      // ---------- Instagram branch ----------
      if (wantsInstagram) {
        // IG requires an image
        if (!mediaUrl || !/^https?:\/\/.+/i.test(mediaUrl)) {
          throw new Error("Invalid media URL on post (required for Instagram).");
        }

        // Decide tokens for this iteration (env first, fallback to user token)
        let pageToken = cachedPageAccessToken;
        let igId = cachedIgUserId;

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

          // cache for subsequent posts in this run
          cachedPageAccessToken = pageToken;
          cachedIgUserId = igId;
        }

        const creationId = await createContainerAndWait(
          igId,
          pageToken,
          mediaUrl,
          caption
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

        (post as any).attempts = ((post as any).attempts || 0) + 1;
        (post as any).error = null;

        const resultsIG: any[] = Array.isArray((post as any).results)
          ? (post as any).results
          : [];
        resultsIG.push({
          platform: "INSTAGRAM", // UPPERCASE per schema enum
          remoteId: publish?.id,
          postedAt: new Date(),
          source: "cron",
        });
        (post as any).results = resultsIG;

        // If we got here (and maybe LI also succeeded), mark PUBLISHED
        post.status = "PUBLISHED";
        post.publishedAt = new Date();
        await post.save();

        processed[idStr] = { ok: true, publishId: publish?.id };
        log("PUBLISH_OK_INSTAGRAM", { id: idStr, creationId, mediaUrl });
        continue;
      }

      // If neither branch matched (shouldn’t happen with our find query)
      throw new Error("No supported platform matched for this post.");
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
