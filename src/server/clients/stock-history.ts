import "server-only";

import { cacheLife } from "next/cache";
import { z } from "zod";

/**
 * One year of monthly closes for the share behind a tokenized stock, from a public chart endpoint
 * (the same source the deploy uses to size collateral ratios). Presentation only: never used for money.
 */
const CHART_URL = "https://query1.finance.yahoo.com/v8/finance/chart";
const TIMEOUT_MS = 5_000;

const chartSchema = z.object({
  chart: z.object({
    result: z
      .array(
        z.object({
          indicators: z.object({
            quote: z.array(z.object({ close: z.array(z.number().nullable()).optional() })),
          }),
        }),
      )
      .nullable()
      .optional(),
  }),
});

/** Percent change over the last 12 months, or null when the source has no data for the ticker. */
export async function getChange12mPct(ticker: string): Promise<number | null> {
  "use cache";
  cacheLife("hours");

  try {
    const url = `${CHART_URL}/${encodeURIComponent(ticker)}?range=1y&interval=1mo`;
    const response = await fetch(url, {
      headers: { accept: "application/json", "user-agent": "Mozilla/5.0 (accasa-app)" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) return null;

    const closes = (chartSchema.parse(await response.json()).chart.result?.[0]?.indicators.quote[0]?.close ?? []).filter(
      (value): value is number => value !== null && value > 0,
    );
    if (closes.length < 6) return null;

    const first = closes[0];
    const last = closes[closes.length - 1];
    return Math.round(((last - first) / first) * 1000) / 10;
  } catch {
    return null;
  }
}
