// src/app/composer/page.tsx
"use client";

import { useState } from "react";

type Platform = "INSTAGRAM";

function toUTCISOStringLocal(dateTimeLocal: string) {
  const d = new Date(dateTimeLocal);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString();
}

// Build absolute URL to public sample image
const BASE =
  (process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/+$/, "") as string) || "";
const SAMPLE_IMG = `${BASE}/samples/dummy_post.png`;

export default function ComposerPage() {
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
        platforms,
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
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Composer</h1>

      <form onSubmit={submit} className="space-y-4 border rounded-xl p-4">
        <div className="space-y-2">
          <label className="font-medium">Image</label>
          <div className="flex items-center gap-3">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
              disabled={uploading}
            />
            <span className="text-sm text-gray-500">or paste URL below</span>
          </div>
          <input
            className="w-full border rounded-md px-3 py-2"
            placeholder="https://example.com/image.jpg"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
          {imageUrl && (
            <img
              src={imageUrl}
              alt="preview"
              className="mt-2 max-h-56 rounded-md border object-contain"
            />
          )}
        </div>

        <div className="space-y-2">
          <label className="font-medium">Caption</label>
          <textarea
            className="w-full border rounded-md px-3 py-2"
            rows={4}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="font-medium">Schedule time</label>
          <input
            type="datetime-local"
            className="border rounded-md px-3 py-2"
            value={when}
            onChange={(e) => setWhen(e.target.value)}
          />
          <p className="text-xs text-gray-500">
            Stored as UTC automatically. Your local: {when.replace("T", " ")}.
          </p>
        </div>

        <div className="space-y-2">
          <label className="font-medium">Platforms</label>
          <div className="flex gap-4">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={platforms.includes("INSTAGRAM")}
                onChange={() => togglePlatform("INSTAGRAM")}
              />
              Instagram
            </label>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving || uploading}
            className="px-4 py-2 rounded-md bg-black text-white disabled:opacity-50"
          >
            {saving ? "Working..." : "Schedule"}
          </button>

          <button
            type="button"
            onClick={launchQuick}
            disabled={saving || uploading}
            className="px-4 py-2 rounded-md bg-indigo-600 text-white disabled:opacity-50"
            title="Create a post and publish immediately"
          >
            {saving ? "Working..." : "Launch quick (demo)"}
          </button>

          {message && <span className="text-sm">{message}</span>}
        </div>
      </form>

      <div className="text-sm">
        Tip: watch <code>/api/planned-posts?email=demo@local.dev</code> and{" "}
        <code>/api/cron/run?secret=***</code> logs to see QUEUED ➜ PUBLISHED.
      </div>
    </main>
  );
}
