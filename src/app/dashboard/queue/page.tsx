"use client";

import { useEffect, useState } from "react";

type Planned = {
  _id: string;
  userEmail: string;
  platforms: string[];
  status: "DRAFT" | "SCHEDULED" | "QUEUED" | "PUBLISHED" | "FAILED";
  kind: "TEXT" | "IMAGE" | "VIDEO";
  caption: string;
  media?: { imageUrl?: string; videoUrl?: string };
  scheduledAt?: string;
  publishedAt?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
};

export default function QueuePage() {
  const email = "demo@local.dev"; // TODO: derive from session
  const [rows, setRows] = useState<Planned[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/planned-posts?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load posts");
      setRows(data.posts || []);
    } catch (e: any) {
      setMsg(`❌ ${e.message || e}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 15000); // auto-refresh every 15s
    return () => clearInterval(t);
  }, []);

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Queue</h1>
        <button
          onClick={load}
          disabled={loading}
          className="px-3 py-2 rounded-md border"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {msg && <div className="text-sm">{msg}</div>}

      <div className="overflow-auto border rounded-xl">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2">When</th>
              <th className="text-left p-2">Status</th>
              <th className="text-left p-2">Caption</th>
              <th className="text-left p-2">Platforms</th>
              <th className="text-left p-2">Media</th>
              <th className="text-left p-2">Error</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r._id} className="border-t">
                <td className="p-2">
                  {r.scheduledAt ? new Date(r.scheduledAt).toLocaleString() : "—"}
                </td>
                <td className="p-2">
                  <span
                    className={`px-2 py-1 rounded ${
                      r.status === "PUBLISHED"
                        ? "bg-green-100 text-green-700"
                        : r.status === "FAILED"
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-50 text-yellow-800"
                    }`}
                  >
                    {r.status}
                  </span>
                  {r.publishedAt && (
                    <div className="text-xs text-gray-500">
                      pub: {new Date(r.publishedAt).toLocaleString()}
                    </div>
                  )}
                </td>
                <td className="p-2 max-w-[280px] truncate" title={r.caption}>
                  {r.caption}
                </td>
                <td className="p-2">{r.platforms.join(", ")}</td>
                <td className="p-2">
                  {r.media?.imageUrl ? (
                    <img
                      src={r.media.imageUrl}
                      alt=""
                      className="h-16 w-16 object-cover rounded border"
                    />
                  ) : (
                    "—"
                  )}
                </td>
                <td className="p-2 text-red-600">{r.error || "—"}</td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td className="p-4 text-center text-gray-500" colSpan={6}>
                  No posts yet — schedule one from the Composer.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-500">
        This view auto-refreshes every 15s. Publishing is driven by your cron runner.
      </p>
    </main>
  );
}
