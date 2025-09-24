// src/app/api/oauth/_providers/instagram.ts
const base = (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const redirectUri = `${base}/api/oauth/instagram/connect`;

const cfg = {
  clientId: process.env.IG_APP_ID!,
  clientSecret: process.env.IG_APP_SECRET!,
  authUrl: "https://www.facebook.com/v19.0/dialog/oauth",
  tokenUrl: "https://graph.facebook.com/v19.0/oauth/access_token",
  // ✅ Valid, minimal set for IG Graph publishing in Dev (app roles)
  scopes: [
    "instagram_basic",
    "pages_show_list",
    "pages_read_engagement",   // helpful for page data reads
    "pages_manage_metadata",   // helpful for page token management
    "instagram_content_publish" // 👉 required for posting
  ],
  redirectUri,
  pkce: false,
  clientAuth: "body" as const,
};

export default cfg;
