import { requireIdentity } from "@/server/auth/identity";
import { readJson, respond } from "@/server/http";
import { createOffer, createOfferSchema } from "@/server/services/offers";

/** POST /api/offers: a broker saves a reservation offer. Needs the `privy-id-token` header. Returns the offer with its id. */
export async function POST(request: Request) {
  return respond(async () => {
    const identity = await requireIdentity(request);
    return createOffer(identity, createOfferSchema.parse(await readJson(request)));
  });
}
