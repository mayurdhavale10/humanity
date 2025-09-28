"use client";

import type { Session } from "next-auth";
import { signIn, signOut } from "next-auth/react";
import Link from "next/link";
import HeroSection from "@/components/landing/HeroSection";

export default function DashboardClient({ session }: { session: Session | null }) {
  const email = session?.user?.email ?? "";

  return (
    <main
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "32px 24px",
        minHeight: "100vh",
        background: "#0B0B10",
        color: "#fff",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <h1 style={{ margin: 0, fontWeight: 900 }}>Dashboard</h1>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {email ? <span style={{ opacity: 0.9 }}>{email}</span> : null}
          {session ? (
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              style={btn()}
            >
              Sign out
            </button>
          ) : (
            <button
              onClick={() =>
                signIn("credentials", {
                  email: "demo@local.dev",
                  callbackUrl: "/dashboard",
                })
              }
              style={btn()}
            >
              Continue as demo@local.dev
            </button>
          )}
          <Link href="/composer" style={btn({ bg: "#6C5CE7" })}>
            Open Composer
          </Link>
        </div>
      </header>

      {/* If not signed in, show a friendly prompt */}
      {!session ? (
        <div
          style={{
            padding: 16,
            borderRadius: 8,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            marginBottom: 24,
          }}
        >
          <strong>Tip:</strong> Sign in (demo is fine) to see your scheduled posts
          and use the Composer.
        </div>
      ) : null}

      {/* Reuse your landing hero content here */}
      <section style={{ marginTop: 8, marginBottom: 24 }}>
        <HeroSection />
      </section>

      {/* Quick links */}
      <section
        style={{
          display: "grid",
          gap: 16,
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        }}
      >
        <Card
          title="Create a Post"
          body="Open the Composer to schedule or launch content to Instagram, LinkedIn, and X."
          href="/composer"
          cta="Go to Composer"
        />
        <Card
          title="View Queue"
          body="See upcoming and past posts, with statuses and platforms."
          href="/dashboard/queue"
          cta="Open Queue"
        />
        <Card
          title="Calendar"
          body="Look at your posting calendar and upcoming scheduled items."
          href="/dashboard/calendar"
          cta="Open Calendar"
        />
      </section>
    </main>
  );
}

function btn(opts?: { bg?: string }) {
  return {
    padding: "10px 14px",
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,.18)",
    background: opts?.bg ?? "rgba(255,255,255,.08)",
    color: "#fff",
    fontWeight: 700,
    textDecoration: "none",
  } as const;
}

function Card({
  title,
  body,
  href,
  cta,
}: {
  title: string;
  body: string;
  href: string;
  cta: string;
}) {
  return (
    <div
      style={{
        padding: 16,
        borderRadius: 12,
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.12)",
      }}
    >
      <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 6 }}>{title}</div>
      <div style={{ opacity: 0.85, marginBottom: 12 }}>{body}</div>
      <Link href={href} style={btn({ bg: "#6C5CE7" })}>
        {cta}
      </Link>
    </div>
  );
}
