// Small, dependency-free statistics helpers used by the analysis engine.

export function mean(xs: number[]): number {
  if (xs.length === 0) return NaN;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

export function stdDev(xs: number[]): number {
  const n = xs.length;
  if (n < 2) return NaN;
  const m = mean(xs);
  const v = xs.reduce((a, b) => a + (b - m) * (b - m), 0) / (n - 1);
  return Math.sqrt(v);
}

export function stdErr(xs: number[]): number {
  const n = xs.length;
  if (n < 2) return NaN;
  return stdDev(xs) / Math.sqrt(n);
}

export function pearson(xs: number[], ys: number[]): number {
  const n = xs.length;
  if (n < 3) return NaN;
  const mx = mean(xs);
  const my = mean(ys);
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx;
    const dy = ys[i] - my;
    sxy += dx * dy;
    sxx += dx * dx;
    syy += dy * dy;
  }
  const denom = Math.sqrt(sxx * syy);
  return denom === 0 ? 0 : sxy / denom;
}

/** Fractional (average) ranks, correctly handling ties. */
function ranks(xs: number[]): number[] {
  const idx = xs.map((v, i) => [v, i] as [number, number]);
  idx.sort((a, b) => a[0] - b[0]);
  const r = new Array<number>(xs.length);
  let i = 0;
  while (i < idx.length) {
    let j = i;
    while (j + 1 < idx.length && idx[j + 1][0] === idx[i][0]) j++;
    const avgRank = (i + j) / 2 + 1; // 1-based average rank
    for (let k = i; k <= j; k++) r[idx[k][1]] = avgRank;
    i = j + 1;
  }
  return r;
}

export function spearman(xs: number[], ys: number[]): number {
  if (xs.length < 3) return NaN;
  return pearson(ranks(xs), ranks(ys));
}

/** Ordinary least squares slope & intercept for y ~ x. */
export function ols(xs: number[], ys: number[]): { slope: number; intercept: number } {
  const n = xs.length;
  const mx = mean(xs);
  const my = mean(ys);
  let sxy = 0;
  let sxx = 0;
  for (let i = 0; i < n; i++) {
    sxy += (xs[i] - mx) * (ys[i] - my);
    sxx += (xs[i] - mx) * (xs[i] - mx);
  }
  const slope = sxx === 0 ? 0 : sxy / sxx;
  return { slope, intercept: my - slope * mx };
}

/** Approximate two-sided p-value for a Pearson r via t-distribution + normal tail. */
export function correlationPValue(r: number, n: number): number {
  if (n < 3 || Math.abs(r) >= 1) return 0;
  const t = (r * Math.sqrt(n - 2)) / Math.sqrt(1 - r * r);
  // Normal approximation of the t tail (n is large in our datasets).
  const z = Math.abs(t);
  // Abramowitz & Stegun 7.1.26 approximation of erfc.
  const p = Math.exp(-0.5 * z * z) / (z * Math.sqrt(2 * Math.PI));
  return Math.min(1, 2 * p);
}

/** Deterministic bootstrap 95% CI for Pearson r (seeded LCG for reproducibility). */
export function bootstrapCI(
  xs: number[],
  ys: number[],
  iterations = 1000,
): { low: number; high: number } {
  const n = xs.length;
  if (n < 5) return { low: NaN, high: NaN };
  let seed = 123456789;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  const rs: number[] = [];
  for (let it = 0; it < iterations; it++) {
    const bx: number[] = [];
    const by: number[] = [];
    for (let i = 0; i < n; i++) {
      const j = Math.floor(rand() * n);
      bx.push(xs[j]);
      by.push(ys[j]);
    }
    const r = pearson(bx, by);
    if (!Number.isNaN(r)) rs.push(r);
  }
  rs.sort((a, b) => a - b);
  const low = rs[Math.floor(0.025 * rs.length)];
  const high = rs[Math.floor(0.975 * rs.length)];
  return { low, high };
}
