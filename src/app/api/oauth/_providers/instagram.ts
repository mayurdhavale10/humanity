// src/app/api/oauth/_providers/instagram.ts

// Dev: localhost; Prod: set NEXT_PUBLIC_BASE_URL to your Vercel URL
const base = (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const redirectUri = `${base}/api/oauth/instagram/connect`;

const cfg = {
  clientId: process.env.IG_APP_ID!,           // 1485973109193438
  clientSecret: process.env.IG_APP_SECRET!,   // 2117f81a...

  // Instagram OAuth always runs through Facebook dialog
  authUrl: "https://www.facebook.com/v19.0/dialog/oauth",
  tokenUrl: "https://graph.facebook.com/v19.0/oauth/access_token",

  // ✅ Minimal required scope for Instagram Basic Display
  scopes: [
    "instagram_basic",
  ],

  // 🔮 Later you can add more for posting/insights once App Review is done:
  // scopes: [
  //   "instagram_basic",
  //   "pages_show_list",
  //   "instagram_manage_pages",
  //   "instagram_content_publish",
  // ],

  redirectUri,
  pkce: false,              // IG doesn’t support PKCE in this flow
  clientAuth: "body" as const, // send client_id/secret in request body
};

export default cfg;
