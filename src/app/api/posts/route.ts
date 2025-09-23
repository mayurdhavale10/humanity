// src/app/api/posts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongo";
import PlannedPost from "@/models/PlannedPost";

export async function GET(_req: NextRequest) {
  await dbConnect();
  const posts = await PlannedPost.find().sort({ scheduledAt: 1 }).lean();
  return NextResponse.json(posts);
}

export async function POST(req: NextRequest) {
  await dbConnect();
  const data = await req.json();
  const post = await PlannedPost.create(data);
  return NextResponse.json(post, { status: 201 });
}
