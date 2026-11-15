"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";

import type { PropertySummary } from "@/domain/property";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/es";
import { fill, plural } from "@/i18n/format";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { WaitBar } from "@/components/ui/wait-bar";

import { listProperties, previewLink, propertyHref, stashProperty } from "./api";
import { PropertyCard, PropertyCardSkeleton } from "./property-card";

const PAGE_SIZE = 12;

/** Featured listings mix homes and land; lead with homes, the thing people save a seña for. */
function homesFirst(items: PropertySummary[]): PropertySummary[] {
  const isHome = (item: PropertySummary) => (item.bedrooms ?? 0) > 0;
  return [...items.filter(isHome), ...items.filter((item) => !isHome(item))];
}

type Labels = {
  search: Dictionary["search"];
  common: Dictionary["common"];
};

type ListState =
  | { status: "loading"; items: PropertySummary[] }
  | { status: "ready"; items: PropertySummary[]; total: number; hasMore: boolean; loadingMore?: boolean }
  | { status: "error"; items: PropertySummary[] };

/** Search over Smarlin listings plus the "paste a link" entry for any other portal. */
export function PropertySearch({ lang, labels }: { lang: Locale; labels: Labels }) {
  const { search, common } = labels;
  const router = useRouter();
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [activeQuery, setActiveQuery] = useState(params.get("q") ?? "");
  const [list, setList] = useState<ListState>({ status: "loading", items: [] });
  const [attempt, setAttempt] = useState(0);

  // Debounce typing into a search; Enter searches right away.
  useEffect(() => {
    const value = query.trim();
    if (value === activeQuery) return;
    const timer = window.setTimeout(() => setActiveQuery(value), 450);
    return () => window.clearTimeout(timer);
  }, [query, activeQuery]);

  useEffect(() => {
    const controller = new AbortController();
    const url = new URL(window.location.href);
    if (activeQuery) url.searchParams.set("q", activeQuery);
    else url.searchParams.delete("q");
    window.history.replaceState(null, "", url);

    listProperties(
      { q: activeQuery || undefined, type: "sale", featured: !activeQuery, limit: PAGE_SIZE },
      controller.signal,
    )
      .then((page) =>
        setList({
          status: "ready",
          items: activeQuery ? page.items : homesFirst(page.items),
          total: page.total,
          hasMore: page.hasMore,
        }),
      )
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        console.error(error);
        setList({ status: "error", items: [] });
      });
    return () => {
      controller.abort();
      setList({ status: "loading", items: [] });
    };
  }, [activeQuery, attempt]);

  async function loadMore() {
    if (list.status !== "ready") return;
    setList({ ...list, loadingMore: true });
    try {
      const page = await listProperties({
        q: activeQuery || undefined,
        type: "sale",
        featured: !activeQuery,
        limit: PAGE_SIZE,
        offset: list.items.length,
      });
      setList({ status: "ready", items: [...list.items, ...page.items], total: page.total, hasMore: page.hasMore });
    } catch (error) {
      console.error(error);
      setList({ ...list, loadingMore: false });
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    setActiveQuery(query.trim());
  }

  const cardLabels = { ...common, ...search };

  return (
    <div>
      <form role="search" onSubmit={submit} className="relative">
        <label htmlFor="property-search" className="sr-only">
          {search.inputLabel}
        </label>
        <svg viewBox="0 0 20 20" aria-hidden className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-ink-2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="9" cy="9" r="5.5" />
          <path d="M13.2 13.2L17 17" />
        </svg>
        <input
          id="property-search"
          type="search"
          inputMode="search"
          enterKeyHint="search"
          autoComplete="off"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={search.inputPlaceholder}
          className="h-14 w-full rounded-[var(--radius-control)] border border-line-strong bg-surface pl-12 pr-4 text-lead text-ink placeholder:text-ink-3 focus:border-ink focus:outline-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]"
        />
        <button type="submit" className="sr-only">
          {search.submit}
        </button>
      </form>

      <LinkPaste
        lang={lang}
        labels={search.link}
        wait={common}
        onFound={(property) => {
          stashProperty(property);
          router.push(propertyHref(lang, property.ref, property.sourceUrl));
        }}
      />

      <section aria-labelledby="results-heading" className="mt-10">
        <h2 id="results-heading" className="type-heading text-h3 text-ink">
          {activeQuery && list.status === "ready"
            ? fill(plural(search.results, list.total), { q: activeQuery })
            : search.featured}
        </h2>

        {list.status === "loading" && (
          <>
            <WaitBar
              className="mt-4 max-w-sm"
              steps={[search.loading]}
              typicalSeconds={search.loadingSeconds}
              labels={common}
            />
            <div className="mt-6 grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }, (_, index) => (
                <PropertyCardSkeleton key={index} />
              ))}
            </div>
          </>
        )}

        {list.status === "error" && (
          <Notice
            tone="error"
            className="mt-4"
            action={
              <Button variant="secondary" size="md" onClick={() => setAttempt((value) => value + 1)}>
                {common.retry}
              </Button>
            }
          >
            {search.error}
          </Notice>
        )}

        {list.status === "ready" && list.items.length === 0 && (
          <p className="mt-4 max-w-prose text-lead text-ink-2">{fill(search.empty, { q: activeQuery })}</p>
        )}

        {list.status === "ready" && list.items.length > 0 && (
          <>
            <ul className="mt-5 grid gap-x-5 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
              {list.items.map((property, index) => (
                <li key={property.ref}>
                  <PropertyCard property={property} lang={lang} labels={cardLabels} priority={index < 2} />
                </li>
              ))}
            </ul>
            {list.hasMore && (
              <div className="mt-10 flex justify-center">
                <Button variant="secondary" onClick={loadMore} disabled={list.loadingMore}>
                  {search.more}
                </Button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

type LinkPasteProps = {
  lang: Locale;
  labels: Dictionary["search"]["link"];
  wait: Dictionary["common"];
  onFound: (property: Awaited<ReturnType<typeof previewLink>>) => void;
};

function LinkPaste({ labels, wait, onFound }: LinkPasteProps) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [state, setState] = useState<"idle" | "reading" | "invalid" | "error">("idle");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  async function read(event: FormEvent) {
    event.preventDefault();
    const value = url.trim();
    if (!/^https:\/\/\S+\.\S+/.test(value)) {
      setState("invalid");
      return;
    }
    setState("reading");
    try {
      onFound(await previewLink(value));
    } catch (error) {
      console.error(error);
      setState("error");
    }
  }

  return (
    <div className="mt-4 rounded-[var(--radius-sheet)] border border-line bg-surface p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <h2 className="font-semibold text-ink">{labels.title}</h2>
          <p className="text-ink-2">{labels.body}</p>
        </div>
        {!open && (
          <Button variant="secondary" size="md" onClick={() => setOpen(true)} aria-expanded={false}>
            <svg viewBox="0 0 20 20" className="size-4" aria-hidden fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8.5 11.5a3.5 3.5 0 0 0 5 0l2.5-2.5a3.5 3.5 0 0 0-5-5l-1 1M11.5 8.5a3.5 3.5 0 0 0-5 0L4 11a3.5 3.5 0 0 0 5 5l1-1" />
            </svg>
            {labels.open}
          </Button>
        )}
      </div>
      {open && (
        <form onSubmit={read} className="mt-4">
          <label htmlFor="listing-link" className="mb-1.5 block text-label font-semibold text-ink">
            {labels.inputLabel}
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              ref={inputRef}
              id="listing-link"
              type="url"
              inputMode="url"
              autoComplete="off"
              value={url}
              onChange={(event) => {
                setUrl(event.target.value);
                if (state !== "reading") setState("idle");
              }}
              placeholder={labels.inputPlaceholder}
              aria-invalid={state === "invalid"}
              aria-describedby={state === "invalid" ? "listing-link-error" : undefined}
              disabled={state === "reading"}
              className="h-12 min-w-0 flex-1 rounded-[var(--radius-control)] border border-line-strong bg-paper px-4 text-body text-ink placeholder:text-ink-3 focus:border-ink focus:outline-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]"
            />
            <Button type="submit" size="md" disabled={state === "reading"} className="min-h-12">
              {labels.submit}
            </Button>
          </div>
          {state === "invalid" && (
            <p id="listing-link-error" className="mt-2 text-label font-semibold text-danger">
              {labels.invalid}
            </p>
          )}
          {state === "reading" && (
            <WaitBar className="mt-4" steps={[labels.reading]} typicalSeconds={labels.readingSeconds} labels={wait} />
          )}
          {state === "error" && (
            <Notice tone="error" className="mt-4">
              {labels.error}
            </Notice>
          )}
        </form>
      )}
    </div>
  );
}
