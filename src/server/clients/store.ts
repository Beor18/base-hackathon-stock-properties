import "server-only";

import { z } from "zod";

import { serverEnv } from "@/config/server-env";

import { ServiceUnavailableError } from "../errors";

/**
 * Accasa's database: the few things that cannot live onchain (broker offers, inbox state).
 * Supabase's REST API with the secret key, so it only ever runs on the server. The tables are
 * closed to the public API; see `supabase/schema.sql`.
 */
async function rest(path: string, init: RequestInit = {}): Promise<unknown> {
  const key = serverEnv.SUPABASE_SECRET_KEY;
  if (!key) throw new ServiceUnavailableError("store_unconfigured", "The database is not configured");
  let response: Response;
  try {
    response = await fetch(`${serverEnv.SUPABASE_URL}/rest/v1/${path}`, {
      ...init,
      // New secret keys go in `apikey` only: `Authorization` is reserved for user JWTs.
      headers: { apikey: key, accept: "application/json", "content-type": "application/json", ...init.headers },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    console.error("[store] unreachable", error instanceof Error ? error.message : error);
    throw new ServiceUnavailableError("store_error", "The database did not answer");
  }
  if (!response.ok) {
    console.error("[store]", response.status, (await response.text().catch(() => "")).slice(0, 300));
    throw new ServiceUnavailableError("store_error", "The database did not answer");
  }
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

const offerRow = z.object({
  id: z.string(),
  property_ref: z.string(),
  source_url: z.string().nullable(),
  deposit_pct: z.coerce.number(),
  broker_address: z.string(),
  broker_name: z.string(),
  broker_company: z.string().nullable(),
  broker_verified: z.boolean(),
});

export type OfferRow = z.infer<typeof offerRow>;

export async function insertOffer(row: OfferRow): Promise<void> {
  await rest("reservation_offers", { method: "POST", headers: { prefer: "return=minimal" }, body: JSON.stringify(row) });
}

export async function findOffer(id: string): Promise<OfferRow | null> {
  const rows = z.array(offerRow).parse(await rest(`reservation_offers?id=eq.${encodeURIComponent(id)}&select=*&limit=1`));
  return rows[0] ?? null;
}

/** When the broker last opened their inbox, or null if never. `account` is lowercase. */
export async function readInboxSeen(account: string): Promise<Date | null> {
  const rows = z
    .array(z.object({ seen_at: z.string() }))
    .parse(await rest(`broker_inbox?account=eq.${encodeURIComponent(account)}&select=seen_at&limit=1`));
  return rows[0] ? new Date(rows[0].seen_at) : null;
}

export async function writeInboxSeen(account: string, seenAt: Date): Promise<void> {
  await rest("broker_inbox?on_conflict=account", {
    method: "POST",
    headers: { prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({ account, seen_at: seenAt.toISOString() }),
  });
}
