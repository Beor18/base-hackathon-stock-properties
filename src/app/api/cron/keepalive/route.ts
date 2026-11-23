import { connection } from "next/server";

import { pingStore } from "@/server/clients/store";
import { respond } from "@/server/http";

/**
 * GET /api/cron/keepalive: run daily by Vercel Cron (vercel.json). One tiny read keeps the free
 * Supabase project from pausing after a week without traffic, which would break broker links.
 */
export async function GET() {
  await connection();
  return respond(async () => {
    await pingStore();
    return { ok: true };
  });
}
