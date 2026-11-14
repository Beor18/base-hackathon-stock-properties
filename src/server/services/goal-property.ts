import "server-only";

import { createHash } from "node:crypto";

import { cacheLife } from "next/cache";

import type { PropertyDetail } from "@/domain/property";
import type { GoalPropertyDto } from "@/domain/types";
import { canonicalizeLink, titleFromUrl } from "@/server/clients/link-preview";

import { getProperty, previewLink } from "./properties";

/**
 * A goal stores the property as plain text (`propertyKey`): the ref for Smarlin listings, the
 * listing URL for pasted links (link refs are a hash of it, so the URL is what lets us read it again).
 */
const REF_PATTERN = /^(smarlin|link):/i;

export function isRefKey(key: string): boolean {
  return REF_PATTERN.test(key);
}

/** Ref of a pasted listing, the same one the property API gives it. */
export function linkRefFor(url: string): string {
  return `link:${createHash("sha256").update(canonicalizeLink(url)).digest("hex")}`;
}

/** The key a goal stores for a property: its ref, or its listing URL for pasted links. */
export function propertyKeyFor(property: Pick<PropertyDetail, "ref" | "provider" | "sourceUrl">): string {
  return property.provider === "link" ? property.sourceUrl : property.ref;
}

/** Loads a property by its ref (and listing URL for links). */
export async function loadProperty(ref: string, url?: string | null): Promise<PropertyDetail> {
  return getProperty(ref, url ? { url } : {});
}

/**
 * Resolves a stored property key for display. Never throws: when the source is gone or unreadable
 * it falls back to what the chain knows (the key and the price stored with the goal).
 */
export async function resolvePropertyKey(key: string, storedPriceUsd: number): Promise<GoalPropertyDto> {
  "use cache";
  cacheLife("hours");

  try {
    const detail = isRefKey(key) ? await getProperty(key) : await previewLink(key);
    return {
      ref: detail.ref,
      title: detail.title,
      location: detail.location,
      imageUrl: detail.imageUrl ?? detail.images[0] ?? null,
      priceUsd: detail.priceUsd ?? storedPriceUsd,
      livePrice: detail.priceUsd !== null,
      sourceUrl: detail.sourceUrl,
      agent: detail.agent,
    };
  } catch (error) {
    console.warn("[goals] property unavailable", key, error instanceof Error ? error.message : error);
    const isUrl = !isRefKey(key);
    return {
      ref: isUrl ? safe(() => linkRefFor(key), key) : key,
      title: isUrl ? safe(() => titleFromUrl(key), key) : key,
      location: null,
      imageUrl: null,
      priceUsd: storedPriceUsd,
      livePrice: false,
      sourceUrl: isUrl ? key : null,
      agent: null,
    };
  }
}

function safe<T>(read: () => T, fallback: T): T {
  try {
    return read();
  } catch {
    return fallback;
  }
}
