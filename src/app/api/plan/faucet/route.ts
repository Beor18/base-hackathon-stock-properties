import { planFaucet, faucetPlanSchema } from "@/server/planners/faucet";
import { readJson, respond } from "@/server/http";
import { assertAllowedRegion } from "@/server/planners/shared";

/** POST /api/plan/faucet: test balance (local and testnet only). Returns `{ calls, quote }`; never signs. */
export async function POST(request: Request) {
  return respond(async () => {
    assertAllowedRegion(request);
    return planFaucet(faucetPlanSchema.parse(await readJson(request)));
  });
}
