import { planGoal, goalPlanSchema } from "@/server/planners/goal";
import { readJson, respond } from "@/server/http";
import { assertAllowedRegion } from "@/server/planners/shared";

/** POST /api/plan/goal: setGoal for a property, a seña % and a stock. Returns `{ calls, quote }`; never signs. */
export async function POST(request: Request) {
  return respond(async () => {
    assertAllowedRegion(request);
    return planGoal(goalPlanSchema.parse(await readJson(request)));
  });
}
