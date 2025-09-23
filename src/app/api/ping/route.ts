export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongo";

export async function GET() {
  await dbConnect();
  return NextResponse.json({ ok: true });
}
