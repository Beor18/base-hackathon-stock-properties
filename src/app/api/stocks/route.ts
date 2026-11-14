import { connection } from "next/server";

import { respond } from "@/server/http";
import { listStocks } from "@/server/services/stocks";

/** GET /api/stocks: tokenized stocks accepted as collateral, with live oracle prices. */
export async function GET() {
  await connection();
  return respond(() => listStocks());
}
