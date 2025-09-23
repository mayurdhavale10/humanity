const base =
  (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const redirectUri = `${base}/api/oauth/x/connect`;

const cfg = {
  clientId: process.env.X_CLIENT_ID!,          // required
  clientSecret: process.env.X_CLIENT_SECRET!,  // required
  authUrl: "https://twitter.com/i/oauth2/authorize",
  // If X changes the host again, try api.twitter.com; current is api.x.com:
  tokenUrl: "https://api.x.com/2/oauth2/token",
  scopes: ["tweet.read", "users.read"],        // keep read-only for now
  redirectUri,
  pkce: true,                                  // X requires PKCE
  clientAuth: "basic" as const,                // X requires Basic auth on token exchange
};
export default cfg;
