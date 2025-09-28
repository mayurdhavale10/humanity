"use client";

import type { Session } from "next-auth";

export default function DashboardClient({ session }: { session: Session | null }) {
  return (
    <main style={{ color: "#fff", padding: 24 }}>
      <h1>Dashboard</h1>
      <pre>{JSON.stringify(session, null, 2)}</pre>
    </main>
  );
}
