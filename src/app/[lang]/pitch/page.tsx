import type { Metadata } from "next";

import { Deck } from "@/components/pitch/deck";
import { getLocale, getPitchDeck } from "@/i18n/get-dictionary";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getPitchDeck()).title };
}

/** The pitch deck (es/en). The only screen that names the technologies behind Seña. */
export default async function PitchPage() {
  const lang = await getLocale();
  const deck = await getPitchDeck(lang);
  return <Deck deck={deck} lang={lang} />;
}
