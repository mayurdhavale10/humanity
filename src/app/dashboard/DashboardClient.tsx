"use client";

import type { Session } from "next-auth";
import { signIn, signOut } from "next-auth/react";
import Link from "next/link";
import HeroSection from "@/components/landing/HeroSection";

export default function DashboardClient({ session }: { session: Session | null }) {
  const email = session?.user?.email ?? "";

  return (
    <main style={{ padding: "24px 16px" }}>
      {/* Light-touch header; lets your navbar / globals style the page */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <h1 style={{ margin: 0, fontWeight: 800 }}>Dashboard</h1>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {email ? <span style={{ opacity: 0.85 }}>{email}</span> : null}
          {session ? (
            <button onClick={() => signOut({ callbackUrl: "/" })}>Sign out</button>
          ) : (
            <button
              onClick={() =>
                signIn("credentials", { email: "demo@local.dev", callbackUrl: "/dashboard" })
              }
            >
              Continue as demo@local.dev
            </button>
          )}
          <Link href="/composer">Open Composer</Link>
        </div>
      </div>

      {/* If not signed in, a small hint (inherits your styles) */}
      {!session ? (
        <div style={{ marginTop: 12, opacity: 0.9 }}>
          <strong>Tip:</strong> Sign in (demo is fine) to see your scheduled posts and use the Composer.
        </div>
      ) : null}

      {/* Reuse your landing hero as-is */}
      <section style={{ marginTop: 16 }}>
        <HeroSection />
      </section>

      {/* Quick links (kept simple so your theme controls look/feel) */}
      <section style={{ marginTop: 24, display: "grid", gap: 12 }}>
        <SmallCard
          title="Create a Post"
          body="Open the Composer to schedule or launch content to Instagram, LinkedIn, and X."
          href="/composer"
        />
        <SmallCard title="View Queue" body="See upcoming and past posts." href="/dashboard/queue" />
        <SmallCard title="Calendar" body="See your posting calendar." href="/dashboard/calendar" />
      </section>
    </main>
  );
}

function SmallCard({ title, body, href }: { title: string; body: string; href: string }) {
  return (
    <div style={{ padding: 12, borderRadius: 8, border: "1px solid rgba(0,0,0,.08)" }}>
      <div style={{ fontWeight: 700 }}>{title}</div>
      <div style={{ opacity: 0.85, margin: "6px 0 10px" }}>{body}</div>
      <Link href={href}>Open</Link>
    </div>
  );
}
