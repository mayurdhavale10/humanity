// src/app/api/oauth/_providers/instagram.ts
const base = (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const redirectUri = `${base}/api/oauth/instagram/connect`;

export default {
  clientId: process.env.IG_APP_ID!,
  clientSecret: process.env.IG_APP_SECRET!,
  authUrl: "https://www.facebook.com/v19.0/dialog/oauth",
  tokenUrl: "https://graph.facebook.com/v19.0/oauth/access_token",
  scopes: [
    "instagram_basic",
    "pages_show_list",
    "pages_read_engagement",
    "pages_manage_metadata",
    "instagram_content_publish" // required to publish
  ],
  redirectUri,
  pkce: false,
  clientAuth: "body" as const,
};
