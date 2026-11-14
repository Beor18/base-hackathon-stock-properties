import { connection } from "next/server";

import { respond } from "@/server/http";
import { getUsdArsRate } from "@/server/services/rates";

/** GET /api/rates: live USD/ARS reference rate (pesos per dollar), with its source and update time. */
export async function GET() {
  await connection();
  return respond(() => getUsdArsRate());
}
