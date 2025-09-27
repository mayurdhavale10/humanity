// src/lib/publishers/linkedin.ts
const LI_API = "https://api.linkedin.com/v2";

async function liFetch(url: string, token: string, init?: RequestInit) {
  const res = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...(init?.headers || {}) },
  });
  const raw = await res.text();
  let body: any; try { body = JSON.parse(raw); } catch { body = raw; }
  if (!res.ok) {
    // Bubble up a readable error
    const msg =
      typeof body === "object" && body
        ? JSON.stringify(body)
        : `HTTP ${res.status}`;
    throw new Error(`LinkedIn: ${msg}`);
  }
  return body;
}

/**
 * 3-step LinkedIn image post:
 * 1) registerUpload  2) PUT bytes to uploadUrl  3) ugcPosts
 */
export async function publishLinkedIn(params: {
  accessToken: string;
  actorUrn: string;   // "urn:li:person:<id>"
  imageUrl: string;   // https
  caption: string;
}) {
  const { accessToken, actorUrn, imageUrl, caption } = params;

  // 1) Register upload
  const reg = await liFetch(`${LI_API}/assets?action=registerUpload`, accessToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      registerUploadRequest: {
        recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
        owner: actorUrn,
        serviceRelationships: [
          { relationshipType: "OWNER", identifier: "urn:li:userGeneratedContent" },
        ],
      },
    }),
  });

  const mech = reg?.value?.uploadMechanism?.["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"];
  const uploadUrl = mech?.uploadUrl as string | undefined;
  const asset = reg?.value?.asset as string | undefined; // "urn:li:digitalmediaAsset:xxxx"
  if (!uploadUrl || !asset) throw new Error("LinkedIn: failed to register upload");

  // 2) Download your image and PUT to LinkedIn
  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) throw new Error("LinkedIn: failed to fetch image");
  const buf = Buffer.from(await imgRes.arrayBuffer());
  const contentType = imgRes.headers.get("content-type") || "image/jpeg";

  const put = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": contentType }, body: buf });
  if (!put.ok) {
    const t = await put.text().catch(() => "");
    throw new Error(`LinkedIn upload failed: HTTP ${put.status} ${t}`);
  }

  // 3) Create UGC post
  const post = await liFetch(`${LI_API}/ugcPosts`, accessToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      author: actorUrn,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text: caption || "" },
          shareMediaCategory: "IMAGE",
          media: [{ status: "READY", media: asset }],
        },
      },
      visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
    }),
  });

  const urn = (post?.id ?? post?.urn ?? asset) as string;
  return { remoteId: urn };
}

// Optional default export so TS/Next treats this file as a module in all configs:
export default { publishLinkedIn };
