import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";

import { SiteHeader } from "@/components/layout/site-header";
import { isTestMode } from "@/components/layout/test-mode";
import { locales } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";
import { Providers } from "@/lib/providers";

import "../globals.css";

/**
 * Archivo, by the Buenos Aires foundry Omnibus-Type. One variable family carries the whole
 * identity: its width axis (62–125) goes expanded and heavy for headlines and money, and stays
 * normal for reading.
 */
const archivo = Archivo({
  subsets: ["latin", "latin-ext"],
  axes: ["wdth"],
  variable: "--font-archivo",
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
    <html lang={lang} className={`${archivo.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-4 focus:py-3 focus:font-semibold"
        >
          {dict.common.skipToContent}
        </a>
        <Providers labels={dict.account}>
          <SiteHeader lang={lang} common={dict.common} testMode={isTestMode()} />
          <main id="contenido" className="flex flex-1 flex-col">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
