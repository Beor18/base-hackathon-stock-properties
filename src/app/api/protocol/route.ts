import { connection } from "next/server";

import { respond } from "@/server/http";
import { getProtocolConfig } from "@/server/services/protocol";

/** GET /api/protocol: the escrow's rules (fee, windows, arbiter), read from the contracts. */
export async function GET() {
  await connection();
  return respond(() => getProtocolConfig());
}
