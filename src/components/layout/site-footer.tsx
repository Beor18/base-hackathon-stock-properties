import Link from "next/link";

import { Wordmark } from "@/components/brand/wordmark";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/es";

type SiteFooterProps = { lang: Locale; footer: Dictionary["footer"] };

export function SiteFooter({ lang, footer }: SiteFooterProps) {
  return (
    <footer className="mx-auto mt-auto w-full max-w-6xl px-5 pb-10 pt-16 md:px-8">
      <div className="flex flex-col gap-6 border-t border-line pt-8 md:flex-row md:items-end md:justify-between">
        <div className="max-w-md">
          <Wordmark title="" className="h-6 w-auto text-ink" />
          <p className="mt-4 text-label text-ink-2">{footer.data}</p>
          <p className="mt-1 text-label text-ink-2">{footer.risk}</p>
        </div>
        <nav className="-ml-2 flex flex-wrap gap-x-2 text-label font-semibold">
          <Link href={`/${lang}/pedir`} className="inline-flex min-h-11 items-center px-2 text-ink-2 hover:text-ink">
            {footer.brokers}
          </Link>
          <Link href={`/${lang}/pitch`} className="inline-flex min-h-11 items-center px-2 text-ink-2 hover:text-ink">
            {footer.pitch}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
