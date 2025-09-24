export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongo";
import SocialProvider from "@/models/SocialProvider";

type ProviderDoc = {
  platform: string;
  userEmail: string;
  accessToken: string;
  accountRef?: string;
  meta?: Record<string, any>;
  expiresAt?: Date;
};

export async function GET() {
  try {
    await dbConnect();

    const userEmail = process.env.DEMO_USER_EMAIL || "demo@local.dev";

    // IMPORTANT: use findOne (not find) so TS knows it's a single doc
    const provider = (await SocialProvider.findOne({
      userEmail,
      platform: "INSTAGRAM",
    }).lean()) as ProviderDoc | null;

    if (!provider?.accessToken) {
      return NextResponse.json({ error: "No IG token saved for this user." }, { status: 400 });
    }

    const token = provider.accessToken;

    const [permsRes, pagesRes] = await Promise.all([
      fetch(`https://graph.facebook.com/v19.0/me/permissions?access_token=${encodeURIComponent(token)}`),
      fetch(`https://graph.facebook.com/v19.0/me/accounts?fields=id,name,access_token&access_token=${encodeURIComponent(token)}`),
    ]);

    const perms = await permsRes.json();
    const pages = await pagesRes.json();

    const granted = (perms?.data || []).filter((p: any) => p.status === "granted");
    const needed = [
      "instagram_basic",
      "pages_show_list",
      "pages_read_engagement",
      "pages_manage_metadata",
      "instagram_content_publish",
    ];
    const missing = needed.filter((s) => !granted.some((g: any) => g.permission === s));

    return NextResponse.json({ ok: true, granted, missing, pages });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "debug failed" }, { status: 500 });
  }
}
