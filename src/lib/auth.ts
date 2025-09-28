// src/lib/auth.ts
import { getServerSession } from "next-auth";
import type { DefaultSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";

// Narrow, safe shape for what we actually use from the session
type SessionLike = Pick<DefaultSession, "user"> | null;

/**
 * Return the signed-in user's email from the NextAuth session, or "" if none.
 */
export async function getUserEmailFromSession(): Promise<string> {
  const session = (await getServerSession(authOptions as any)) as SessionLike;
  return session?.user?.email ? String(session.user.email).trim() : "";
}

/**
 * Dual-mode resolver:
 * - If useDemo === true -> return DEMO_USER_EMAIL (preconnected account)
 * - Else -> return the signed-in user's email from session
 * - Else -> if fallbackBodyEmail provided, return that
 * - Else -> throw
 */
export async function getEffectiveEmail(options?: {
  useDemo?: boolean;
  fallbackBodyEmail?: string;
}): Promise<string> {
  const DEMO_EMAIL = process.env.DEMO_USER_EMAIL || "demo@local.dev";

  if (options?.useDemo) return DEMO_EMAIL;

  const sessionEmail = await getUserEmailFromSession();
  if (sessionEmail) return sessionEmail;

  if (options?.fallbackBodyEmail?.trim()) {
    return options.fallbackBodyEmail.trim();
  }

  throw new Error("No authenticated user and demo mode not requested.");
}

/**
 * Require a signed-in (non-demo) user; throws if not present.
 */
export async function requireSessionEmail(): Promise<string> {
  const email = await getUserEmailFromSession();
  if (!email) throw new Error("Not authenticated.");
  return email;
}
