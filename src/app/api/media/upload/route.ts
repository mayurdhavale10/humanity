// src/app/api/media/upload/route.ts
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";

export async function POST(_req: NextRequest) {
  // placeholder upload handler — replace later
  return NextResponse.json({ ok: true });
}

// (optional) avoid accidental GET calls showing as errors
export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
