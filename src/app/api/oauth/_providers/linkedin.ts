// src/app/api/oauth/_providers/linkedin.ts
const redirectUri = "http://localhost:3000/api/oauth/linkedin/connect";

export default {
  clientId: process.env.LINKEDIN_CLIENT_ID!,
  clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
  authUrl: "https://www.linkedin.com/oauth/v2/authorization",
  tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
  scopes: ["openid", "profile", "email", "w_member_social"], // keep or remove w_member_social as needed
  redirectUri, // hardcoded to avoid mismatch
  pkce: false, // confidential app
  clientAuth: "body" as const, // LinkedIn accepts client_secret in body
};
