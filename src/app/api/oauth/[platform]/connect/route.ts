// src/app/api/instagram/publish/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongo";
import SocialProvider from "@/models/SocialProvider";

// --- Config ---
const GRAPH_V = "v19.0";
const DEMO_EMAIL = process.env.DEMO_USER_EMAIL || "demo@local.dev";
// Optional fallback when /me/accounts returns []:
const FB_PAGE_ID = process.env.FB_PAGE_ID || ""; // e.g. "841554912354967"

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
 * Resolve Page + IG Business context using:
 *  1) /me/accounts (normal path)
 *  2) FB_PAGE_ID fallback (when /me/accounts returns [])
 */
async function resolveIgContext(userToken: string): Promise<IgContext> {
  // 1) Try /me/accounts first
  const accountsUrl =
    `https://graph.facebook.com/${GRAPH_V}/me/accounts` +
    `?fields=id,name,access_token` +
    `&access_token=${encodeURIComponent(userToken)}`;

  const pages = await fetchJson(accountsUrl);

  let pickedPage:
    | { id: string; name: string; access_token: string }
    | undefined;

  if (Array.isArray(pages?.data) && pages.data.length) {
    // If FB_PAGE_ID provided, prefer it
    if (FB_PAGE_ID) {
      pickedPage = pages.data.find((p: any) => String(p.id) === FB_PAGE_ID);
    }
    // else take the first page
    pickedPage ||= pages.data[0];
  }

  // 2) Fallback: direct lookup by PAGE_ID using the *user token*
  if (!pickedPage) {
    if (!FB_PAGE_ID) {
      throw new Error(
        "No Facebook Pages found for this user. " +
          "Fix: ensure the consenting FB user has Facebook access (Full control) to a Page, " +
          "or set FB_PAGE_ID in your environment to a Page you control."
      );
    }

    const pageInfoUrl =
      `https://graph.facebook.com/${GRAPH_V}/${FB_PAGE_ID}` +
      `?fields=id,name,access_token,instagram_business_account` +
      `&access_token=${encodeURIComponent(userToken)}`;

    const pageInfo = await fetchJson(pageInfoUrl);

    if (!pageInfo?.access_token) {
      throw new Error(
        `Could not fetch Page access token for PAGE_ID=${FB_PAGE_ID}. ` +
          `Ensure the consenting FB user has Facebook access (Full control) on this Page ` +
          `and that you granted pages_manage_metadata/pages_show_list.`
      );
    }

    const igBizId = pageInfo?.instagram_business_account?.id;
    if (!igBizId) {
      // try again using the page token to fetch ig biz id
      const pageToken: string = pageInfo.access_token;
      const igUrl =
        `https://graph.facebook.com/${GRAPH_V}/${FB_PAGE_ID}` +
        `?fields=instagram_business_account` +
        `&access_token=${encodeURIComponent(pageToken)}`;
      const pageAgain = await fetchJson(igUrl);
      const igId = pageAgain?.instagram_business_account?.id;
      if (!igId) {
        throw new Error(
          `No Instagram Business Account linked to Page "${pageInfo?.name || FB_PAGE_ID}" (${FB_PAGE_ID}). ` +
            `Link an IG Business account to this Page in Page settings (Linked accounts → Instagram).`
        );
      }
      return {
        pageId: FB_PAGE_ID,
        pageName: pageInfo?.name || "Unknown",
        pageAccessToken: pageToken,
        instagramBusinessId: igId,
      };
    }

    return {
      pageId: FB_PAGE_ID,
      pageName: pageInfo?.name || "Unknown",
      pageAccessToken: pageInfo.access_token,
      instagramBusinessId: igBizId,
    };
  }

  // Have a page via /me/accounts
  const pageId = pickedPage.id;
  const pageName = pickedPage.name;
  const pageAccessToken = pickedPage.access_token;

  // Get IG Business ID
  const igUrl =
    `https://graph.facebook.com/${GRAPH_V}/${pageId}` +
    `?fields=instagram_business_account` +
    `&access_token=${encodeURIComponent(pageAccessToken)}`;
  const page = await fetchJson(igUrl);
  const igBusinessId = page?.instagram_business_account?.id;

  if (!igBusinessId) {
    throw new Error(
      `No Instagram Business Account linked to Page "${pageName}" (${pageId}). ` +
        `Link an IG Business account to this Page in Page settings (Linked accounts → Instagram).`
    );
  }

  return { pageId, pageName, pageAccessToken, instagramBusinessId: igBusinessId };
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

    const userToken = provider.accessToken;

    // Resolve Page + IG Business context (with fallback by FB_PAGE_ID)
    const ctx = await resolveIgContext(userToken);

    // 1) Create media container
    const createUrl =
      `https://graph.facebook.com/${GRAPH_V}/${ctx.instagramBusinessId}/media` +
      `?image_url=${encodeURIComponent(imageUrl)}` +
      `&caption=${encodeURIComponent(caption || "")}` +
      `&access_token=${encodeURIComponent(ctx.pageAccessToken)}`;

    const creation = await fetchJson(createUrl);

    if (!creation?.id) {
      throw new Error("Failed to create media container.");
    }

    // 2) Publish
    const publishUrl =
      `https://graph.facebook.com/${GRAPH_V}/${ctx.instagramBusinessId}/media_publish` +
      `?creation_id=${encodeURIComponent(creation.id)}` +
      `&access_token=${encodeURIComponent(ctx.pageAccessToken)}`;

    const publish = await fetchJson(publishUrl);

    return NextResponse.json({
      ok: true,
      publish,
      context: {
        pageId: ctx.pageId,
        pageName: ctx.pageName,
        igBusinessId: ctx.instagramBusinessId,
      },
    });
  } catch (err: any) {
    // Bubble up a clear error for your PowerShell catcher to print
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
