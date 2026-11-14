import { z } from "zod";

import { RISK, SOURCES } from "./deploy-config";
import { fetchJson } from "./http";

const DAY = 24 * 60 * 60;

const chartSchema = z.object({
  chart: z.object({
    result: z
      .array(
        z.object({
          meta: z.object({ symbol: z.string(), regularMarketPrice: z.number().optional() }),
          timestamp: z.array(z.number()).default([]),
          indicators: z.object({
            quote: z.array(z.object({ close: z.array(z.number().nullable()) })),
            adjclose: z.array(z.object({ adjclose: z.array(z.number().nullable()) })).optional(),
          }),
        }),
      )
      .nullable(),
  }),
});

export type RiskAssessment = {
  collateralRatioBps: number;
  /** Worst decline inside the window over the last year, e.g. 0.21 for -21%. Null without usable history. */
  worstDrop: number | null;
  sessions: number;
  /** Why the maximum ratio was used, when it was. */
  fallback?: string;
};

/**
 * Collateral ratio for one stock: the worst ~30-day decline of the last year, as `1 / (1 - drop)`,
 * rounded up to the next step and clamped. A stock without a year of clean history gets the maximum.
 */
export async function assessRisk(ticker: string, feedPriceUsd: number): Promise<RiskAssessment> {
  let chart: z.infer<typeof chartSchema>;
  try {
    const url = `${SOURCES.yahooChart}/${encodeURIComponent(ticker)}?range=1y&interval=1d`;
    chart = chartSchema.parse(await fetchJson(url, { "user-agent": "Mozilla/5.0 (sena-deploy)" }));
  } catch (error) {
    return maxRatio(0, `no price history (${(error as Error).message})`);
  }

  const result = chart.chart.result?.[0];
  if (!result) return maxRatio(0, "no price history");

  const rawCloses = result.indicators.adjclose?.[0]?.adjclose ?? result.indicators.quote[0]?.close ?? [];
  const points = result.timestamp
    .map((time, index) => ({ time, close: rawCloses[index] }))
    .filter((point): point is { time: number; close: number } => typeof point.close === "number" && point.close > 0);

  const lastClose = result.meta.regularMarketPrice ?? points.at(-1)?.close;
  if (!lastClose || Math.abs(lastClose - feedPriceUsd) / feedPriceUsd > RISK.priceTolerance) {
    return maxRatio(points.length, `history price ${lastClose} does not match feed price ${feedPriceUsd}`);
  }
  if (points.length < RISK.minSessions) return maxRatio(points.length, `only ${points.length} sessions of history`);

  const worstDrop = worstWindowDrop(points, RISK.windowDays * DAY);
  return { collateralRatioBps: ratioForDrop(worstDrop), worstDrop, sessions: points.length };
}

/** Largest decline from any close to a later close no more than `windowSeconds` after it. */
export function worstWindowDrop(points: { time: number; close: number }[], windowSeconds: number): number {
  let worst = 0;
  for (let start = 0; start < points.length; start++) {
    for (let end = start + 1; end < points.length && points[end].time - points[start].time <= windowSeconds; end++) {
      worst = Math.max(worst, 1 - points[end].close / points[start].close);
    }
  }
  return worst;
}

export function ratioForDrop(drop: number): number {
  if (drop >= 1) return RISK.maxRatioBps;
  const rawBps = 10_000 / (1 - drop);
  const stepped = Math.ceil(rawBps / RISK.stepBps - 1e-9) * RISK.stepBps; // epsilon: float noise is not risk
  return Math.min(RISK.maxRatioBps, Math.max(RISK.minRatioBps, stepped));
}

function maxRatio(sessions: number, fallback: string): RiskAssessment {
  return { collateralRatioBps: RISK.maxRatioBps, worstDrop: null, sessions, fallback };
}
