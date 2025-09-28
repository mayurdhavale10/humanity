// src/app/api/auth/[...nextauth]/authOptions.ts (recommended path)
import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  providers: [
    Credentials({
      name: "Demo",
      credentials: { email: { label: "Email", type: "text" } },
      async authorize(credentials) {
        if (credentials?.email) return { id: "demo", email: credentials.email };
        return null;
      },
    }),
  ],
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
};
