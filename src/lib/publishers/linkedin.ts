// src/lib/publishers/linkedin.ts
export type PublishLinkedInInput = {
  accessToken: string;           // from SocialProvider(accessToken)
  actorUrn: string;              // from SocialProvider.meta.actorUrn (e.g., "urn:li:person:xxxx")
  caption: string;
  imageUrl?: string;             // optional: if provided we'll upload & attach
};

/**
 * Registers an image upload with LinkedIn and returns { uploadUrl, asset }
 */
async function registerImageUpload(ownerUrn: string, accessToken: string) {
  const res = await fetch("https://api.linkedin.com/v2/assets?action=registerUpload", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      registerUploadRequest: {
        recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
        owner: ownerUrn,
        serviceRelationships: [
          { relationshipType: "OWNER", identifier: "urn:li:userGeneratedContent" }
        ],
      },
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = body?.message || JSON.stringify(body);
    throw new Error(`LinkedIn registerUpload failed: ${msg}`);
  }
  const uploadMechanism = body?.value?.uploadMechanism;
  const uploadUrl = uploadMechanism?.["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"]?.uploadUrl;
  const asset = body?.value?.asset;
  if (!uploadUrl || !asset) throw new Error("LinkedIn registerUpload missing uploadUrl/asset");
  return { uploadUrl, asset };
}

/**
 * Downloads the image and uploads to LinkedIn uploadUrl
 */
async function uploadImageToLinkedIn(uploadUrl: string, imageUrl: string) {
  const img = await fetch(imageUrl);
  if (!img.ok) throw new Error(`Failed to fetch image: HTTP ${img.status}`);
  const buff = await img.arrayBuffer();

  const put = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": "application/octet-stream" },
    body: Buffer.from(buff),
  });
  if (!put.ok) {
    const txt = await put.text().catch(() => "");
    throw new Error(`LinkedIn image upload failed: HTTP ${put.status} ${txt}`);
  }
}

/**
 * Creates a UGC post. If asset is provided, attaches image.
 * Returns the created post URN/id.
 */
async function createUgcPost(authorUrn: string, accessToken: string, caption: string, asset?: string) {
  const body: any = {
    author: authorUrn,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: { text: caption || "" },
        shareMediaCategory: asset ? "IMAGE" : "NONE",
        ...(asset
          ? { media: [{ status: "READY", media: asset }] }
          : {}),
      },
    },
    visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
  };

  const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json?.message || JSON.stringify(json);
    throw new Error(`LinkedIn post failed: ${msg}`);
  }
  return json?.id || json?.urn || null;
}

/**
 * High-level publish (text or image+text).
 * Returns { id } (LinkedIn post URN/id).
 */
export async function publishToLinkedIn(input: PublishLinkedInInput) {
  const { accessToken, actorUrn, caption, imageUrl } = input;

  // TEXT-ONLY:
  if (!imageUrl) {
    const id = await createUgcPost(actorUrn, accessToken, caption);
    return { id };
  }

  // IMAGE FLOW:
  const { uploadUrl, asset } = await registerImageUpload(actorUrn, accessToken);
  await uploadImageToLinkedIn(uploadUrl, imageUrl);
  const id = await createUgcPost(actorUrn, accessToken, caption, asset);
  return { id };
}
