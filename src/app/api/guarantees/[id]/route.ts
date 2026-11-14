import type { NextRequest } from "next/server";

import { respond } from "@/server/http";
import { guaranteeIdParam } from "@/server/schemas";
import { getGuarantee } from "@/server/services/guarantees";

/** GET /api/guarantees/:id: one guarantee with its live collateral health and claim state. */
export async function GET(_request: NextRequest, context: RouteContext<"/api/guarantees/[id]">) {
  return respond(async () => {
    const { id } = await context.params;
    return getGuarantee(guaranteeIdParam.parse(id));
  });
}
