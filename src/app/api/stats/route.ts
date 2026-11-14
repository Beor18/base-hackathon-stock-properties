import { connection } from "next/server";

import { respond } from "@/server/http";
import { getProtocolStats } from "@/server/services/stats";

/** GET /api/stats: public traction numbers (goals, reservations, coverage, value locked), read from the contracts. */
export async function GET() {
  await connection();
  return respond(() => getProtocolStats());
}
