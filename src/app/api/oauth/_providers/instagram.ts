const redirectUri = "http://localhost:3000/api/oauth/instagram/connect";

export default {
  clientId: process.env.IG_APP_ID!,
  clientSecret: process.env.IG_APP_SECRET!,
  authUrl: "https://www.facebook.com/v19.0/dialog/oauth",
  tokenUrl: "https://graph.facebook.com/v19.0/oauth/access_token",
  scopes: [
    "public_profile",
    "email",
    "pages_show_list",
    "pages_read_engagement",
    "instagram_basic"
  ],
  redirectUri,
  pkce: false,
  clientAuth: "body" as const,
};
