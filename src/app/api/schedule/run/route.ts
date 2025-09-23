import { NextResponse } from "next/server";
import { getPublishQueue } from "@/lib/queue";

export async function POST() {
  const q = getPublishQueue(); // may be null during build or if REDIS_URL missing
  if (!q) {
    return NextResponse.json(
      { ok: false, queued: false, reason: "queue disabled" },
      { status: 202 }
    );
  }

  await q.add("publish-now", { demo: true }, { removeOnComplete: true });
  return NextResponse.json({ ok: true, queued: true });
}
