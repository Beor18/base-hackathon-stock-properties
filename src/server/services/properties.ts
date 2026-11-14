import "server-only";

import { createHash } from "node:crypto";

import type {
  LinkPreview,
  PropertyDetail,
  PropertyInsights,
  PropertyPage,
  PropertyProviderId,
  PropertySummary,
} from "@/domain/property";
import { BadRequestError, NotFoundError } from "@/server/errors";
import { assertPublicHost, canonicalizeLink, readLinkPage, titleFromUrl, type LinkPage } from "@/server/clients/link-preview";
import {
  getSmarlinComparables,
  getSmarlinFairPrice,
  getSmarlinListing,
  getSmarlinMarketRent,
  getSmarlinShortTermRental,
  isSmarlinId,
  searchSmarlinListings,
  smarlinIdFromUrl,
  smarlinListingUrl,
  type SmarlinListing,
} from "@/server/clients/smarlin";
import { arsToUsd, getUsdArsRate } from "@/server/services/rates";

/** A source of properties. Refs look like `<provider>:<id>`. */
export interface PropertyProvider {
  readonly id: PropertyProviderId;
  /** Resolves the id part of a ref. Link refs need the URL, since there is no database behind them. */
  get(id: string, options: { url?: string }): Promise<PropertyDetail>;
}

export type PropertySearch = {
  /** Municipality to match, e.g. "Dorado". */
  q?: string;
  type?: "sale" | "rent";
  /** Only listings of verified Smarlin agents. */
  featured: boolean;
  limit: number;
  offset: number;
};

const SQFT_TO_M2 = 0.092903;
const STATE_NAMES: Record<string, string> = { PR: "Puerto Rico" };

const positiveOrNull = (value: number | null) => (value !== null && value > 0 ? value : null);
const round = (value: number, decimals = 0) => Math.round(value * 10 ** decimals) / 10 ** decimals;

/** Settles to null when a block of market data fails, so one bad endpoint never hides the property. */
function orNull<T>(promise: Promise<T | null>, label: string): Promise<T | null> {
  return promise.catch((error: unknown) => {
    console.warn(`[properties] ${label} unavailable`, error instanceof Error ? error.message : error);
    return null;
  });
}

// ---------------------------------------------------------------------------
// Smarlin
// ---------------------------------------------------------------------------

function smarlinSummary(listing: SmarlinListing): PropertySummary {
  const place = listing.state ? (STATE_NAMES[listing.state] ?? listing.state) : "Puerto Rico";
  const builtSqft = positiveOrNull(listing.squareFeet);
  const lotSqft = positiveOrNull(listing.lotSizeSqft);
  const areaSqft = builtSqft ?? (listing.propertyType === "land" ? lotSqft : null);
  const priceUsd = positiveOrNull(listing.priceUsd);

  return {
    ref: `smarlin:${listing.id}`,
    provider: "smarlin",
    title: listing.title,
    location: listing.city ? `${listing.city}, ${place}` : place,
    listingType: listing.listingType,
    priceUsd,
    priceOriginal: priceUsd !== null ? { amount: priceUsd, currency: "USD" } : null,
    bedrooms: positiveOrNull(listing.bedrooms),
    bathrooms: positiveOrNull(listing.bathrooms),
    areaM2: areaSqft !== null ? Math.round(areaSqft * SQFT_TO_M2) : null,
    imageUrl: listing.images[0] ?? null,
    agent: listing.agent,
    sourceUrl: smarlinListingUrl(listing.id),
  };
}

const VERDICTS = {
  ganga: "below",
  buen_precio: "below",
  precio_justo: "fair",
  ligeramente_caro: "above",
  caro: "above",
  sobreprecio: "above",
} as const;

/** Smarlin's market data for one listing. Every block is fetched (and cached) on its own. */
export async function getSmarlinInsights(listing: SmarlinListing): Promise<PropertyInsights> {
  const isSale = listing.listingType === "sale";
  const [fairPrice, shortTermRental, marketRent, comparables] = await Promise.all([
    isSale ? orNull(getSmarlinFairPrice(listing), "fair price") : null,
    isSale && listing.city ? orNull(getSmarlinShortTermRental(listing.city), "short-term rental") : null,
    orNull(getSmarlinMarketRent(listing), "market rent"),
    orNull(getSmarlinComparables(listing.id), "comparables"),
  ]);

  const similar = (comparables?.similarActive.listings ?? [])
    .filter((item) => isSmarlinId(item.id) && item.price > 0)
    .map((item) => ({
      ref: `smarlin:${item.id.toLowerCase()}`,
      title: item.title ?? "Propiedad",
      priceUsd: item.price,
      imageUrl: item.image?.startsWith("https://") ? item.image : null,
      distanceKm: item.distanceKm,
    }));
  const soldCount = comparables?.soldSummary?.count ?? 0;

  return {
    fairPrice:
      fairPrice && fairPrice.comparableCount > 0 && fairPrice.estimatedValue > 0
        ? {
            verdict: VERDICTS[fairPrice.dealRating],
            estimatedValueUsd: Math.round(fairPrice.estimatedValue),
            differencePct: round(fairPrice.differencePercent, 1),
            confidence: fairPrice.confidence,
          }
        : null,
    shortTermRental: shortTermRental
      ? {
          monthlyIncomeUsd: Math.round(shortTermRental.monthlyIncome),
          occupancyPct: Math.round(shortTermRental.occupancy * 100),
          nightlyRateUsd: Math.round(shortTermRental.nightlyRate),
          attribution: shortTermRental.attribution,
        }
      : null,
    marketRentUsd: marketRent ? Math.round(marketRent.median) : null,
    comparablesCount: soldCount > 0 ? soldCount : null,
    similar,
  };
}

const smarlinProvider = {
  id: "smarlin",

  async search(query: PropertySearch): Promise<PropertyPage> {
    const { listings, total, hasMore } = await searchSmarlinListings({
      city: query.q,
      listingType: query.type,
      verifiedOnly: query.featured,
      limit: query.limit,
      offset: query.offset,
    });
    return { items: listings.map(smarlinSummary), total, limit: query.limit, offset: query.offset, hasMore };
  },

  async get(id: string): Promise<PropertyDetail> {
    if (!isSmarlinId(id)) throw new BadRequestError("Expected a Smarlin property id");
    const listing = await getSmarlinListing(id.toLowerCase());
    if (!listing) throw new NotFoundError("Property not found");

    return {
      ...smarlinSummary(listing),
      description: listing.description,
      images: listing.images,
      coordinates: listing.coordinates,
      insights: await getSmarlinInsights(listing),
    };
  },
} satisfies PropertyProvider & { search(query: PropertySearch): Promise<PropertyPage> };

// ---------------------------------------------------------------------------
// Pasted links
// ---------------------------------------------------------------------------

function linkId(canonicalUrl: string): string {
  return createHash("sha256").update(canonicalUrl).digest("hex");
}

async function priceInUsd(price: LinkPage["price"]): Promise<number | null> {
  if (!price) return null;
  if (price.currency === "USD") return round(price.amount, 2);
  const rate = await orNull(getUsdArsRate(), "USD/ARS rate");
  return rate ? arsToUsd(price.amount, rate) : null;
}

/** Builds the property for a canonical link. Pages that cannot be read still give a usable property. */
async function linkProperty(canonicalUrl: string): Promise<LinkPreview> {
  const result = await orNull(readLinkPage(canonicalUrl), "link page");
  if (result && !result.ok) console.info(`[properties] link not readable (${result.reason}): ${new URL(canonicalUrl).hostname}`);
  const page = result?.ok ? result.page : null;

  return {
    ref: `link:${linkId(canonicalUrl)}`,
    provider: "link",
    title: page?.title ?? titleFromUrl(canonicalUrl),
    location: page?.location ?? null,
    listingType: page?.listingType ?? "sale",
    priceUsd: await priceInUsd(page?.price ?? null),
    priceOriginal: page?.price ? { amount: page.price.amount, currency: page.price.currency } : null,
    bedrooms: page?.bedrooms ?? null,
    bathrooms: page?.bathrooms ?? null,
    areaM2: page?.areaM2 ?? null,
    imageUrl: page?.images[0] ?? null,
    agent: null,
    sourceUrl: canonicalUrl,
    description: page?.description ?? null,
    images: page?.images ?? [],
    coordinates: page?.coordinates ?? null,
    insights: null,
    readable: page !== null,
  };
}

const linkProvider: PropertyProvider = {
  id: "link",

  async get(id, { url }) {
    if (!url) throw new BadRequestError("Pass the property link as ?url= to resolve a link ref");
    const canonicalUrl = canonicalizeLink(url);
    if (linkId(canonicalUrl) !== id) throw new BadRequestError("The link does not match this property ref");
    return linkProperty(canonicalUrl);
  },
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

const providers: Record<PropertyProviderId, PropertyProvider> = { smarlin: smarlinProvider, link: linkProvider };

const REF_PATTERN = /^(smarlin|link):([0-9a-f-]{36}|[0-9a-f]{64})$/i;

export async function searchProperties(query: PropertySearch): Promise<PropertyPage> {
  return smarlinProvider.search(query);
}

export async function getProperty(ref: string, options: { url?: string } = {}): Promise<PropertyDetail> {
  const match = ref.trim().match(REF_PATTERN);
  if (!match) throw new BadRequestError("Expected a property ref such as smarlin:<id> or link:<hash>");
  const provider = providers[match[1].toLowerCase() as PropertyProviderId];
  return provider.get(match[2].toLowerCase(), options);
}

/** What the app shows after someone pastes a link. Smarlin links resolve to the Smarlin listing. */
export async function previewLink(rawUrl: string): Promise<LinkPreview> {
  const canonicalUrl = canonicalizeLink(rawUrl);

  const smarlinId = smarlinIdFromUrl(new URL(canonicalUrl));
  if (smarlinId) return { ...(await smarlinProvider.get(smarlinId)), readable: true };

  await assertPublicHost(canonicalUrl);
  return linkProperty(canonicalUrl);
}
