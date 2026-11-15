import type { Metadata, Viewport } from "next";
import { Archivo, Bricolage_Grotesque } from "next/font/google";

import { SiteHeader } from "@/components/layout/site-header";
import { locales } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";
import { Providers } from "@/lib/providers";

import "../globals.css";

/** Reading text: Archivo, by the Buenos Aires foundry Omnibus-Type, at its normal width. */
const archivo = Archivo({
  subsets: ["latin", "latin-ext"],
  variable: "--font-archivo",
  display: "swap",
});

/**
 * Headlines and money: Bricolage Grotesque. Its optical-size axis draws large type with open
 * counters and ink traps at normal proportions, so big titles read tall instead of squashed.
 */
const bricolage = Bricolage_Grotesque({
  subsets: ["latin", "latin-ext"],
  axes: ["opsz"],
  variable: "--font-bricolage",
  display: "swap",
});

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return {
    title: { default: dict.meta.title, template: `%s | ${dict.common.brand}` },
    description: dict.meta.description,
    applicationName: dict.common.brand,
    icons: { icon: "/icon.svg", apple: "/icon.svg" },
    alternates: { languages: { es: "/es", en: "/en" } },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f4ef" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1c24" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/[lang]">) {
  const lang = await getLocale();
  const dict = await getDictionary(lang);

  return (
    <html lang={lang} className={`${archivo.variable} ${bricolage.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-4 focus:py-3 focus:font-semibold"
        >
          {dict.common.skipToContent}
        </a>
        <Providers labels={dict.account}>
          <SiteHeader lang={lang} common={dict.common} />
          <main id="contenido" className="flex flex-1 flex-col">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
