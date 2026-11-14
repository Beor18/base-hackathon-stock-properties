import { planReservationAction, reservationActionSchema } from "@/server/planners/reservation-action";
import { readJson, respond } from "@/server/http";
import { assertAllowedRegion } from "@/server/planners/shared";

/** POST /api/plan/reservation: release, claim, accept, dispute, resolve or settle a reservation. Returns `{ calls, quote }`; never signs. */
export async function POST(request: Request) {
  return respond(async () => {
    assertAllowedRegion(request);
    return planReservationAction(reservationActionSchema.parse(await readJson(request)));
  });
}
