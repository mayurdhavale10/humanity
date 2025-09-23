// src/app/api/schedule/next/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ ok: true, hint: "stub for build" });
}
