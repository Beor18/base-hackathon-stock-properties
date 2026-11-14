import type { NextRequest } from "next/server";

import { respond } from "@/server/http";
import { addressParam } from "@/server/schemas";
import { getAccountSnapshot } from "@/server/services/accounts";

/** GET /api/account/:address: pay token balances and the goal (progress, value, what reserving takes). */
export async function GET(_request: NextRequest, context: RouteContext<"/api/account/[address]">) {
  return respond(async () => {
    const { address } = await context.params;
    return getAccountSnapshot(addressParam.parse(address));
  });
}
