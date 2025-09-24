const base = (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const redirectUri = `${base}/api/oauth/instagram/connect`;

const cfg = {
  clientId: process.env.IG_APP_ID!,
  clientSecret: process.env.IG_APP_SECRET!,
  authUrl: "https://www.facebook.com/v19.0/dialog/oauth",
  tokenUrl: "https://graph.facebook.com/v19.0/oauth/access_token",
  scopes: [
    "pages_show_list",
    "instagram_basic",
    "instagram_manage_pages",
    // add when ready to publish (works for app roles in Dev):
    // "instagram_content_publish",
  ],
  redirectUri,
  pkce: false,
  clientAuth: "body" as const,
};
export default cfg;
