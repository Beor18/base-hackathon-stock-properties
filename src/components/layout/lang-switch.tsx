"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { LOCALE_COOKIE, type Locale } from "@/i18n/config";

type LangSwitchProps = { current: Locale; label: string; switchTo: string };

/** Swaps the language segment of the current URL and remembers the choice. */
export function LangSwitch({ current, label, switchTo }: LangSwitchProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const target: Locale = current === "es" ? "en" : "es";
  const rest = pathname.split("/").slice(2).join("/");
  const query = searchParams.toString();
  const href = `/${target}${rest ? `/${rest}` : ""}${query ? `?${query}` : ""}`;

  return (
    <Link
      href={href}
      hrefLang={target}
      lang={target}
      aria-label={`${label}: ${switchTo}`}
      onClick={() => {
        document.cookie = `${LOCALE_COOKIE}=${target}; path=/; max-age=31536000; samesite=lax`;
      }}
      className="inline-flex min-h-11 items-center rounded-full px-3 text-label font-semibold text-ink-2 hover:text-ink"
    >
      {switchTo}
    </Link>
  );
}
