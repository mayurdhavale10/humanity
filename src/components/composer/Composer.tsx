// src/components/composer/Composer.tsx
"use client";

import { useState } from "react";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import ImageUpload from "./ImageUpload";
import CaptionEditor from "./CaptionEditor";
import ScheduleInput from "./ScheduleInput";
import PlatformToggles from "./PlatformToggles";
import ActionButtons from "./ActionButtons";
import StatusMessage from "./StatusMessage";
import ConnectAccounts from "@/components/account/ConnectAccounts";

export type Platform = "INSTAGRAM" | "LINKEDIN" | "X";

function toUTCISOStringLocal(dateTimeLocal: string) {
  const d = new Date(dateTimeLocal);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString();
}

const BASE = (process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/+$/, "") as string) || "";
const SAMPLE_IMG = `${BASE}/samples/dummy_post.png`;

export default function Composer() {
  const { data: session, status } = useSession();
  const email = session?.user?.email || "";

  const [caption, setCaption] = useState("Hello from Humanity 🚀");
  const [imageUrl, setImageUrl] = useState(SAMPLE_IMG);
  const [uploading, setUploading] = useState(false);
  const [platforms, setPlatforms] = useState<Platform[]>(["INSTAGRAM"]);
  const [when, setWhen] = useState<string>(() => {
    const d = new Date(Date.now() + 5 * 60 * 1000);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}`;
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // NEW: Use demo accounts toggle
  const [useDemo, setUseDemo] = useState(false);

  async function handleUpload(file: File) {
    setUploading(true);
    setMessage(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/media/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Upload failed");
      if (!data?.url) throw new Error("Upload did not return a URL");
      setImageUrl(data.url);
      setMessage("✅ Uploaded");
    } catch (e: any) {
      setMessage(`❌ ${e.message || e}`);
    } finally {
      setUploading(false);
    }
  }

  function togglePlatform(p: Platform) {
    setPlatforms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  }

  // Schedule → /api/planned-posts (includes useDemo)
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      if (!imageUrl) throw new Error("Add an image (upload or paste URL)");
      const scheduledAt = toUTCISOStringLocal(when);
      const body = {
        userEmail: email,
        platforms,
        status: "QUEUED",
        kind: "IMAGE",
        caption,
        media: { imageUrl },
        scheduledAt,
        useDemo,
      };
      const res = await fetch("/api/planned-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to create planned post");
      setMessage("✅ Scheduled! It will be picked up by the cron runner.");
    } catch (e: any) {
      setMessage(`❌ ${e.message || e}`);
    } finally {
      setSaving(false);
    }
  }

  // Launch quick → demo endpoint publishes immediately
  async function launchQuick() {
    setSaving(true);
    setMessage(null);
    try {
      if (!imageUrl) throw new Error("Add an image (upload or paste URL)");
      if (!platforms.length) throw new Error("Pick at least one platform");

      const res = await fetch("/api/demo/launch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platforms, imageUrl, caption }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to launch");

      const ids = data.publishIds
        ? Object.entries(data.publishIds)
            .map(([k, v]) => `${k}:${v as string}`)
            .join(", ")
        : data.publishId || "ok";

      setMessage(`✅ Launched now → ${ids}`);
    } catch (e: any) {
      setMessage(`❌ ${e.message || e}`);
    } finally {
      setSaving(false);
    }
  }

  const plannedPostsTipHref = useDemo
    ? `/api/planned-posts?demo=1`
    : `/api/planned-posts?email=${encodeURIComponent(email || "demo@local.dev")}`;

  /* ============ COMMON STYLES (for reuse) ============ */
  const pageWrap: React.CSSProperties = {
    backgroundColor: "#8B6B7A", // Deep Mauve
    minHeight: "100vh",
  };
  const container: React.CSSProperties = {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "24px 16px",
  };
  const glassBtn: React.CSSProperties = {
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.25)",
    background: "linear-gradient(180deg, rgba(255,255,255,0.20), rgba(255,255,255,0.10))",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    color: "#fff",
    fontWeight: 800,
    textDecoration: "none",
    boxShadow: "0 6px 20px rgba(0,0,0,0.18)",
    transition: "transform .08s ease, box-shadow .15s ease, border-color .2s ease",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
  };
  const primaryLink: React.CSSProperties = {
    padding: "8px 12px",
    borderRadius: 10,
    color: "rgba(255,255,255,0.92)",
    fontWeight: 800,
    textDecoration: "none",
    transition: "background-color .15s ease",
  };

  /* ============ UNAUTH VIEW ============ */
  if (status !== "authenticated") {
    return (
      <main style={pageWrap}>
        {/* Sticky navbar */}
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 40,
            borderBottom: "1px solid rgba(255,255,255,0.15)",
            background: "rgba(139, 107, 122, 0.9)", // #8B6B7A / 90%
            backdropFilter: "blur(12px)",
          }}
        >
          <div style={{ ...container, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Image
                src="/Humanity_founderslogo.webp"
                alt="Humanity"
                width={160}
                height={44}
                priority
                style={{ height: 44, width: "auto", borderRadius: 8, objectFit: "contain" }}
              />
            </Link>

            {/* Home · Services · Contact Us */}
            <nav style={{ display: "none", gap: 8, alignItems: "center" } as React.CSSProperties}>
              {/* display none on tiny screens; feel free to enhance with a burger later */}
            </nav>
            <nav style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <Link href="/" style={primaryLink}>Home</Link>
              <Link href="/#services" style={primaryLink}>Services</Link>
              <Link href="/#contact" style={primaryLink}>Contact&nbsp;Us</Link>
            </nav>
          </div>
        </header>

        <div style={container}>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: "#fff", textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}>
            Login to continue
          </h1>
          <p style={{ opacity: 0.9, marginTop: 8, color: "#fff" }}>
            Use the demo button below or sign in with any email on the NextAuth page.
          </p>

          <button
            onClick={() =>
              signIn("credentials", {
                email: "demo@local.dev",
                callbackUrl: "/composer",
              })
            }
            style={{ ...glassBtn, marginTop: 12 }}
          >
            Continue as demo@local.dev
          </button>

          <div style={{ opacity: 0.8, marginTop: 10, fontSize: 13, color: "rgba(255,255,255,0.85)" }}>
            Or open <code>/api/auth/signin</code> to enter another email.
          </div>
        </div>
      </main>
    );
  }

  /* ============ AUTH VIEW ============ */
  return (
    <main style={pageWrap}>
      {/* Sticky navbar */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          borderBottom: "1px solid rgba(255,255,255,0.15)",
          background: "rgba(139, 107, 122, 0.9)", // #8B6B7A / 90%
          backdropFilter: "blur(12px)",
        }}
      >
        <div style={{ ...container, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Image
              src="/Humanity_founderslogo.webp"
              alt="Humanity"
              width={160}
              height={44}
              priority
              style={{ height: 44, width: "auto", borderRadius: 8, objectFit: "contain" }}
            />
          </Link>

          {/* Home · Services · Contact Us */}
          <nav style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Link href="/" style={primaryLink}>Home</Link>
            <Link href="/#services" style={primaryLink}>Services</Link>
            <Link href="/#contact" style={primaryLink}>Contact&nbsp;Us</Link>
          </nav>
        </div>
      </header>

      <div style={container}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1
            style={{
              fontSize: "clamp(28px, 4vw, 48px)",
              fontWeight: 900,
              color: "#FFFFFF",
              letterSpacing: "-0.02em",
              textShadow: "0 2px 4px rgba(0,0,0,0.8)",
              fontFamily: "system-ui, -apple-system, sans-serif",
              margin: 0,
            }}
          >
            Compose Your Post
          </h1>
          <p
            style={{
              fontSize: 16,
              color: "rgba(255,255,255,0.85)",
              margin: "8px 0 0 0",
              fontWeight: 600,
            }}
          >
            Create and schedule content across your social platforms
          </p>
        </div>

        {/* Main Form */}
        <form
          onSubmit={submit}
          style={{
            backgroundColor: "#B5979A", // Dusty Rose
            borderRadius: 12,
            padding: 24,
            boxShadow: "0 10px 30px rgba(0,0,0,0.25), 0 2px 6px rgba(0,0,0,0.15)",
            border: "1px solid rgba(255,255,255,0.10)",
            display: "grid",
            gap: 20,
          }}
        >
          <ImageUpload
            imageUrl={imageUrl}
            onImageUrlChange={setImageUrl}
            onUpload={handleUpload}
            uploading={uploading}
          />

          <CaptionEditor caption={caption} onCaptionChange={setCaption} />

          <ScheduleInput when={when} onWhenChange={setWhen} />

          <PlatformToggles platforms={platforms} onTogglePlatform={togglePlatform} />

          {/* Connect / OAuth */}
          <ConnectAccounts />

          {/* Use Demo toggle */}
          <label
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              color: "#fff",
              fontWeight: 700,
            }}
          >
            <input
              type="checkbox"
              checked={useDemo}
              onChange={(e) => setUseDemo(e.target.checked)}
            />
            Use Demo Accounts (preconnected)
          </label>

          {/* Actions + links */}
          <div style={{ display: "grid", gap: 16 }}>
            <ActionButtons
              onSubmit={submit}
              onLaunchQuick={launchQuick}
              saving={saving}
              uploading={uploading}
            />

            {/* Verification Links */}
            <aside
              style={{
                marginTop: 4,
                padding: "14px 16px",
                backgroundColor: "rgba(0,0,0,0.22)",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.9)",
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  marginBottom: 6,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span>Verify automation</span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    padding: "2px 6px",
                    borderRadius: 4,
                    background: "rgba(255,255,255,0.15)",
                  }}
                >
                  Demo
                </span>
              </div>
              <div
                style={{
                  fontSize: 13,
                  lineHeight: 1.5,
                  marginBottom: 8,
                  color: "rgba(255,255,255,0.9)",
                }}
              >
                After you click <strong>Schedule Post</strong> or{" "}
                <strong>Launch Quick (Demo)</strong>, you can confirm the post on these profiles:
              </div>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  display: "grid",
                  gap: 6,
                }}
              >
                <li>
                  <a
                    href="https://www.instagram.com/_mmayurr/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "#fff",
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "6px 8px",
                      borderRadius: 6,
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.12)",
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "#E4405F",
                      }}
                    />
                    Instagram: _mmayurr <span aria-hidden style={{ opacity: 0.8, marginLeft: 4, fontSize: 12 }}>↗</span>
                  </a>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.78)", marginTop: 4 }}>
                    Click to see the automated post on your feed.
                  </div>
                </li>

                <li>
                  <a
                    href="https://www.linkedin.com/in/mayur-dhavale-b98584387/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "#fff",
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "6px 8px",
                      borderRadius: 6,
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      marginTop: 6,
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "#0A66C2",
                      }}
                    />
                    LinkedIn: mayur-dhavale-b98584387{" "}
                    <span aria-hidden style={{ opacity: 0.8, marginLeft: 4, fontSize: 12 }}>↗</span>
                  </a>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.78)", marginTop: 4 }}>
                    Click to verify the cross-post on your LinkedIn.
                  </div>
                </li>

                <li>
                  <a
                    href="https://x.com/Mayur_dhavalee"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "#fff",
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "6px 8px",
                      borderRadius: 6,
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      marginTop: 6,
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "#1D9BF0",
                      }}
                    />
                    X (Twitter): @Mayur_dhavalee{" "}
                    <span aria-hidden style={{ opacity: 0.8, marginLeft: 4, fontSize: 12 }}>↗</span>
                  </a>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.78)", marginTop: 4 }}>
                    Click to confirm the tweet was posted.
                  </div>
                </li>
              </ul>
            </aside>
          </div>

          <StatusMessage message={message} />
        </form>

        {/* Developer Tip */}
        <div
          style={{
            marginTop: 24,
            padding: 16,
            backgroundColor: "rgba(255,255,255,0.10)",
            borderRadius: 8,
            fontSize: 14,
            color: "rgba(255,255,255,0.75)",
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", monospace',
          }}
        >
          <strong>Tip:</strong>{" "}
          <code>{plannedPostsTipHref}</code> and{" "}
          <code>/api/cron/run?secret=***</code> logs to see QUEUED ➜ PUBLISHED.
        </div>
      </div>
    </main>
  );
}
