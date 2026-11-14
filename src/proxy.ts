import { NextResponse, type NextRequest } from "next/server";

import { defaultLocale, hasLocale, LOCALE_COOKIE, locales, type Locale } from "@/i18n/config";

/**
 * Request proxy. Runs a list of steps in order; the first one that returns a response wins.
 * Today it only adds the language prefix. The mainnet geo-block (owned by the integration role)
 * plugs in as another step placed before `localeRedirect`.
 */
type ProxyStep = (request: NextRequest) => NextResponse | undefined;

function pathnameLocale(pathname: string): Locale | null {
  const segment = pathname.split("/")[1] ?? "";
  return hasLocale(segment) ? segment : null;
}

/** Picks the best supported language from the cookie, then Accept-Language, then the default. */
function preferredLocale(request: NextRequest): Locale {
  const fromCookie = request.cookies.get(LOCALE_COOKIE)?.value;
  if (fromCookie && hasLocale(fromCookie)) return fromCookie;

  const header = request.headers.get("accept-language") ?? "";
  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const quality = params.find((param) => param.trim().startsWith("q="));
      return { base: tag.toLowerCase().split("-")[0], q: quality ? Number(quality.split("=")[1]) : 1 };
    })
    .filter((entry) => entry.base && !Number.isNaN(entry.q))
    .sort((a, b) => b.q - a.q);

  for (const { base } of ranked) {
    if ((locales as readonly string[]).includes(base)) return base as Locale;
  }
  return defaultLocale;
}

/** Adds the language prefix to any path that lacks one: /casa becomes /es/casa. */
const localeRedirect: ProxyStep = (request) => {
  const { pathname } = request.nextUrl;
  if (pathnameLocale(pathname)) return undefined;

  const url = request.nextUrl.clone();
  url.pathname = `/${preferredLocale(request)}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
};

const steps: ProxyStep[] = [localeRedirect];

export function proxy(request: NextRequest) {
  for (const step of steps) {
    const response = step(request);
    if (response) return response;
  }
  return NextResponse.next();
}

export const config = {
  // Pages only: skip API routes, Next internals and any file with an extension (images, icons).
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
