export default {
  clientId: process.env.X_CLIENT_ID!,          // must be defined
  clientSecret: process.env.X_CLIENT_SECRET!,  // must be defined
  authUrl: "https://twitter.com/i/oauth2/authorize",
  tokenUrl: "https://api.x.com/2/oauth2/token",  // ← try api.x.com (new host)
  scopes: ["tweet.read", "users.read"],          // keep read-only for now
  redirectUri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/oauth/x/connect`,
  pkce: true,
  clientAuth: "basic" as const,                  // ← REQUIRED for X
};
