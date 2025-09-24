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
  pageAccessToken: string;
  instagramBusinessId: string;
  igUsername?: string;
};

// --- Helpers ---
async function fetchJson(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  let body: any = null;
  try {
    body = await res.json();
  } catch {
    // ignore json parse errors
  }
  if (!res.ok) {
    const msg =
      body?.error?.message ||
      (typeof body === "string" ? body : JSON.stringify(body));
    throw new Error(`${res.status} ${res.statusText}: ${msg}`);
  }
  return body;
}

/**
 * Resolve Page + IG Business context using ONLY:
 *   /me/accounts  (no PAGE_ID fallback)
 */
async function resolveIgContext(userToken: string): Promise<IgContext> {
  // 1) List pages the *token’s FB user* can manage
  const pagesResp = await fetchJson(
    `https://graph.facebook.com/${GRAPH_V}/me/accounts` +
      `?fields=id,name,access_token` +
      `&access_token=${encodeURIComponent(userToken)}`
  );

  const pages: Array<{ id: string; name: string; access_token: string }> =
    Array.isArray(pagesResp?.data) ? pagesResp.data : [];

  if (!pages.length) {
    throw new Error(
      "No Facebook Pages found for this user. " +
        "Make sure you re-consent with the Page admin profile and tick the Page during the Facebook dialog. " +
        "Required scopes: instagram_basic, pages_show_list, pages_read_engagement, pages_manage_metadata, instagram_content_publish."
    );
  }

  // 2) Find the first page that has a linked IG Business account
  for (const p of pages) {
    try {
      const pageDetails = await fetchJson(
        `https://graph.facebook.com/${GRAPH_V}/${p.id}` +
          `?fields=instagram_business_account` +
          `&access_token=${encodeURIComponent(p.access_token)}`
      );
      const igId = pageDetails?.instagram_business_account?.id;
      if (!igId) continue;

      // Optional: get username for nicer context
      let igUsername = "";
      try {
        const igUser = await fetchJson(
          `https://graph.facebook.com/${GRAPH_V}/${igId}` +
            `?fields=username&access_token=${encodeURIComponent(p.access_token)}`
        );
        igUsername = igUser?.username || "";
      } catch {
        // ignore username failure
      }

      return {
        pageId: p.id,
        pageName: p.name,
        pageAccessToken: p.access_token,
        instagramBusinessId: igId,
        igUsername,
      };
    } catch {
      // try next page
      continue;
    }
  }

  throw new Error(
    "You have Pages, but none are linked to an Instagram Business account. " +
      "Open the Page → Settings → Linked accounts → connect an Instagram Professional (Business) account."
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

    // Read the saved Instagram provider (user token)
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

    // Resolve Page + IG Business context via /me/accounts only
    const ctx = await resolveIgContext(userToken);

    // 1) Create media container (use PAGE ACCESS TOKEN)
    const creation = await fetchJson(
      `https://graph.facebook.com/${GRAPH_V}/${ctx.instagramBusinessId}/media` +
        `?image_url=${encodeURIComponent(imageUrl)}` +
        `&caption=${encodeURIComponent(caption || "")}` +
        `&access_token=${encodeURIComponent(ctx.pageAccessToken)}`
    );
    if (!creation?.id) {
      throw new Error("Failed to create media container.");
    }

    // 2) Publish
    const publish = await fetchJson(
      `https://graph.facebook.com/${GRAPH_V}/${ctx.instagramBusinessId}/media_publish` +
        `?creation_id=${encodeURIComponent(creation.id)}` +
        `&access_token=${encodeURIComponent(ctx.pageAccessToken)}`
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

// Optional: block accidental GETs
export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
