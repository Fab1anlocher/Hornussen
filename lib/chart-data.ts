// Server-side chart aggregation. Turns the (large) observation list into small
// chart-ready arrays so we never ship the full dataset to the browser.
import type { Observation } from "./types";
import { mean, ols, stdErr } from "./stats";

export interface BinPoint {
  x: number; // bin midpoint
  y: number; // mean of metric
  count: number;
  se: number;
}

export interface TrendData {
  bins: BinPoint[];
  line: { x: number; y: number }[]; // OLS regression endpoints
  slope: number;
}

/** Bin observations by x into fixed-width bins, returning mean y + SE per bin. */
export function binnedTrend(
  obs: Observation[],
  xOf: (o: Observation) => number | undefined,
  yOf: (o: Observation) => number,
  binWidth: number,
  xMin: number,
  xMax: number,
): TrendData {
  const xs: number[] = [];
  const ys: number[] = [];
  const buckets = new Map<number, number[]>();
  for (const o of obs) {
    const x = xOf(o);
    if (x == null || !Number.isFinite(x)) continue;
    const y = yOf(o);
    if (!Number.isFinite(y)) continue;
    xs.push(x);
    ys.push(y);
    const b = Math.round((x - xMin) / binWidth);
    if (!buckets.has(b)) buckets.set(b, []);
    buckets.get(b)!.push(y);
  }
  const bins: BinPoint[] = [];
  for (const [b, vals] of [...buckets.entries()].sort((a, c) => a[0] - c[0])) {
    const mid = xMin + b * binWidth;
    if (mid < xMin || mid > xMax) continue;
    bins.push({ x: Math.round(mid * 100) / 100, y: mean(vals), count: vals.length, se: stdErr(vals) });
  }
  const { slope, intercept } = ols(xs, ys);
  const line = [
    { x: xMin, y: intercept + slope * xMin },
    { x: xMax, y: intercept + slope * xMax },
  ];
  return { bins, line, slope };
}
