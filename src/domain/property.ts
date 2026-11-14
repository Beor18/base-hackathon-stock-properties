/**
 * Property DTOs shared by the API routes and the UI.
 * Owned by the data/backend role; the UI imports these types and never
 * talks to a provider directly.
 */

export type PropertyProviderId = "smarlin" | "link";

export type Currency = "USD" | "ARS";

export interface Money {
  amount: number;
  currency: Currency;
}

export interface PropertySummary {
  /** Stable reference: "smarlin:<uuid>" or "link:<sha256 of the canonical url>". */
  ref: string;
  provider: PropertyProviderId;
  title: string;
  /** Human-readable place, e.g. "Dorado, Puerto Rico". */
  location: string;
  listingType: "sale" | "rent";
  /** Null only for links where no price could be read; the UI asks for it. */
  priceUsd: number | null;
  priceOriginal: Money | null;
  bedrooms: number | null;
  bathrooms: number | null;
  areaM2: number | null;
  imageUrl: string | null;
  agent: { name: string; company: string | null } | null;
  sourceUrl: string;
}

/** Smarlin-only market intelligence. Fields are null when Smarlin has no data. */
export interface PropertyInsights {
  fairPrice: {
    verdict: "below" | "fair" | "above";
    lowUsd: number;
    highUsd: number;
  } | null;
  shortTermRental: {
    monthlyIncomeUsd: number;
    occupancyPct: number | null;
  } | null;
  marketRentUsd: number | null;
  comparablesCount: number | null;
}

export interface PropertyDetail extends PropertySummary {
  description: string | null;
  images: string[];
  coordinates: { lat: number; lng: number } | null;
  /** Null for the link provider. */
  insights: PropertyInsights | null;
}

export interface PropertyPage {
  items: PropertySummary[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}
