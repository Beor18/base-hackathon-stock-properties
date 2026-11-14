import type { NextRequest } from "next/server";
import { z } from "zod";

import { respond } from "@/server/http";
import { addressParam, usdAmountParam } from "@/server/schemas";
import { quoteCollateral } from "@/server/services/quotes";

const querySchema = z.object({
  coverageUsd: usdAmountParam,
  token: addressParam.optional(),
});

/**
 * GET /api/quote?coverageUsd=1200&token=0x…
 * Stock needed to guarantee a rental. Without `token`, quotes every accepted stock.
 */
export async function GET(request: NextRequest) {
  return respond(async () => {
    const { searchParams } = request.nextUrl;
    const query = querySchema.parse({
      coverageUsd: searchParams.get("coverageUsd") ?? "",
      token: searchParams.get("token") ?? undefined,
    });
    return quoteCollateral(query.coverageUsd, query.token);
  });
}
