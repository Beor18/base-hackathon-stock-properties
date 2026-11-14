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
  /** Stable reference: "smarlin:<uuid>" or "link:<sha256 of sourceUrl>". */
  ref: string;
  provider: PropertyProviderId;
  title: string;
  /** Human-readable place, e.g. "Dorado, Puerto Rico". Null when a pasted page does not say. */
  location: string | null;
  listingType: "sale" | "rent";
  /** Null only for links where no price could be read; the UI asks for it. */
  priceUsd: number | null;
  /** The price as published. ARS prices are converted to `priceUsd` with the live USD/ARS rate. */
  priceOriginal: Money | null;
  bedrooms: number | null;
  bathrooms: number | null;
  /** Built area, or the lot area for land. */
  areaM2: number | null;
  imageUrl: string | null;
  agent: { name: string; company: string | null } | null;
  /**
   * The listing page. For links this is the canonical form of the pasted URL: pass it back as
   * `GET /api/properties/<ref>?url=<sourceUrl>` to resolve the ref again.
   */
  sourceUrl: string;
}

/** Another Smarlin listing similar to the one being viewed. */
export interface SimilarProperty {
  ref: string;
  title: string;
  priceUsd: number;
  imageUrl: string | null;
  /** Null when either listing has no coordinates. */
  distanceKm: number | null;
}

/**
 * Smarlin-only market intelligence. Each block is null when Smarlin has no data for it.
 * Zone figures describe the municipality, not this exact property.
 */
export interface PropertyInsights {
  /**
   * List price against Smarlin's estimate from closed sales nearby. Sale listings only.
   * Smarlin gives a point estimate, not a range.
   */
  fairPrice: {
    verdict: "below" | "fair" | "above";
    estimatedValueUsd: number;
    /** List price over the estimate, in percent. Positive means above. */
    differencePct: number;
    confidence: "high" | "medium" | "low";
  } | null;
  /** Gross short-term rental income for the zone, before expenses. Sale listings only. */
  shortTermRental: {
    monthlyIncomeUsd: number;
    occupancyPct: number;
    nightlyRateUsd: number;
    /** Credit the data provider's terms require next to these figures. */
    attribution: string;
  } | null;
  /** Median asking rent of active rentals in the zone (same bedrooms when the sample allows). */
  marketRentUsd: number | null;
  /** Recent closed sales in the zip code or municipality. Smarlin caps the sample at 100. */
  comparablesCount: number | null;
  /** Up to six similar active Smarlin listings, closest first. */
  similar: SimilarProperty[];
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

/** Response of `POST /api/link-preview`: the property, plus whether the page itself could be read. */
export interface LinkPreview extends PropertyDetail {
  /**
   * False when the page could not be read (the site blocks automated reads, robots.txt forbids it,
   * it timed out). The property then only carries what the URL says and the UI asks for the price.
   */
  readable: boolean;
}
