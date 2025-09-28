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
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
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
              width={220}    // ↑ bigger logo
              height={64}
              priority
              style={{ height: 64, width: "auto", objectFit: "contain", borderRadius: 8 }}
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
                style={glassBtn()} // neutral (no purple glow)
                title="Sign in quickly with a demo account"
              >
                Continue as demo@local.dev
              </button>
            )}

            <Link href="/composer" style={glassBtn()}>
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
      </div>
    </main>
  );
}

/* ----------------------- styles ----------------------- */

function glassBtn() {
  return {
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.22)",
    background: "linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0.08))",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    color: "#fff",
    fontWeight: 800,
    textDecoration: "none",
    // neutral shadow (no purple glow)
    boxShadow: "0 6px 20px rgba(0,0,0,0.18)",
    transition: "transform .08s ease, box-shadow .15s ease, border-color .2s ease",
    cursor: "pointer",
  } as const;
}

function glassCard() {
  return {
    padding: 16,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.22)",
    background: "linear-gradient(180deg, rgba(255,255,255,0.14), rgba(255,255,255,0.06))",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    color: "inherit",
    boxShadow: "0 10px 28px rgba(0,0,0,0.2)",
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
      <Link href={href} style={glassBtn()}>
        {cta}
      </Link>
    </div>
  );
}
