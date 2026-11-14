import { z } from "zod";

import { BadRequestError } from "@/server/errors";
import { respond } from "@/server/http";
import { previewLink } from "@/server/services/properties";

const bodySchema = z.object({ url: z.string().min(1, "url is required").max(2048, "url is too long") });

/**
 * POST /api/link-preview { url }: reads the pasted listing page (and only that page).
 * Pages that cannot be read still return a property with `readable: false` and `priceUsd: null`.
 */
export async function POST(request: Request) {
  return respond(async () => {
    const body: unknown = await request.json().catch(() => {
      throw new BadRequestError("Expected a JSON body such as { \"url\": \"https://…\" }");
    });
    return previewLink(bodySchema.parse(body).url);
  });
}
