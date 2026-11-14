import "server-only";

import { notFound } from "next/navigation";
import { lang } from "next/root-params";

import { hasLocale, type Locale } from "./config";
import type { Dictionary } from "./dictionaries/es";
import type { PitchDeck } from "./pitch/es";

const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  es: () => import("./dictionaries/es").then((module) => module.default),
  en: () => import("./dictionaries/en").then((module) => module.default),
};

const pitchDecks: Record<Locale, () => Promise<PitchDeck>> = {
  es: () => import("./pitch/es").then((module) => module.default),
  en: () => import("./pitch/en").then((module) => module.default),
};

/** The current locale, read from the `[lang]` root segment. Unknown locales render the 404 page. */
export async function getLocale(): Promise<Locale> {
  const value = await lang();
  if (!hasLocale(value)) notFound();
  return value;
}

/** Dictionary for the current request's locale (or the one given). Server only. */
export async function getDictionary(locale?: Locale): Promise<Dictionary> {
  return dictionaries[locale ?? (await getLocale())]();
}

/** Pitch deck copy. Kept apart because it is the only place allowed to name technologies. */
export async function getPitchDeck(locale?: Locale): Promise<PitchDeck> {
  return pitchDecks[locale ?? (await getLocale())]();
}

export type { Dictionary, Locale };
