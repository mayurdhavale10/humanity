"use client";

import type { Session } from "next-auth";
import { signIn, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import HeroSection from "@/components/landing/HeroSection";

export default function DashboardClient({ session }: { session: Session | null }) {
  const email = session?.user?.email ?? "";

  return (
    <main style={{ padding: "24px 16px" }}>
      {/* Header with your logo instead of 'Dashboard' */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Image
            src="/Humanity_founderslogo.webp"
            alt="Humanity"
            width={160}
            height={48}
            priority
            style={{ height: 48, width: "auto", objectFit: "contain", borderRadius: 8 }}
          />
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {email ? <span style={{ opacity: 0.9 }}>{email}</span> : null}

          {session ? (
            <button onClick={() => signOut({ callbackUrl: "/" })} style={glassBtn()}>
              Sign out
            </button>
          ) : (
            <button
              onClick={() =>
                signIn("credentials", { email: "demo@local.dev", callbackUrl: "/dashboard" })
              }
              style={glassBtn({ accent: true })}
              title="Sign in quickly with a demo account"
            >
              Continue as demo@local.dev
            </button>
          )}

          <Link href="/composer" style={glassBtn({ accent: true })}>
            Open Composer
          </Link>
        </div>
      </header>

      {/* If not signed in, a small glassy tip card */}
      {!session ? (
        <div style={glassCard()}>
          <strong>Tip:</strong> Sign in (demo is fine) to see your scheduled posts and use the
          Composer.
        </div>
      ) : null}

      {/* Your landing hero, unchanged */}
      <section style={{ marginTop: 16, marginBottom: 24 }}>
        <HeroSection />
      </section>

      {/* Quick links in glassy cards */}
      <section
        style={{
          display: "grid",
          gap: 16,
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          alignItems: "stretch",
        }}
      >
        <Card
          title="Create a Post"
          body="Open the Composer to schedule or launch content to Instagram, LinkedIn, and X."
          href="/composer"
          cta="Open"
        />
        <Card
          title="View Queue"
          body="See upcoming and past posts."
          href="/dashboard/queue"
          cta="Open"
        />
        <Card
          title="Calendar"
          body="See your posting calendar."
          href="/dashboard/calendar"
          cta="Open"
        />
      </section>
    </main>
  );
}

/* ----------------------- styles ----------------------- */

function glassBtn(opts?: { accent?: boolean }) {
  return {
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.25)",
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0.08))",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    color: "#fff",
    fontWeight: 800,
    textDecoration: "none",
    boxShadow: "0 6px 24px rgba(0,0,0,0.15)",
    transition: "transform .08s ease, box-shadow .15s ease, border-color .2s ease",
    ...(opts?.accent
      ? {
          borderColor: "rgba(108, 92, 231, 0.55)",
          boxShadow: "0 8px 28px rgba(108,92,231,0.35)",
        }
      : null),
    cursor: "pointer",
  } as const;
}

function glassCard() {
  return {
    padding: 16,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.25)",
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.14), rgba(255,255,255,0.06))",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    color: "inherit",
    boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
  } as const;
}

/* ----------------------- card component ----------------------- */

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
    <div style={glassCard()}>
      <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 6 }}>{title}</div>
      <div style={{ opacity: 0.85, marginBottom: 12 }}>{body}</div>
      <Link href={href} style={glassBtn({ accent: true })}>
        {cta}
      </Link>
    </div>
  );
}
