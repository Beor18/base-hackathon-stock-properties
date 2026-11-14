import { planReservation, reservePlanSchema } from "@/server/planners/reserve";
import { readJson, respond } from "@/server/http";
import { assertAllowedRegion } from "@/server/planners/shared";

/** POST /api/plan/reserve: approve + createReservation from the broker's link. Empty calls until the goal is reached. Returns `{ calls, quote }`; never signs. */
export async function POST(request: Request) {
  return respond(async () => {
    assertAllowedRegion(request);
    return planReservation(reservePlanSchema.parse(await readJson(request)));
  });
}
