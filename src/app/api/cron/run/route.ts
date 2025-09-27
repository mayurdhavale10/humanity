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

/* ---------- Instagram helpers ---------- */

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
    const code = status?.status_code; // FINISHED | IN_PROGRESS | ERROR
    if (code === "FINISHED") return creationId;
    if (code === "ERROR") throw new Error("Media container processing failed.");
    await new Promise((r) => setTimeout(r, delayMs));
  }
  throw new Error("Media container is not ready yet.");
}

/* ---------- Handler (publishes all requested platforms in one pass) ---------- */

export async function GET(req: NextRequest) {
  // Optional auth: only enforce if CRON_SECRET exists
  const incomingSecret =
    new URL(req.url).searchParams.get("secret") ??
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (CRON_SECRET && incomingSecret !== CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();

  // Pick due posts for Instagram or LinkedIn
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

  // Cache env IG creds (if configured)
  let cachedPageAccessToken = IG_PAGE_ACCESS_TOKEN;
  let cachedIgUserId = IG_USER_ID;

  const processed: Record<string, any> = {};

  for (const post of due) {
    const idStr = String(post._id);

    // Idempotency: skip if already published
    if ((post as any).status === "PUBLISHED") {
      processed[idStr] = { ok: true, skipped: "already published" };
      continue;
    }

    const platforms = ((post as any).platforms || []).map((p: string) =>
      String(p).toLowerCase()
    );
    const wantsInstagram = platforms.includes("instagram");
    const wantsLinkedIn = platforms.includes("linkedin");

    const mediaUrl =
      (post as any)?.media?.imageUrl?.toString().trim() ||
      (post as any)?.mediaUrl?.toString().trim() ||
      (post as any)?.imageUrl?.toString().trim() ||
      "";
    const caption = (post as any).caption || "";

    const results: any[] = Array.isArray((post as any).results)
      ? (post as any).results
      : [];
    let anyOk = false;
    const errs: string[] = [];

    // Try LinkedIn
    if (wantsLinkedIn) {
      try {
        const liProv = await SocialProvider.findOne({
          userEmail: (post as any).userEmail,
          platform: "LINKEDIN",
        })
          .lean<ProviderDoc>()
          .exec();

        if (!liProv?.accessToken || !liProv?.meta?.actorUrn) {
          throw new Error("LinkedIn not connected for this user.");
        }

        const { publishToLinkedIn } = await import("@/lib/publishers/linkedin");

        const { id: liId } = await publishToLinkedIn({
          accessToken: liProv.accessToken as string,
          actorUrn: liProv.meta.actorUrn as string,
          caption,
          imageUrl: mediaUrl || undefined, // LinkedIn allows text-only
        });

        results.push({
          platform: "LINKEDIN",
          remoteId: liId,
          postedAt: new Date(),
          source: "cron",
        });
        anyOk = true;
      } catch (e: any) {
        errs.push(`LINKEDIN: ${e?.message || String(e)}`);
      }
    }

    // Try Instagram
    if (wantsInstagram) {
      try {
        if (!/^https?:\/\/.+/i.test(mediaUrl)) {
          throw new Error("Invalid media URL on post (required for Instagram).");
        }

        // Decide tokens (env first, fallback to saved user token)
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

        results.push({
          platform: "INSTAGRAM",
          remoteId: publish?.id,
          postedAt: new Date(),
          source: "cron",
        });
        anyOk = true;
      } catch (e: any) {
        errs.push(`INSTAGRAM: ${e?.message || String(e)}`);
      }
    }

    try {
      (post as any).results = results;
      (post as any).attempts = ((post as any).attempts || 0) + 1;
      (post as any).error = errs.length ? errs.join(" | ") : null;
      post.publishedAt = new Date();
      post.status = anyOk ? "PUBLISHED" : "FAILED";
      await post.save();

      processed[idStr] = anyOk
        ? {
            ok: true,
            results: results.map((r) => ({ platform: r.platform, id: r.remoteId })),
          }
        : { ok: false, error: (post as any).error };
    } catch (e: any) {
      processed[idStr] = { ok: false, error: String(e?.message || e) };
    }
  }

  log("END", { processedKeys: Object.keys(processed) });
  return NextResponse.json({ ok: true, processed });
}

// Optional: allow POST to trigger the same logic (no ctx here)
export async function POST(req: NextRequest) {
  return GET(req);
}
