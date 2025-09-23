const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
const redirectUri = new URL("/api/oauth/linkedin/connect", base).toString();

export default {
  clientId: process.env.LINKEDIN_CLIENT_ID!,
  clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
  authUrl: "https://www.linkedin.com/oauth/v2/authorization",
  tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
  scopes: ["openid", "profile", "email"], // add w_member_social later
  redirectUri,   // ← use the normalized value
  pkce: false,
  clientAuth: "body" as const,
};
