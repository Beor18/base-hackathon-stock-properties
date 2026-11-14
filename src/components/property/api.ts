import type { LinkPreview, PropertyDetail, PropertyPage } from "@/domain/property";

/**
 * Browser-side calls to the property API routes. The UI never talks to Smarlin or a portal directly.
 * Errors keep the route's `{ error: { code, message } }` code so screens can tell 404 from a failure.
 */
export class PropertyApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "PropertyApiError";
  }
}

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, { ...init, headers: { accept: "application/json", ...init?.headers } });
  if (!response.ok) {
    let code = "http_error";
    let message = response.statusText;
    try {
      const body = (await response.json()) as { error?: { code?: string; message?: string } };
      code = body.error?.code ?? code;
      message = body.error?.message ?? message;
    } catch {
      // Non-JSON error body: keep the status text.
    }
    throw new PropertyApiError(response.status, code, message);
  }
  return (await response.json()) as T;
}

export type PropertyQuery = { q?: string; type?: "sale" | "rent"; featured?: boolean; limit?: number; offset?: number };

export function listProperties(query: PropertyQuery, signal?: AbortSignal): Promise<PropertyPage> {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.type) params.set("type", query.type);
  if (query.featured) params.set("featured", "1");
  if (query.limit) params.set("limit", String(query.limit));
  if (query.offset) params.set("offset", String(query.offset));
  const search = params.toString();
  return request<PropertyPage>(`/api/properties${search ? `?${search}` : ""}`, { signal });
}

/** Link refs carry no stored row: pass the listing's `sourceUrl` back so the API can resolve them. */
export function getProperty(ref: string, sourceUrl?: string | null, signal?: AbortSignal): Promise<PropertyDetail> {
  const query = sourceUrl && ref.startsWith("link:") ? `?url=${encodeURIComponent(sourceUrl)}` : "";
  return request<PropertyDetail>(`/api/properties/${encodeURIComponent(ref)}${query}`, { signal });
}

export function previewLink(url: string, signal?: AbortSignal): Promise<LinkPreview> {
  return request<LinkPreview>("/api/link-preview", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ url }),
    signal,
  });
}

/**
 * A property read from a pasted link is kept for the session so the detail screen can open it
 * without reading the page again.
 */
const STASH_PREFIX = "sena:property:";

export function stashProperty(property: PropertyDetail): void {
  try {
    sessionStorage.setItem(STASH_PREFIX + property.ref, JSON.stringify(property));
  } catch {
    // Storage can be unavailable (private mode); the detail screen falls back to the API.
  }
}

export function readStashedProperty(ref: string): PropertyDetail | null {
  try {
    const raw = sessionStorage.getItem(STASH_PREFIX + ref);
    return raw ? (JSON.parse(raw) as PropertyDetail) : null;
  } catch {
    return null;
  }
}

/** Route to a property's detail screen. `sourceUrl` is kept for link-provider properties. */
export function propertyHref(lang: string, ref: string, sourceUrl?: string): string {
  const base = `/${lang}/casa/${encodeURIComponent(ref)}`;
  return sourceUrl && ref.startsWith("link:") ? `${base}?url=${encodeURIComponent(sourceUrl)}` : base;
}

/** Images from pasted links can come from any host, so they skip the image optimizer. */
export function isOptimizable(src: string): boolean {
  try {
    const { hostname } = new URL(src);
    return hostname === "images.realtyserver.com" || hostname.endsWith("smarlin.com");
  } catch {
    return false;
  }
}
