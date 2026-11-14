import { intlLocale, type Locale } from "./config";

/**
 * Formatting helpers shared by server and client components.
 * Money is written as "USD 19.750" in both languages: the people using Seña think in dollars,
 * and the explicit code avoids confusing USD with pesos (both use "$" in Argentina).
 */

const integerFormatters = new Map<string, Intl.NumberFormat>();

function numberFormat(locale: Locale, options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = `${locale}:${JSON.stringify(options)}`;
  let formatter = integerFormatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(intlLocale[locale], options);
    integerFormatters.set(key, formatter);
  }
  return formatter;
}

/** "USD 19.750" or, with cents, "USD 0,20". Cents are shown only for amounts under 1.000. */
export function formatMoney(amount: number, locale: Locale, currency: "USD" | "ARS" = "USD"): string {
  const showCents = Math.abs(amount) < 1000 && !Number.isInteger(Math.round(amount * 100) / 100);
  const formatted = numberFormat(locale, {
    minimumFractionDigits: showCents ? 2 : 0,
    maximumFractionDigits: showCents ? 2 : 0,
  }).format(amount);
  return `${currency} ${formatted}`;
}

/** Number only, no currency, for large display figures where the currency is set apart. */
export function formatAmount(amount: number, locale: Locale, fractionDigits = 0): string {
  return numberFormat(locale, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(amount);
}

/** Share quantities: up to 4 decimals, trimmed. */
export function formatShares(amount: number, locale: Locale): string {
  return numberFormat(locale, { maximumFractionDigits: amount < 1 ? 4 : 2 }).format(amount);
}

/** Spanish separates the sign ("5 %"), English does not ("5%"). ICU versions disagree, so normalize. */
function percentSpacing(formatted: string, locale: Locale): string {
  const compact = formatted.replace(/\s*%/, "%");
  return locale === "es" ? compact.replace("%", "\u00a0%") : compact;
}

/** Formats a ratio (0.05) as a percent: "5 %" in Spanish, "5%" in English. */
export function formatPercent(value: number, locale: Locale, { signed = false, digits = 0 } = {}): string {
  const formatted = numberFormat(locale, {
    style: "percent",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
    signDisplay: signed ? "exceptZero" : "auto",
  }).format(value);
  return percentSpacing(formatted, locale);
}

/**
 * Progress toward the goal (0..1). Small steps still read as progress: "0,3 %" rather than "0 %",
 * and it never rounds up to "100 %" before the goal is actually met.
 */
export function formatProgress(value: number, locale: Locale): string {
  const clamped = Math.min(Math.max(value, 0), 1);
  const digits = clamped === 0 || clamped >= 0.01 ? 0 : clamped < 0.001 ? 2 : 1;
  return formatPercent(clamped < 1 ? Math.min(clamped, 0.99) : 1, locale, { digits });
}

/** Basis points to a readable percent, keeping up to two decimals ("0,5 %"). */
export function formatBps(bps: number, locale: Locale): string {
  const formatted = numberFormat(locale, {
    style: "percent",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(bps / 10_000);
  return percentSpacing(formatted, locale);
}

export function formatDate(unixSeconds: number, locale: Locale): string {
  return new Intl.DateTimeFormat(intlLocale[locale], { day: "numeric", month: "long", year: "numeric" }).format(
    new Date(unixSeconds * 1000),
  );
}

export function formatArea(m2: number, locale: Locale): string {
  return `${formatAmount(m2, locale)} m²`;
}

/** Fills `{name}` placeholders in a dictionary string. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}

/** Picks the singular or plural form of a "one|other" dictionary string. */
export function plural(template: string, count: number): string {
  const [one, other = one] = template.split("|");
  return fill(count === 1 ? one : other, { n: count });
}

/** Shortens an account address for display: 0x12ab…89ef. */
export function shortAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
