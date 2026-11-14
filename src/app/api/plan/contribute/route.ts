import { planContribution, contributePlanSchema } from "@/server/planners/contribute";
import { readJson, respond } from "@/server/http";
import { assertAllowedRegion } from "@/server/planners/shared";

/** POST /api/plan/contribute: approve + buy the goal's stock with USDC or wARS, with the fee in the quote. Returns `{ calls, quote }`; never signs. */
export async function POST(request: Request) {
  return respond(async () => {
    assertAllowedRegion(request);
    return planContribution(contributePlanSchema.parse(await readJson(request)));
  });
}
