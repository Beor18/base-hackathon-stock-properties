/**
 * Locale configuration. Kept free of server-only imports so `src/proxy.ts` can use it.
 */
export const locales = ["es", "en"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "es";

/** Cookie that remembers an explicit language choice made with the language switch. */
export const LOCALE_COOKIE = "sena-lang";

export function hasLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/** BCP 47 tags used for number and date formatting. */
export const intlLocale: Record<Locale, string> = {
  es: "es-AR",
  en: "en-US",
};
