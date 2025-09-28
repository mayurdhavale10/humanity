export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const session = (await getServerSession(authOptions as any)) as Session | null;
  return <DashboardClient session={session} />;
}
