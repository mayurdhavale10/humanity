const base =
  (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const redirectUri = `${base}/api/oauth/linkedin/connect`;

const cfg = {
  clientId: process.env.LINKEDIN_CLIENT_ID!,
  clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
  authUrl: "https://www.linkedin.com/oauth/v2/authorization",
  tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
  // Add/remove w_member_social depending on whether you’ll post content
  scopes: ["openid", "profile", "email", "w_member_social"],
  redirectUri,                  // must exactly match in LinkedIn app settings
  pkce: false,                  // confidential app
  clientAuth: "body" as const,  // LinkedIn accepts client_secret in body
};
export default cfg;


