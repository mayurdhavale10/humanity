import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongo";
import SocialProvider from "@/models/SocialProvider";

type ProviderDoc = {
  platform: string;
  userEmail: string;
  accessToken: string;
  accountRef?: string;
  meta?: Record<string, any>;
  expiresAt?: Date;
};

// ---- Helpers ---------------------------------------------------------------

async function resolveIgContext(userAccessToken: string) {
  // 1) Get pages that the user manages (need pages_show_list)
  const pagesRes = await fetch(
    `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,access_token&access_token=${encodeURIComponent(
      userAccessToken
    )}`
  );
  const pages = await pagesRes.json();
  if (!pages?.data?.length) {
    throw new Error("No Facebook Pages found for this user.");
  }

  // Pick the first page (or choose one by name/id if you prefer)
  const page = pages.data[0]; // { id, name, access_token }
  const pageToken: string = page.access_token;

  // 2) From the page, get the linked IG Business account id
  const igIdRes = await fetch(
    `https://graph.facebook.com/v19.0/${page.id}?fields=instagram_business_account&access_token=${encodeURIComponent(
      userAccessToken
    )}`
  );
  const igIdData = await igIdRes.json();
  const igBusinessId: string | undefined = igIdData?.instagram_business_account?.id;
  if (!igBusinessId) {
    throw new Error(
      `No Instagram Business Account linked to Page "${page.name}" (${page.id}).`
    );
  }

  // 3) For display, fetch the IG username
  const igUserRes = await fetch(
    `https://graph.facebook.com/v19.0/${igBusinessId}?fields=username&access_token=${encodeURIComponent(
      userAccessToken
    )}`
  );
  const igUser = await igUserRes.json();

  return {
    pageId: page.id as string,
    pageName: page.name as string,
    pageToken,
    igBusinessId,
    igUsername: igUser?.username as string | undefined,
  };
}

async function createMediaAndPublish(params: {
  igBusinessId: string;
  caption?: string;
  imageUrl: string;
  pageToken: string; // we use page token for publishing
}) {
  const { igBusinessId, caption, imageUrl, pageToken } = params;

  // Step A: create media container
  const formA = new URLSearchParams();
  formA.set("image_url", imageUrl);
  if (caption) formA.set("caption", caption);

  const createRes = await fetch(
    `https://graph.facebook.com/v19.0/${igBusinessId}/media`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formA.toString() + `&access_token=${encodeURIComponent(pageToken)}`,
    }
  );

  const createData = await createRes.json();
  if (!createRes.ok) {
    throw new Error(
      `IG /media failed: ${createRes.status} ${JSON.stringify(createData)}`
    );
  }
  const creationId = createData.id as string;

  // Step B: publish the container
  const formB = new URLSearchParams();
  formB.set("creation_id", creationId);

  const publishRes = await fetch(
    `https://graph.facebook.com/v19.0/${igBusinessId}/media_publish`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formB.toString() + `&access_token=${encodeURIComponent(pageToken)}`,
    }
  );

  const publishData = await publishRes.json();
  if (!publishRes.ok) {
    throw new Error(
      `IG /media_publish failed: ${publishRes.status} ${JSON.stringify(
        publishData
      )}`
    );
  }

  return { creationId, published: publishData?.id };
}

// ---- Route -----------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    // TEMP: until auth is wired
    const userEmail = process.env.DEMO_USER_EMAIL || "demo@local.dev";

    // ✅ Use findOne (not find) so TypeScript knows it's a single doc
    const provider = (await SocialProvider.findOne({
      userEmail,
      platform: "INSTAGRAM",
    }).lean()) as ProviderDoc | null;

    if (!provider?.accessToken) {
      return NextResponse.json(
        { error: "Instagram not connected for this user." },
        { status: 400 }
      );
    }

    // Body: { imageUrl: string; caption?: string }
    const { imageUrl, caption } = (await req.json()) as {
      imageUrl: string;
      caption?: string;
    };

    if (!imageUrl) {
      return NextResponse.json(
        { error: "imageUrl is required" },
        { status: 400 }
      );
    }

    // Resolve IG context (Page → IG Business ID → Page token)
    const ctx = await resolveIgContext(provider.accessToken);

    // Publish
    const result = await createMediaAndPublish({
      igBusinessId: ctx.igBusinessId,
      caption,
      imageUrl,
      pageToken: ctx.pageToken,
    });

    // Optional: store identity details if missing
    const needsUpdate = !provider.accountRef || !provider.meta?.igBusinessId;
    if (needsUpdate) {
      await SocialProvider.updateOne(
        { userEmail, platform: "INSTAGRAM" },
        {
          $set: {
            accountRef: provider.accountRef || ctx.igUsername || "instagram",
            meta: {
              ...(provider.meta || {}),
              pageId: ctx.pageId,
              pageName: ctx.pageName,
              igBusinessId: ctx.igBusinessId,
            },
          },
        }
      );
    }

    return NextResponse.json({
      ok: true,
      publish: result,
      context: {
        username: ctx.igUsername,
        pageId: ctx.pageId,
        pageName: ctx.pageName,
        igBusinessId: ctx.igBusinessId,
      },
    });
  } catch (err: any) {
    console.error("POST /api/instagram/publish error:", err);
    return NextResponse.json(
      { error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}
