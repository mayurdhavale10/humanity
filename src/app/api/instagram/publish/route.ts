// src/app/api/instagram/publish/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
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

type IgContext = {
  pageId: string;
  pageName: string;
  pageAccessToken: string;
  instagramBusinessId: string;
  igUsername?: string;
};

// --- Graph helper with noisy errors ---
async function fetchGraph(
  url: string,
  opts?: { method?: "GET" | "POST"; form?: Record<string, string> }
) {
  const init: RequestInit = { method: opts?.method || "GET" };
  if (opts?.form) {
    init.method = "POST";
    init.headers = { "Content-Type": "application/x-www-form-urlencoded" };
    init.body = new URLSearchParams(opts.form).toString();
  }

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

// Resolve Page + IG Business via user token, return PAGE token
async function resolveIgContext(userToken: string): Promise<IgContext> {
  const pagesResp = await fetchGraph(
    `https://graph.facebook.com/${GRAPH_V}/me/accounts` +
      `?fields=id,name,access_token` +
      `&access_token=${encodeURIComponent(userToken)}`
  );

  const pages: Array<{ id: string; name: string; access_token: string }> =
    Array.isArray((pagesResp as any)?.data) ? (pagesResp as any).data : [];

  if (!pages.length) {
    throw new Error(
      "No Facebook Pages found for this user. Re-consent and tick the Page in the Facebook dialog."
    );
  }

  for (const p of pages) {
    try {
      const detail = await fetchGraph(
        `https://graph.facebook.com/${GRAPH_V}/${p.id}` +
          `?fields=instagram_business_account` +
          `&access_token=${encodeURIComponent(p.access_token)}`
      );
      const igId = (detail as any)?.instagram_business_account?.id;
      if (!igId) continue;

      let igUsername = "";
      try {
        const igUser = await fetchGraph(
          `https://graph.facebook.com/${GRAPH_V}/${igId}` +
            `?fields=username&access_token=${encodeURIComponent(p.access_token)}`
        );
        igUsername = (igUser as any)?.username || "";
      } catch { /* ignore */ }

      return {
        pageId: p.id,
        pageName: p.name,
        pageAccessToken: p.access_token,
        instagramBusinessId: igId,
        igUsername,
      };
    } catch { /* try next page */ }
  }

  throw new Error(
    "Found Pages, but none are linked to an Instagram Business account. Link an IG Professional account in Page settings → Linked accounts → Instagram."
  );
}

// --- NEW: wait for container readiness ---
async function waitUntilReady(creationId: string, pageAccessToken: string, timeoutMs = 30000) {
  const start = Date.now();
  let delay = 1500; // start with 1.5s, back off a bit

  while (true) {
    const info = await fetchGraph(
      `https://graph.facebook.com/${GRAPH_V}/${creationId}` +
        `?fields=status_code&access_token=${encodeURIComponent(pageAccessToken)}`
    );

    const status = (info as any)?.status_code || "";
    if (status === "FINISHED") return true;
    if (status === "ERROR") throw new Error("Media processing failed on Instagram.");

    if (Date.now() - start > timeoutMs) {
      throw new Error("Media is not ready to be published. Please wait a moment.");
    }

    await new Promise(r => setTimeout(r, delay));
    // mild backoff up to ~3s
    delay = Math.min(delay + 500, 3000);
  }
}

// --- Route ---
export async function POST(req: NextRequest) {
  try {
    const { imageUrl, caption } = (await req.json()) as {
      imageUrl?: string;
      caption?: string;
    };

    if (!imageUrl) {
      return NextResponse.json(
        { error: "imageUrl is required (publicly accessible URL)" },
        { status: 400 }
      );
    }

    await dbConnect();

    const provider = (await SocialProvider.findOne({
      userEmail: DEMO_EMAIL,
      platform: "INSTAGRAM",
    }).lean()) as ProviderDoc | null;

    if (!provider?.accessToken) {
      return NextResponse.json(
        { error: "No Instagram token saved. Connect Instagram first." },
        { status: 400 }
      );
    }

    const ctx = await resolveIgContext(provider.accessToken);

    // 1) Create media container (use PAGE token)
    const creation = await fetchGraph(
      `https://graph.facebook.com/${GRAPH_V}/${ctx.instagramBusinessId}/media`,
      {
        method: "POST",
        form: {
          image_url: imageUrl,
          caption: caption || "",
          access_token: ctx.pageAccessToken,
        },
      }
    );

    const creationId = String((creation as any)?.id || "");
    if (!creationId) throw new Error("Failed to create media container.");

    // 2) Wait until container is processed
    await waitUntilReady(creationId, ctx.pageAccessToken);

    // 3) Publish
    const publish = await fetchGraph(
      `https://graph.facebook.com/${GRAPH_V}/${ctx.instagramBusinessId}/media_publish`,
      {
        method: "POST",
        form: {
          creation_id: creationId,
          access_token: ctx.pageAccessToken,
        },
      }
    );

    return NextResponse.json({
      ok: true,
      publish,
      context: {
        pageId: ctx.pageId,
        pageName: ctx.pageName,
        igBusinessId: ctx.instagramBusinessId,
        igUsername: ctx.igUsername || provider.accountRef || "instagram",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Publish failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
