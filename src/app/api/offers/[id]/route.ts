import type { NextRequest } from "next/server";

import { respond } from "@/server/http";
import { getOffer, offerIdParam } from "@/server/services/offers";

/** GET /api/offers/:id: the offer behind a broker's short link. */
export async function GET(_request: NextRequest, context: RouteContext<"/api/offers/[id]">) {
  return respond(async () => {
    const { id } = await context.params;
    return getOffer(offerIdParam.parse(id));
  });
}
