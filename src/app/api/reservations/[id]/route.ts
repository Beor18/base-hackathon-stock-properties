import type { NextRequest } from "next/server";

import { respond } from "@/server/http";
import { reservationIdParam } from "@/server/schemas";
import { getReservationDetail } from "@/server/services/reservations";

/** GET /api/reservations/:id: one reservation with its live value, claim state and property. */
export async function GET(_request: NextRequest, context: RouteContext<"/api/reservations/[id]">) {
  return respond(async () => {
    const { id } = await context.params;
    return getReservationDetail(reservationIdParam.parse(id));
  });
}
