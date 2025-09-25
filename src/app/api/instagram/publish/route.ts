// src/app/api/instagram/publish/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongo";
import SocialProvider from "@/models/SocialProvider";

// --- Config ---
const GRAPH_V = "v19.0";
const DEMO_EMAIL = process.env.DEMO_USER_EMAIL || "demo@local.dev";

// --- Types (lightweight) ---
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
  pageAccessToken: string; // <-- PAGE token, not user token
  instagramBusinessId: string;
  igUsername?: string;
};

// --- Helpers ---
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
  let body: any = null;
  try {
    body = await res.json();
  } catch {
    // ignore
  }
  if (!res.ok) {
    const msg =
      body?.error?.message ||
      (typeof body === "string" ? body : JSON.stringify(body));
    throw new Error(msg || `Graph ${res.status}`);
  }
  return body;
}

/**
 * Resolve Page + IG Business context via /me/accounts using the *user token*.
 * Returns PAGE access token (required for creating/publishing media).
 */
async function resolveIgContext(userToken: string): Promise<IgContext> {
  // 1) List pages the token’s FB user can manage
  const pagesResp = await fetchGraph(
    `https://graph.facebook.com/${GRAPH_V}/me/accounts?fields=id,name,access_token&access_token=${encodeURIComponent(
      userToken
    )}`
  );

  const pages: Array<{ id: string; name: string; access_token: string }> =
    Array.isArray(pagesResp?.data) ? pagesResp.data : [];

  if (!pages.length) {
    throw new Error(
      "No Facebook Pages found for this user. Re-consent and tick the Page in the Facebook dialog."
    );
  }

  // 2) Pick the first page that has a linked IG Business account
  for (const p of pages) {
    try {
      const pageDetails = await fetchGraph(
        `https://graph.facebook.com/${GRAPH_V}/${p.id}?fields=instagram_business_account&access_token=${encodeURIComponent(
          p.access_token
        )}`
      );
      const igId = pageDetails?.instagram_business_account?.id;
      if (!igId) continue;

      // Optional: username
      let igUsername = "";
      try {
        const igUser = await fetchGraph(
          `https://graph.facebook.com/${GRAPH_V}/${igId}?fields=username&access_token=${encodeURIComponent(
            p.access_token
          )}`
        );
        igUsername = igUser?.username || "";
      } catch {
        /* ignore */
      }

      return {
        pageId: p.id,
        pageName: p.name,
        pageAccessToken: p.access_token, // <-- THIS is what we must use for /media & /media_publish
        instagramBusinessId: igId,
        igUsername,
      };
    } catch {
      continue;
    }
  }

  throw new Error(
    "Found Pages, but none are linked to an Instagram Business account. Link an IG Professional account in Page settings → Linked accounts → Instagram."
  );
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

    // Read saved Instagram *user* token
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

    const userToken = provider.accessToken;

    // Resolve PAGE access token and IG business id
    const ctx = await resolveIgContext(userToken);

    // 1) Create media container (POST form, using PAGE token)
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

    if (!creation?.id) {
      throw new Error("Failed to create media container.");
    }

    // 2) Publish (POST form, using PAGE token)
    const publish = await fetchGraph(
      `https://graph.facebook.com/${GRAPH_V}/${ctx.instagramBusinessId}/media_publish`,
      {
        method: "POST",
        form: {
          creation_id: String(creation.id),
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
    // Return the raw Graph error message to help debugging from client/CLI
    return NextResponse.json(
      { error: err?.message || "Publish failed" },
      { status: 500 }
    );
  }
}

// Optional: block accidental GETs
export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
