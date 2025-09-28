// src/components/composer/Composer.tsx
"use client";

import { useState } from "react";
import { useSession, signIn } from "next-auth/react";
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

  // Gate: require sign-in (demo button provided)
  if (status !== "authenticated") {
    return (
      <main style={{ padding: 24, color: "#fff", minHeight: "100vh", background: "#8B6B7A" }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900 }}>Login to continue</h1>
        <p style={{ opacity: 0.9, marginTop: 8 }}>
          Use the demo button below or sign in with any email on the NextAuth page.
        </p>
        <button
          onClick={() =>
            signIn("credentials", {
              email: "demo@local.dev",
              callbackUrl: "/composer",
            })
          }
          style={{
            marginTop: 12,
            padding: "10px 14px",
            borderRadius: 8,
            border: "1px solid rgba(255,255,255,.25)",
            background: "rgba(0,0,0,.25)",
            color: "#fff",
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          Continue as demo@local.dev
        </button>
        <div style={{ opacity: 0.8, marginTop: 10, fontSize: 13 }}>
          Or open <code>/api/auth/signin</code> to enter another email.
        </div>
      </main>
    );
  }

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
        userEmail: email,            // server will ignore if useDemo=true
        platforms,                   // UPPERCASE already
        status: "QUEUED",
        kind: "IMAGE",
        caption,
        media: { imageUrl },
        scheduledAt,
        useDemo,                     // ✅ NEW
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

  // Launch quick → always uses demo endpoint (your recruiter flow)
  async function launchQuick() {
    setSaving(true);
    setMessage(null);
    try {
      if (!imageUrl) throw new Error("Add an image (upload or paste URL)");
      if (!platforms.length) throw new Error("Pick at least one platform");

      const res = await fetch("/api/demo/launch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platforms, imageUrl, caption }), // demo endpoint publishes immediately
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

  return (
    <main
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "32px 24px",
        minHeight: "100vh",
        backgroundColor: "#8B6B7A",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
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
            fontSize: "16px",
            color: "rgba(255,255,255,0.8)",
            margin: "8px 0 0 0",
            fontWeight: 500,
          }}
        >
          Create and schedule content across your social platforms
        </p>
      </div>

      {/* Main Form */}
      <form
        onSubmit={submit}
        style={{
          backgroundColor: "#B5979A",
          borderRadius: "12px",
          padding: "32px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.25), 0 2px 6px rgba(0,0,0,0.15)",
          border: "1px solid rgba(255,255,255,0.08)",
          display: "grid",
          gap: "24px",
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

        {/* NEW: Use Demo toggle */}
        <label
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            color: "#fff",
            fontWeight: 600,
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
        <div style={{ display: "grid", gap: "16px" }}>
          <ActionButtons
            onSubmit={submit}
            onLaunchQuick={launchQuick}
            saving={saving}
            uploading={uploading}
          />

          {/* Verification Links */}
          <aside
            style={{
              marginTop: "4px",
              padding: "14px 16px",
              backgroundColor: "rgba(0,0,0,0.22)",
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.9)",
            }}
          >
            <div
              style={{
                fontSize: "14px",
                fontWeight: 700,
                marginBottom: "6px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span>Verify automation</span>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  padding: "2px 6px",
                  borderRadius: "4px",
                  background: "rgba(255,255,255,0.12)",
                }}
              >
                Demo
              </span>
            </div>
            <div
              style={{
                fontSize: "13px",
                lineHeight: 1.5,
                marginBottom: "8px",
                color: "rgba(255,255,255,0.85)",
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
                gap: "6px",
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
                    gap: "8px",
                    padding: "6px 8px",
                    borderRadius: "6px",
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
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 4 }}>
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
                    gap: "8px",
                    padding: "6px 8px",
                    borderRadius: "6px",
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    marginTop: "6px",
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
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 4 }}>
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
                    gap: "8px",
                    padding: "6px 8px",
                    borderRadius: "6px",
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    marginTop: "6px",
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
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 4 }}>
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
          marginTop: "24px",
          padding: "16px",
          backgroundColor: "rgba(255,255,255,0.1)",
          borderRadius: "8px",
          fontSize: "14px",
          color: "rgba(255,255,255,0.7)",
          fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", monospace',
        }}
      >
        <strong>Tip:</strong>{" "}
        <code>{plannedPostsTipHref}</code> and{" "}
        <code>/api/cron/run?secret=***</code> logs to see QUEUED ➜ PUBLISHED.
      </div>
    </main>
  );
}
