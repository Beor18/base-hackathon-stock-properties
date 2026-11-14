import type { NextRequest } from "next/server";
import { connection } from "next/server";
import { z } from "zod";

import { respond } from "@/server/http";
import { searchProperties } from "@/server/services/properties";

const querySchema = z.object({
  q: z
    .string()
    .trim()
    .max(60, "q is too long")
    .optional()
    .transform((value) => value || undefined),
  type: z.enum(["sale", "rent"]).optional(),
  featured: z
    .enum(["1", "true", "0", "false"])
    .optional()
    .transform((value) => value === "1" || value === "true"),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).max(10_000).default(0),
});

/**
 * GET /api/properties?q=&type=sale|rent&featured=1&limit=&offset=
 * Smarlin listings. `q` matches the municipality; `featured=1` keeps only verified Smarlin agents.
 */
export async function GET(request: NextRequest) {
  await connection();
  return respond(() => searchProperties(querySchema.parse(Object.fromEntries(request.nextUrl.searchParams))));
}
