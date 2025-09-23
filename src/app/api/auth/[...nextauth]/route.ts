import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const { GET, POST } = NextAuth({
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
});
