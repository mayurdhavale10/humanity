// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
// };

// export default nextConfig;

// next.config.ts
import type { NextConfig } from "next";
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },  // ⬅️ skip ESLint in prod builds
};
export default nextConfig;