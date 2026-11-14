import "server-only";

import { lookup as dnsLookup, type LookupAddress } from "node:dns";
import type { IncomingHttpHeaders } from "node:http";
import { request } from "node:https";
import { BlockList, isIP, type LookupFunction } from "node:net";
import type { Readable } from "node:stream";
import { createBrotliDecompress, createGunzip, createInflate } from "node:zlib";

import { cacheLife } from "next/cache";

import { BadRequestError } from "@/server/errors";

/**
 * Reads the one listing page a person pasted, and nothing else: schema.org JSON-LD first, then
 * schema.org microdata, then Open Graph and meta tags, and finally a price written in the title or
 * description. It honors robots.txt and never calls a site's private APIs.
 *
 * Every connection goes through `publicOnlyLookup`, so a hostname (or a redirect) that resolves to
 * a private, loopback or link-local address is refused at connect time, which also covers DNS
 * rebinding between a check and the request.
 */

/** Generic, no personal data. The token after "compatible;" is what robots.txt groups match. */
const USER_AGENT = "Mozilla/5.0 (compatible; LinkPreview/1.0)";
const ROBOTS_TOKEN = "linkpreview";
const TIMEOUT_MS = 8_000;
const MAX_PAGE_BYTES = 2 * 1024 * 1024;
const MAX_ROBOTS_BYTES = 512 * 1024;
const MAX_REDIRECTS = 5;
const MAX_IMAGES = 10;

const TRACKING_PARAMS = /^(utm_[a-z]+|gclid|gbraid|wbraid|fbclid|mc_cid|mc_eid|_gl|igshid|si)$/i;

// ---------------------------------------------------------------------------
// Address safety
// ---------------------------------------------------------------------------

const nonPublic = new BlockList();
for (const [network, prefix] of [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
] as const) {
  nonPublic.addSubnet(network, prefix, "ipv4");
}
// IPv6: only global unicast is public, minus Teredo, documentation and 6to4 (which can wrap private v4).
const globalUnicastV6 = new BlockList();
globalUnicastV6.addSubnet("2000::", 3, "ipv6");
for (const [network, prefix] of [
  ["2001::", 32],
  ["2001:db8::", 32],
  ["2002::", 16],
] as const) {
  nonPublic.addSubnet(network, prefix, "ipv6");
}

function isPublicAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 4) return !nonPublic.check(address, "ipv4");
  if (family === 6) return globalUnicastV6.check(address, "ipv6") && !nonPublic.check(address, "ipv6");
  return false;
}

function resolveAll(hostname: string): Promise<LookupAddress[]> {
  return new Promise((resolve, reject) => {
    dnsLookup(hostname, { all: true }, (error, addresses) => (error ? reject(error) : resolve(addresses)));
  });
}

/** DNS lookup for outgoing connections that refuses any non-public address. */
const publicOnlyLookup: LookupFunction = (hostname, options, callback) => {
  resolveAll(hostname).then(
    (addresses) => {
      const usable = addresses.filter((entry) => !options.family || entry.family === options.family);
      if (usable.length === 0 || addresses.some((entry) => !isPublicAddress(entry.address))) {
        callback(Object.assign(new Error(`${hostname} does not resolve to a public address`), { code: "EPRIVATE" }), "");
        return;
      }
      if (options.all) callback(null, usable);
      else callback(null, usable[0].address, usable[0].family);
    },
    (error: NodeJS.ErrnoException) => callback(error, ""),
  );
};

/** URL rules that hold for the pasted link and for every redirect. */
function assertFetchableUrl(url: URL): void {
  if (url.protocol !== "https:") throw new BadRequestError("Only https links can be read");
  if (url.username || url.password) throw new BadRequestError("Links with credentials are not accepted");
  if (url.port && url.port !== "443") throw new BadRequestError("Links with a custom port are not accepted");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (isIP(host)) throw new BadRequestError("Links must use a domain name, not an IP address");
  if (!host.includes(".")) throw new BadRequestError("Links must point to a public website");
}

/**
 * Turns whatever the person pasted (a bare link, or a WhatsApp message that contains one) into the
 * canonical URL that identifies the property: https, no fragment, no tracking parameters.
 */
export function canonicalizeLink(raw: string): string {
  const candidate = raw.match(/https?:\/\/[^\s<>"']+/i)?.[0] ?? raw.trim();
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    throw new BadRequestError("Expected a full link, such as https://…");
  }
  if (url.protocol === "http:") url.protocol = "https:";
  assertFetchableUrl(url);

  url.hash = "";
  for (const key of [...url.searchParams.keys()]) {
    if (TRACKING_PARAMS.test(key)) url.searchParams.delete(key);
  }
  return url.toString();
}

/** Rejects links whose host does not exist or is not on the public internet, before reading them. */
export async function assertPublicHost(link: string): Promise<void> {
  const { hostname } = new URL(link);
  const addresses = await resolveAll(hostname).catch(() => []);
  if (addresses.length === 0) throw new BadRequestError("That link points to a website that does not exist");
  if (addresses.some((entry) => !isPublicAddress(entry.address))) {
    throw new BadRequestError("That link does not point to a public website");
  }
}

// ---------------------------------------------------------------------------
// Guarded HTTP
// ---------------------------------------------------------------------------

type RawResponse = { url: URL; status: number; headers: IncomingHttpHeaders; body: string };

function decodeBody(chunks: Buffer[], contentType: string | undefined): string {
  const charset = contentType?.match(/charset=["']?([\w-]+)/i)?.[1] ?? "utf-8";
  try {
    return new TextDecoder(charset).decode(Buffer.concat(chunks));
  } catch {
    return new TextDecoder("utf-8").decode(Buffer.concat(chunks));
  }
}

/** One GET without following redirects. Bodies over `maxBytes` (after decompression) are truncated. */
function getOnce(url: URL, accept: string, maxBytes: number, signal: AbortSignal): Promise<RawResponse> {
  return new Promise((resolve, reject) => {
    const req = request(
      url,
      {
        method: "GET",
        lookup: publicOnlyLookup,
        signal,
        headers: {
          "user-agent": USER_AGENT,
          accept,
          "accept-language": "es-AR,es;q=0.9,en;q=0.5",
          "accept-encoding": "gzip, deflate, br",
        },
      },
      (res) => {
        const status = res.statusCode ?? 0;
        if (status >= 300 && status < 400) {
          res.resume();
          resolve({ url, status, headers: res.headers, body: "" });
          return;
        }

        const encoding = String(res.headers["content-encoding"] ?? "").toLowerCase();
        const stream: Readable =
          encoding === "gzip" ? res.pipe(createGunzip())
          : encoding === "br" ? res.pipe(createBrotliDecompress())
          : encoding === "deflate" ? res.pipe(createInflate())
          : res;

        const chunks: Buffer[] = [];
        let size = 0;
        let done = false;
        const finish = () => {
          if (done) return;
          done = true;
          resolve({ url, status, headers: res.headers, body: decodeBody(chunks, res.headers["content-type"]) });
        };
        stream.on("data", (chunk: Buffer) => {
          if (done) return;
          chunks.push(chunk.subarray(0, Math.max(0, maxBytes - size)));
          size += chunk.length;
          if (size >= maxBytes) {
            finish();
            req.destroy();
          }
        });
        stream.on("end", finish);
        stream.on("error", (error) => (done ? undefined : reject(error)));
      },
    );
    req.on("error", reject);
    req.end();
  });
}

/** GET that follows redirects itself, re-checking every hop. */
async function safeGet(start: URL, accept: string, maxBytes: number, signal: AbortSignal): Promise<RawResponse> {
  let url = start;
  for (let hop = 0; ; hop++) {
    assertFetchableUrl(url);
    const response = await getOnce(url, accept, maxBytes, signal);
    const location = response.headers.location;
    if (response.status < 300 || response.status >= 400 || !location) return response;
    if (hop >= MAX_REDIRECTS) throw new Error(`More than ${MAX_REDIRECTS} redirects`);
    url = new URL(location, url);
  }
}

// ---------------------------------------------------------------------------
// robots.txt (RFC 9309)
// ---------------------------------------------------------------------------

type RobotsRule = { allow: boolean; pattern: string };

function robotsRulesFor(robotsTxt: string, token: string): RobotsRule[] {
  const groups: { agents: string[]; rules: RobotsRule[] }[] = [];
  let current: (typeof groups)[number] | null = null;
  let readingAgents = false;

  for (const rawLine of robotsTxt.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, "").trim();
    const colon = line.indexOf(":");
    if (colon <= 0) continue;
    const field = line.slice(0, colon).trim().toLowerCase();
    const value = line.slice(colon + 1).trim();

    if (field === "user-agent") {
      if (!current || !readingAgents) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      readingAgents = true;
    } else if (field === "allow" || field === "disallow") {
      readingAgents = false;
      // An empty Disallow allows everything, which is the default anyway.
      if (current && value) current.rules.push({ allow: field === "allow", pattern: value });
    }
  }

  const own = groups.filter((group) => group.agents.includes(token));
  const chosen = own.length > 0 ? own : groups.filter((group) => group.agents.includes("*"));
  return chosen.flatMap((group) => group.rules);
}

function robotsPatternMatches(pattern: string, path: string): boolean {
  const anchored = pattern.endsWith("$");
  const body = (anchored ? pattern.slice(0, -1) : pattern)
    .split("*")
    .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, "\\$&"))
    .join(".*");
  return new RegExp(`^${body}${anchored ? "$" : ""}`).test(path);
}

/** Longest matching rule wins; on a tie, Allow wins. */
function robotsAllows(rules: RobotsRule[], path: string): boolean {
  let best: RobotsRule | null = null;
  for (const rule of rules) {
    if (!robotsPatternMatches(rule.pattern, path)) continue;
    if (!best || rule.pattern.length > best.pattern.length || (rule.pattern.length === best.pattern.length && rule.allow)) {
      best = rule;
    }
  }
  return best?.allow ?? true;
}

/**
 * A server error on robots.txt means "assume disallowed"; 4xx (or an empty challenge page) means no
 * rules. Network failures throw, so the caller retries later instead of caching a refusal.
 */
async function isAllowedByRobots(url: URL, signal: AbortSignal): Promise<boolean> {
  const response = await safeGet(new URL("/robots.txt", url), "text/plain,*/*;q=0.5", MAX_ROBOTS_BYTES, signal);
  if (response.status >= 500) return false;
  if (response.status !== 200) return true;
  return robotsAllows(robotsRulesFor(response.body, ROBOTS_TOKEN), url.pathname + url.search);
}

// ---------------------------------------------------------------------------
// Extraction
// ---------------------------------------------------------------------------

export type LinkPrice = {
  amount: number;
  currency: "USD" | "ARS";
  source: "json-ld" | "microdata" | "meta" | "text";
};

export type LinkPage = {
  title: string | null;
  description: string | null;
  images: string[];
  price: LinkPrice | null;
  listingType: "sale" | "rent" | null;
  location: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  areaM2: number | null;
  coordinates: { lat: number; lng: number } | null;
};

export type LinkPageResult =
  | { ok: true; page: LinkPage }
  | { ok: false; reason: "robots" | "blocked" | "not_html" | "http_error" };

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  aacute: "á", eacute: "é", iacute: "í", oacute: "ó", uacute: "ú", ntilde: "ñ", uuml: "ü",
  Aacute: "Á", Eacute: "É", Iacute: "Í", Oacute: "Ó", Uacute: "Ú", Ntilde: "Ñ", Uuml: "Ü",
  sup2: "²", deg: "°", middot: "·", ndash: "–", mdash: "—", hellip: "…",
};

function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z0-9]+);/gi, (match, entity: string) => {
    if (entity[0] === "#") {
      const code = entity[1].toLowerCase() === "x" ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : match;
    }
    return NAMED_ENTITIES[entity] ?? match;
  });
}

function safeDecode(text: string): string {
  try {
    return decodeURIComponent(text);
  } catch {
    return text;
  }
}

function cleanText(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const text = decodeEntities(value).replace(/\s+/g, " ").replace(/^\*+|\*+$/g, "").trim();
  if (!text) return null;
  return text.length > maxLength ? `${text.slice(0, maxLength - 1).trimEnd()}…` : text;
}

function parseAttributes(tag: string): Record<string, string> {
  const attributes: Record<string, string> = {};
  for (const match of tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/g)) {
    attributes[match[1].toLowerCase()] = decodeEntities(match[2] ?? match[3] ?? match[4] ?? "");
  }
  return attributes;
}

/** meta tags keyed by property / name / itemprop, first occurrence wins. */
function readMetaTags(html: string): Map<string, string> {
  const meta = new Map<string, string>();
  for (const [tag] of html.matchAll(/<meta\b[^>]*>/gi)) {
    const attributes = parseAttributes(tag);
    const key = (attributes.property ?? attributes.name ?? attributes.itemprop)?.toLowerCase();
    if (key && attributes.content !== undefined && !meta.has(key)) meta.set(key, attributes.content);
  }
  return meta;
}

/**
 * Reads "290.000", "1.250.000,50", "394,000" or "45000". A single separator followed by groups of
 * exactly three digits is a thousands separator; otherwise it is the decimal mark.
 */
export function parseLocalizedNumber(raw: string): number | null {
  const text = raw.trim().replace(/[.,]+$/, "");
  if (!/^\d[\d.,]*$/.test(text)) return null;

  const lastDot = text.lastIndexOf(".");
  const lastComma = text.lastIndexOf(",");
  let normalized: string;
  if (lastDot >= 0 && lastComma >= 0) {
    const decimal = lastDot > lastComma ? "." : ",";
    const thousands = decimal === "." ? "," : ".";
    normalized = text.split(thousands).join("").replace(decimal, ".");
  } else if (lastDot >= 0 || lastComma >= 0) {
    const parts = text.split(lastDot >= 0 ? "." : ",");
    if (parts.slice(1).every((part) => part.length === 3)) normalized = parts.join("");
    else if (parts.length === 2) normalized = `${parts[0]}.${parts[1]}`;
    else return null;
  } else {
    normalized = text;
  }

  const value = Number(normalized);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) && value > 0 ? value : null;
  if (typeof value === "string") return parseLocalizedNumber(value.replace(/[^\d.,]/g, ""));
  return null;
}

function toCurrency(value: unknown): "USD" | "ARS" | null {
  if (typeof value !== "string") return null;
  const code = value.trim().toUpperCase().replace(/\s+/g, "");
  if (["USD", "US$", "U$S", "U$D", "DOLARES", "DÓLARES"].includes(code)) return "USD";
  if (["ARS", "AR$", "$", "PESOS"].includes(code)) return "ARS";
  return null;
}

type JsonObject = Record<string, unknown>;

const isObject = (value: unknown): value is JsonObject => typeof value === "object" && value !== null && !Array.isArray(value);
const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : value === undefined || value === null ? [] : [value]);

function typesOf(node: JsonObject): string[] {
  return asArray(node["@type"]).filter((type): type is string => typeof type === "string");
}

/** Every object in the JSON-LD blocks of the page, flattening arrays and @graph. */
function readJsonLd(html: string): JsonObject[] {
  const nodes: JsonObject[] = [];
  const visit = (value: unknown, depth: number) => {
    if (depth > 4) return;
    for (const item of asArray(value)) {
      if (!isObject(item)) continue;
      nodes.push(item);
      if (item["@graph"]) visit(item["@graph"], depth + 1);
    }
  };
  for (const match of html.matchAll(/<script\b[^>]*type\s*=\s*["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      visit(JSON.parse(match[1].trim()), 0);
    } catch {
      // Broken JSON-LD is common; skip the block.
    }
  }
  return nodes;
}

const LISTING_TYPES = ["RealEstateListing", "Offer", "Product", "Residence", "House", "SingleFamilyResidence", "Apartment", "Accommodation", "Place"];

/** The JSON-LD node that best describes the listing, with the objects that usually hang off it. */
function pickListingNode(nodes: JsonObject[]): JsonObject[] | null {
  for (const type of LISTING_TYPES) {
    const node = nodes.find((candidate) => typesOf(candidate).includes(type));
    if (node) {
      return [node, node.about, node.itemOffered, node.mainEntity, node.mainEntityOfPage].filter(isObject);
    }
  }
  return null;
}

function firstValue(objects: JsonObject[], key: string): unknown {
  for (const object of objects) {
    if (object[key] !== undefined && object[key] !== null) return object[key];
  }
  return undefined;
}

function jsonLdPrice(objects: JsonObject[]): LinkPrice | null {
  const offers = [...objects.filter((object) => typesOf(object).includes("Offer")), ...objects.flatMap((object) => asArray(object.offers))];
  for (const offer of offers.filter(isObject)) {
    const specification = asArray(offer.priceSpecification).find(isObject);
    const amount = toNumber(offer.price ?? offer.lowPrice ?? specification?.price);
    const currency = toCurrency(offer.priceCurrency ?? specification?.priceCurrency);
    if (amount && currency) return { amount, currency, source: "json-ld" };
  }
  return null;
}

function jsonLdLocation(objects: JsonObject[]): string | null {
  const address = firstValue(objects, "address");
  if (typeof address === "string") return cleanText(address, 120);
  if (!isObject(address)) return null;
  const parts = [address.addressLocality, address.addressRegion]
    .map((part) => cleanText(part, 60))
    .filter((part): part is string => part !== null);
  return parts.length > 0 ? [...new Set(parts)].join(", ") : null;
}

function jsonLdArea(objects: JsonObject[]): number | null {
  const size = firstValue(objects, "floorSize");
  const value = toNumber(isObject(size) ? size.value : size);
  if (!value) return null;
  const unit = isObject(size) ? String(size.unitCode ?? size.unitText ?? "").toUpperCase() : "";
  const squareMeters = unit === "FTK" || unit.includes("FT") ? value * 0.092903 : value;
  return Math.round(squareMeters);
}

function jsonLdImages(objects: JsonObject[]): string[] {
  return asArray(firstValue(objects, "image")).flatMap((image) => {
    if (typeof image === "string") return [image];
    if (isObject(image) && typeof image.url === "string") return [image.url];
    return [];
  });
}

function jsonLdCoordinates(objects: JsonObject[]): LinkPage["coordinates"] {
  const geo = firstValue(objects, "geo");
  if (!isObject(geo)) return null;
  const lat = Number(geo.latitude);
  const lng = Number(geo.longitude);
  return Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0) ? { lat, lng } : null;
}

function microdataValue(html: string, property: string): string | null {
  const match = html.match(new RegExp(`<[a-z]+\\b[^>]*itemprop\\s*=\\s*["']${property}["'][^>]*>([^<]*)`, "i"));
  if (!match) return null;
  const content = parseAttributes(match[0]).content;
  return cleanText(content ?? match[1], 60);
}

/** A price written in a title or description, e.g. "US$ 290.000" or "$ 450.000" on Argentine sites. */
function textPrice(texts: (string | null)[], pesosForBareDollar: boolean): LinkPrice | null {
  const usd = /(?:US\$|U\$S|U\$D|USD|d[oó]lares)\s*([\d][\d.,]*)/i;
  const ars = /(?:ARS|AR\$|(?<![A-Za-z$])\$)\s*([\d][\d.,]*)/;
  for (const text of texts) {
    if (!text) continue;
    for (const [pattern, currency] of [[usd, "USD"], [ars, "ARS"]] as const) {
      if (currency === "ARS" && !pesosForBareDollar && !/ARS|AR\$/.test(text)) continue;
      const match = text.match(pattern);
      if (!match || match.index === undefined) continue;
      // "Expensas $ 120.000" is the monthly building fee, not the price.
      if (/expensa/i.test(text.slice(Math.max(0, match.index - 20), match.index))) continue;
      const amount = parseLocalizedNumber(match[1]);
      if (amount) return { amount, currency, source: "text" };
    }
  }
  return null;
}

/** Sale or rent, from the first text that says one and not the other (title and URL before description). */
function detectListingType(texts: string[]): "sale" | "rent" | null {
  for (const text of texts) {
    const rent = /alquil|arriendo|for rent|\bleases?\b/i.test(text);
    const sale = /\bventa\b|\bvende|for sale/i.test(text);
    if (rent !== sale) return rent ? "rent" : "sale";
  }
  return null;
}

function absoluteHttpsUrls(urls: string[], base: URL): string[] {
  const result = new Set<string>();
  for (const raw of urls) {
    try {
      const url = new URL(decodeEntities(raw.trim()), base);
      if (url.protocol === "https:") result.add(url.toString());
    } catch {
      // Skip malformed image URLs.
    }
    if (result.size >= MAX_IMAGES) break;
  }
  return [...result];
}

function stripSiteName(title: string | null, siteName: string | null): string | null {
  if (!title || !siteName) return title;
  const escaped = siteName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return title.replace(new RegExp(`\\s*[|–—-]\\s*${escaped}\\s*$`, "i"), "").trim() || title;
}

export function extractListing(html: string, pageUrl: URL): LinkPage {
  const meta = readMetaTags(html);
  const listing = pickListingNode(readJsonLd(html)) ?? [];

  const siteName = cleanText(meta.get("og:site_name"), 80);
  const documentTitle = cleanText(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1], 200);
  const title = stripSiteName(
    cleanText(meta.get("og:title") ?? meta.get("twitter:title"), 200) ?? cleanText(firstValue(listing, "name"), 200) ?? documentTitle,
    siteName,
  );
  const description =
    cleanText(firstValue(listing, "description"), 1000) ??
    cleanText(meta.get("og:description") ?? meta.get("twitter:description") ?? meta.get("description"), 1000);

  const microdataAmount = microdataValue(html, "price");
  const microdataCurrency = microdataValue(html, "priceCurrency");
  const metaAmount = meta.get("product:price:amount") ?? meta.get("og:price:amount");
  const metaCurrency = meta.get("product:price:currency") ?? meta.get("og:price:currency");
  const pesosForBareDollar = pageUrl.hostname.endsWith(".ar") || meta.get("og:locale")?.toLowerCase() === "es_ar";

  const fromMicrodata = toNumber(microdataAmount);
  const microdataCurrencyCode = toCurrency(microdataCurrency);
  const fromMeta = toNumber(metaAmount);
  const metaCurrencyCode = toCurrency(metaCurrency);
  const price =
    jsonLdPrice(listing) ??
    (fromMicrodata && microdataCurrencyCode ? { amount: fromMicrodata, currency: microdataCurrencyCode, source: "microdata" as const } : null) ??
    (fromMeta && metaCurrencyCode ? { amount: fromMeta, currency: metaCurrencyCode, source: "meta" as const } : null) ??
    textPrice([meta.get("og:title") ?? null, documentTitle, meta.get("og:description") ?? null, meta.get("description") ?? null], pesosForBareDollar);

  const images = absoluteHttpsUrls(
    [...jsonLdImages(listing), meta.get("og:image"), meta.get("twitter:image")].filter((url): url is string => !!url),
    pageUrl,
  );

  return {
    title,
    description,
    images,
    price,
    listingType: detectListingType([`${title ?? ""} ${safeDecode(pageUrl.pathname)}`, description ?? ""]),
    location: jsonLdLocation(listing),
    bedrooms: toNumber(firstValue(listing, "numberOfBedrooms")),
    bathrooms: toNumber(firstValue(listing, "numberOfBathroomsTotal") ?? firstValue(listing, "numberOfFullBathrooms")),
    areaM2: jsonLdArea(listing),
    coordinates: jsonLdCoordinates(listing),
  };
}

/** Sites answer automated reads with a challenge page instead of the listing. */
function isChallenge(response: RawResponse): boolean {
  if (response.headers["cf-mitigated"] || response.headers["x-amzn-waf-action"]) return true;
  return response.status === 202 || response.status === 403 || response.status === 429 || /<title>\s*Just a moment/i.test(response.body.slice(0, 4096));
}

/**
 * Reads a listing page given its canonical URL (see `canonicalizeLink`). Definitive outcomes are
 * cached for hours; network failures and timeouts throw so they are retried on the next request.
 */
export async function readLinkPage(link: string): Promise<LinkPageResult> {
  "use cache";
  cacheLife("hours");

  const url = new URL(link);
  const signal = AbortSignal.timeout(TIMEOUT_MS);

  if (!(await isAllowedByRobots(url, signal))) return { ok: false, reason: "robots" };

  const response = await safeGet(url, "text/html,application/xhtml+xml;q=0.9,*/*;q=0.5", MAX_PAGE_BYTES, signal);
  if (isChallenge(response)) return { ok: false, reason: "blocked" };
  if (response.status !== 200) return { ok: false, reason: "http_error" };
  if (!/text\/html|application\/xhtml\+xml/i.test(String(response.headers["content-type"] ?? ""))) {
    return { ok: false, reason: "not_html" };
  }
  return { ok: true, page: extractListing(response.body, response.url) };
}

/** A readable title from the URL alone ("/propiedad/casa-3-ambientes-belgrano-d9e19d30"). */
export function titleFromUrl(link: string): string {
  const url = new URL(link);
  const segments = url.pathname
    .split("/")
    .map((segment) => safeDecode(segment).replace(/\.(html?|php|aspx?)$/i, ""))
    .filter((segment) => /[a-záéíóúñ]{3,}/i.test(segment));

  const words = (segments.at(-1) ?? "")
    .split(/[-_+\s]+/)
    // Drop ids such as "d9e19d30", "507482", "MLA" or "JM"; keep "3" in "casa-3-ambientes".
    .filter((word) => word && !/^\d{5,}$/.test(word) && !/^(?=.*\d)[0-9a-f]{6,}$/i.test(word) && !/^(mla\d*|jm)$/i.test(word));
  const title = words.join(" ").trim();
  if (title.length < 4) return url.hostname.replace(/^www\./, "");
  return title[0].toUpperCase() + title.slice(1);
}
