import "server-only";

import { cacheLife } from "next/cache";
import { z } from "zod";

import { serverEnv } from "@/config/server-env";

/**
 * Client for Smarlin's public property API (our own product: Puerto Rico listings and market data).
 *
 * Every response goes through a zod schema that lists the fields we keep. Anything else Smarlin
 * returns (embeddings, agent email and phone, internal ids) is dropped here and never leaves the
 * server.
 */

/** Smarlin answers crawler-looking user agents with empty data on its analysis endpoints. */
const USER_AGENT = "Sena/1.0 (server)";
const TIMEOUT_MS = 20_000;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isSmarlinId(value: string): boolean {
  return UUID_PATTERN.test(value);
}

/** Absolute URL of a listing page on Smarlin. */
export function smarlinListingUrl(id: string): string {
  return new URL(`/propiedad/${id}`, serverEnv.SMARLIN_API_URL).toString();
}

/** The Smarlin listing id in a link to one of its property pages, if it is one. */
export function smarlinIdFromUrl(url: URL): string | null {
  const host = new URL(serverEnv.SMARLIN_API_URL).hostname.replace(/^www\./, "");
  if (url.hostname.replace(/^www\./, "") !== host) return null;
  const match = url.pathname.match(/^\/(?:en\/)?(?:propiedad|property)\/([^/]+)\/?$/);
  return match && isSmarlinId(match[1]) ? match[1].toLowerCase() : null;
}

/** GET a Smarlin JSON endpoint. Resolves to null on 404. */
async function getJson(path: string, params: Record<string, string | number | undefined> = {}): Promise<unknown> {
  const url = new URL(path, serverEnv.SMARLIN_API_URL);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
  }

  const response = await fetch(url, {
    headers: { accept: "application/json", "user-agent": USER_AGENT },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Smarlin ${url.pathname} responded ${response.status}`);
  return response.json();
}

// ---------------------------------------------------------------------------
// Listings
// ---------------------------------------------------------------------------

const optionalNumber = z.number().nullish().transform((value) => value ?? null);
const optionalString = z.string().nullish().transform((value) => value?.trim() || null);
const listingType = z.enum(["sale", "rent"]).catch("sale");
const imageList = z
  .array(z.unknown())
  .nullish()
  .transform((images) => (images ?? []).filter((image): image is string => typeof image === "string" && image.startsWith("https://")));

/** A Smarlin listing reduced to the fields we are allowed to show. */
export type SmarlinListing = {
  id: string;
  title: string;
  description: string | null;
  priceUsd: number | null;
  listingType: "sale" | "rent";
  propertyType: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  squareFeet: number | null;
  lotSizeSqft: number | null;
  yearBuilt: number | null;
  images: string[];
  coordinates: { lat: number; lng: number } | null;
  agent: { name: string; company: string | null } | null;
};

function coordinates(lat: number | null, lng: number | null): SmarlinListing["coordinates"] {
  return lat !== null && lng !== null ? { lat, lng } : null;
}

function agent(name: string | null, company: string | null): SmarlinListing["agent"] {
  return name ? { name, company } : null;
}

/** A row of `GET /api/properties` (raw table columns). */
const listingRowSchema = z
  .object({
    id: z.string().refine(isSmarlinId),
    title: optionalString,
    description: optionalString,
    price: optionalNumber,
    listing_type: listingType,
    property_type: optionalString,
    city: optionalString,
    state: optionalString,
    zip_code: optionalString,
    bedrooms: optionalNumber,
    bathrooms: optionalNumber,
    square_feet: optionalNumber,
    lot_size: optionalNumber,
    year_built: optionalNumber,
    images: imageList,
    latitude: optionalNumber,
    longitude: optionalNumber,
    agent_name: optionalString,
    agent_company: optionalString,
  })
  .transform(
    (row): SmarlinListing => ({
      id: row.id.toLowerCase(),
      title: row.title ?? `Propiedad en ${row.city ?? "Puerto Rico"}`,
      description: row.description,
      priceUsd: row.price,
      listingType: row.listing_type,
      propertyType: row.property_type,
      city: row.city,
      state: row.state,
      zipCode: row.zip_code,
      bedrooms: row.bedrooms,
      bathrooms: row.bathrooms,
      squareFeet: row.square_feet,
      lotSizeSqft: row.lot_size,
      yearBuilt: row.year_built,
      images: row.images,
      coordinates: coordinates(row.latitude, row.longitude),
      agent: agent(row.agent_name, row.agent_company),
    }),
  );

/** `property` of `GET /api/properties/{id}` (already normalized by Smarlin). */
const listingDetailSchema = z
  .object({
    id: z.string().refine(isSmarlinId),
    title: optionalString,
    description: optionalString,
    price: optionalNumber,
    listingType: listingType,
    address: z
      .object({ city: optionalString, state: optionalString, zipCode: optionalString })
      .nullish()
      .transform((address) => address ?? { city: null, state: null, zipCode: null }),
    coordinates: z
      .object({ latitude: z.number(), longitude: z.number() })
      .nullish()
      .transform((point) => (point ? { lat: point.latitude, lng: point.longitude } : null)),
    details: z
      .object({
        propertyType: optionalString,
        bedrooms: optionalNumber,
        bathrooms: optionalNumber,
        squareFeet: optionalNumber,
        lotSize: optionalNumber,
        yearBuilt: optionalNumber,
      })
      .nullish(),
    images: imageList,
    agent: z.object({ name: optionalString, company: optionalString }).nullish(),
  })
  .transform(
    (property): SmarlinListing => ({
      id: property.id.toLowerCase(),
      title: property.title ?? `Propiedad en ${property.address.city ?? "Puerto Rico"}`,
      description: property.description,
      priceUsd: property.price,
      listingType: property.listingType,
      propertyType: property.details?.propertyType ?? null,
      city: property.address.city,
      state: property.address.state,
      zipCode: property.address.zipCode,
      bedrooms: property.details?.bedrooms ?? null,
      bathrooms: property.details?.bathrooms ?? null,
      squareFeet: property.details?.squareFeet ?? null,
      lotSizeSqft: property.details?.lotSize ?? null,
      yearBuilt: property.details?.yearBuilt ?? null,
      images: property.images,
      coordinates: property.coordinates,
      agent: agent(property.agent?.name ?? null, property.agent?.company ?? null),
    }),
  );

const listPageSchema = z.object({
  properties: z.array(z.unknown()),
  meta: z.object({ total: z.number(), hasMore: z.boolean() }),
});

export type SmarlinSearch = {
  /** Partial, case-insensitive match on the municipality. Smarlin has no free-text search. */
  city?: string;
  listingType?: "sale" | "rent";
  /** Only listings of verified Smarlin agents (the home page showcase). */
  verifiedOnly: boolean;
  limit: number;
  offset: number;
};

export async function searchSmarlinListings(
  search: SmarlinSearch,
): Promise<{ listings: SmarlinListing[]; total: number; hasMore: boolean }> {
  "use cache";
  cacheLife("minutes");

  const page = listPageSchema.parse(
    await getJson("/api/properties", {
      status: "active",
      // Only Smarlin's own inventory: these have stable UUIDs that the detail endpoint resolves.
      source: "local",
      city: search.city,
      listingType: search.listingType,
      verifiedOnly: search.verifiedOnly ? "true" : undefined,
      limit: search.limit,
      offset: search.offset,
    }),
  );

  // One malformed row should not hide the rest of the page.
  const listings = page.properties.flatMap((row) => {
    const parsed = listingRowSchema.safeParse(row);
    return parsed.success ? [parsed.data] : [];
  });
  return { listings, total: page.meta.total, hasMore: page.meta.hasMore };
}

/** One listing, or null when Smarlin does not have it (or hides it). */
export async function getSmarlinListing(id: string): Promise<SmarlinListing | null> {
  "use cache";
  cacheLife("hours");

  const body = await getJson(`/api/properties/${encodeURIComponent(id)}`);
  if (body === null) return null;
  return z.object({ property: listingDetailSchema }).parse(body).property;
}

// ---------------------------------------------------------------------------
// Market data. Each call is independent: callers treat a failure as "no data".
// ---------------------------------------------------------------------------

const fairPriceSchema = z.object({
  data: z.object({
    dealRating: z.enum(["ganga", "buen_precio", "precio_justo", "ligeramente_caro", "caro", "sobreprecio"]),
    estimatedValue: z.number(),
    differencePercent: z.number(),
    comparableCount: z.number(),
    confidence: z.enum(["high", "medium", "low"]),
  }),
});

export type SmarlinFairPrice = z.infer<typeof fairPriceSchema>["data"];

/** Fair price score of a sale listing against closed sales nearby. */
export async function getSmarlinFairPrice(listing: SmarlinListing): Promise<SmarlinFairPrice | null> {
  "use cache";
  cacheLife("days");

  if (!listing.city || !listing.priceUsd) return null;
  const body = await getJson("/api/properties/fair-price", {
    listPrice: listing.priceUsd,
    city: listing.city,
    propertyId: listing.id,
    zipCode: listing.zipCode ?? undefined,
    bedrooms: listing.bedrooms ?? undefined,
    bathrooms: listing.bathrooms ?? undefined,
    sqft: listing.squareFeet || undefined,
    lotSize: listing.lotSizeSqft ? Math.round(listing.lotSizeSqft) : undefined,
    yearBuilt: listing.yearBuilt ?? undefined,
    propertyType: listing.propertyType ?? undefined,
  });
  return body === null ? null : fairPriceSchema.parse(body).data;
}

/** `{ ok, valor }` wrapper Smarlin uses for figures that may be missing. */
const known = <T extends z.ZodType>(value: T) =>
  z.union([z.object({ ok: z.literal(true), valor: value }), z.object({ ok: z.literal(false) })]);

const shortTermRentalSchema = z.object({
  mercadoAirroi: known(z.object({ ocupacion: z.number(), adr: z.number(), atribucion: z.string() })),
  ingresoBrutoMensualZona: known(z.object({ mensual: z.number() })),
});

export type SmarlinShortTermRental = { monthlyIncome: number; occupancy: number; nightlyRate: number; attribution: string };

/** Short-term rental market of a municipality, when Smarlin has measured it. */
export async function getSmarlinShortTermRental(municipality: string): Promise<SmarlinShortTermRental | null> {
  "use cache";
  cacheLife("days");

  const body = await getJson("/api/mercado/str", { municipio: municipality });
  if (body === null) return null;
  const { mercadoAirroi: market, ingresoBrutoMensualZona: income } = shortTermRentalSchema.parse(body);
  if (!market.ok || !income.ok) return null;
  return {
    monthlyIncome: income.valor.mensual,
    occupancy: market.valor.ocupacion,
    nightlyRate: market.valor.adr,
    attribution: market.valor.atribucion,
  };
}

const marketRentSchema = z.object({
  comparacion: z
    .object({ disponible: z.boolean(), mediana: z.number().optional(), muestra: z.number().optional() })
    .nullable(),
});

/** Median asking rent of active rentals in the listing's zone. */
export async function getSmarlinMarketRent(
  listing: SmarlinListing,
): Promise<{ median: number; sampleSize: number } | null> {
  "use cache";
  cacheLife("days");

  if (!listing.city) return null;
  const body = await getJson("/api/properties/renta-mercado", {
    // The endpoint grades an asking rent; the zone median it returns does not depend on it.
    renta: listing.listingType === "rent" && listing.priceUsd ? listing.priceUsd : 1,
    city: listing.city,
    bedrooms: listing.bedrooms ?? undefined,
    propertyId: listing.id,
  });
  if (body === null) return null;
  const { comparacion } = marketRentSchema.parse(body);
  if (!comparacion?.disponible || !comparacion.mediana || !comparacion.muestra) return null;
  return { median: comparacion.mediana, sampleSize: comparacion.muestra };
}

const comparablesSchema = z.object({
  data: z.object({
    soldSummary: z
      .object({ count: z.number(), medianPrice: z.number().nullable(), monthsBack: z.number() })
      .nullable(),
    similarActive: z.object({
      listings: z.array(
        z.object({
          id: z.string(),
          title: optionalString,
          price: z.number(),
          image: optionalString,
          distanceKm: optionalNumber,
        }),
      ),
    }),
  }),
});

export type SmarlinComparables = z.infer<typeof comparablesSchema>["data"];

/** Closed-sales summary and similar active listings. */
export async function getSmarlinComparables(id: string): Promise<SmarlinComparables | null> {
  "use cache";
  cacheLife("days");

  const body = await getJson(`/api/properties/${encodeURIComponent(id)}/comparables`);
  return body === null ? null : comparablesSchema.parse(body).data;
}
