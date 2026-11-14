import type { NextRequest } from "next/server";

import { respond } from "@/server/http";
import { getProperty } from "@/server/services/properties";

/**
 * GET /api/properties/:ref: one property with Smarlin's market data.
 * Link refs carry no database row, so they need the link back: `?url=<sourceUrl>` (checked against the ref).
 */
export async function GET(request: NextRequest, context: RouteContext<"/api/properties/[ref]">) {
  return respond(async () => {
    const { ref } = await context.params;
    const url = request.nextUrl.searchParams.get("url") ?? undefined;
    // Next rejects malformed percent-encoding before this runs.
    return getProperty(decodeURIComponent(ref), { url });
  });
}
