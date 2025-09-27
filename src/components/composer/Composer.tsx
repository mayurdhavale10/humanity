// src/components/composer/Composer.tsx
"use client";

import { useState } from "react";
import ImageUpload from "./ImageUpload";
import CaptionEditor from "./CaptionEditor";
import ScheduleInput from "./ScheduleInput";
import PlatformToggles from "./PlatformToggles";
import ActionButtons from "./ActionButtons";
import StatusMessage from "./StatusMessage";

export type Platform = "INSTAGRAM" | "LINKEDIN" | "X";

function toUTCISOStringLocal(dateTimeLocal: string) {
  const d = new Date(dateTimeLocal);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString();
}

// Build absolute URL to public sample image
const BASE =
  (process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/+$/, "") as string) || "";
const SAMPLE_IMG = `${BASE}/samples/dummy_post.png`;

export default function Composer() {
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

  const email = "demo@local.dev"; // TODO: replace with NextAuth session email

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
    setPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  }

  // Normal schedule flow (cron will pick it up)
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      if (!imageUrl) throw new Error("Add an image (upload or paste URL)");
      const scheduledAt = toUTCISOStringLocal(when);
      const body = {
        userEmail: email,
        platforms, // <-- stays UPPERCASE as selected
        status: "QUEUED",
        kind: "IMAGE",
        caption,
        media: { imageUrl },
        scheduledAt,
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

  // Launch quick (server proxy calls run-now)
  async function launchQuick() {
    setSaving(true);
    setMessage(null);
    try {
      if (!imageUrl) throw new Error("Add an image (upload or paste URL)");
      const platform = platforms[0] || "INSTAGRAM";
      const res = await fetch("/api/demo/launch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, imageUrl, caption }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to launch");
      setMessage(`✅ Launched now (publishId: ${data.publishId || "ok"})`);
    } catch (e: any) {
      setMessage(`❌ ${e.message || e}`);
    } finally {
      setSaving(false);
    }
  }

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

      {/* Main Form Container */}
      <form
        onSubmit={submit}
        style={{
          backgroundColor: "#B5979A",
          borderRadius: "12px",
          padding: "32px",
          boxShadow:
            "0 10px 30px rgba(0,0,0,0.25), 0 2px 6px rgba(0,0,0,0.15)",
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

        <PlatformToggles
          platforms={platforms}
          onTogglePlatform={togglePlatform}
        />

        <ActionButtons
          onSubmit={submit}
          onLaunchQuick={launchQuick}
          saving={saving}
          uploading={uploading}
        />

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
        <strong>Tip:</strong> Watch{" "}
        <code
          style={{
            backgroundColor: "rgba(0,0,0,0.2)",
            padding: "2px 6px",
            borderRadius: "4px",
          }}
        >
          /api/planned-posts?email=demo@local.dev
        </code>{" "}
        and{" "}
        <code
          style={{
            backgroundColor: "rgba(0,0,0,0.2)",
            padding: "2px 6px",
            borderRadius: "4px",
          }}
        >
          /api/cron/run?secret=***
        </code>{" "}
        logs to see QUEUED ➜ PUBLISHED.
      </div>
    </main>
  );
}
