import { NextResponse } from "next/server";
import { publishQueue } from "@/lib/queue";

export async function POST() {
  await publishQueue.add("publish-now", { demo: true }, { removeOnComplete: true });
  return NextResponse.json({ ok: true });
}
