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

// ---- Exact-ish distribution helpers (regularized incomplete beta) ----

function gammaln(x: number): number {
  const c = [
    76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155,
    0.1208650973866179e-2, -0.5395239384953e-5,
  ];
  let y = x;
  let tmp = x + 5.5;
  tmp -= (x + 0.5) * Math.log(tmp);
  let ser = 1.000000000190015;
  for (let j = 0; j < 6; j++) ser += c[j] / ++y;
  return -tmp + Math.log((2.5066282746310005 * ser) / x);
}

function betacf(a: number, b: number, x: number): number {
  const MAXIT = 200;
  const EPS = 3e-12;
  const FPMIN = 1e-300;
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= MAXIT; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  return h;
}

/** Regularized incomplete beta I_x(a,b). */
function betai(a: number, b: number, x: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(
    gammaln(a + b) - gammaln(a) - gammaln(b) + a * Math.log(x) + b * Math.log(1 - x),
  );
  if (x < (a + 1) / (a + b + 2)) return (bt * betacf(a, b, x)) / a;
  return 1 - (bt * betacf(b, a, 1 - x)) / b;
}

/** Two-sided p-value for a Student-t statistic with df degrees of freedom. */
export function studentTTwoSided(t: number, df: number): number {
  if (df <= 0 || !Number.isFinite(t)) return 1;
  return betai(df / 2, 0.5, df / (df + t * t));
}

/** Upper-tail p-value P(F > f) for an F(df1, df2) statistic. */
export function fDistSF(f: number, df1: number, df2: number): number {
  if (f <= 0 || df1 <= 0 || df2 <= 0) return 1;
  return betai(df2 / 2, df1 / 2, df2 / (df2 + df1 * f));
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

/** Two-sided p-value for a Pearson r via the exact Student-t distribution. */
export function correlationPValue(r: number, n: number): number {
  if (n < 3 || Math.abs(r) >= 1) return 0;
  const t = (r * Math.sqrt(n - 2)) / Math.sqrt(1 - r * r);
  return studentTTwoSided(Math.abs(t), n - 2);
}

export interface TTestResult {
  meanA: number;
  meanB: number;
  diff: number; // meanA − meanB
  pctDiff: number; // relative to meanB, %
  t: number;
  p: number; // two-sided, normal approximation (large n)
  nA: number;
  nB: number;
}

/** Welch's two-sample t-test (unequal variances). p via normal approx (n is large). */
export function welchTTest(a: number[], b: number[]): TTestResult {
  const mA = mean(a);
  const mB = mean(b);
  const vA = stdDev(a) ** 2;
  const vB = stdDev(b) ** 2;
  const se = Math.sqrt(vA / a.length + vB / b.length);
  const t = se === 0 ? 0 : (mA - mB) / se;
  // Welch–Satterthwaite degrees of freedom.
  const num = (vA / a.length + vB / b.length) ** 2;
  const den =
    (vA / a.length) ** 2 / (a.length - 1) + (vB / b.length) ** 2 / (b.length - 1);
  const df = den === 0 ? a.length + b.length - 2 : num / den;
  return {
    meanA: mA,
    meanB: mB,
    diff: mA - mB,
    pctDiff: mB === 0 ? 0 : ((mA - mB) / mB) * 100,
    t,
    p: studentTTwoSided(Math.abs(t), df),
    nA: a.length,
    nB: b.length,
  };
}

export interface AnovaResult {
  f: number;
  df1: number;
  df2: number;
  p: number;
}

/** One-way ANOVA F-test across groups. Exact upper-tail p for df1=2. */
export function oneWayAnova(groups: number[][]): AnovaResult {
  const valid = groups.filter((g) => g.length > 0);
  const k = valid.length;
  const all = valid.flat();
  const N = all.length;
  const grand = mean(all);
  let ssB = 0;
  let ssW = 0;
  for (const g of valid) {
    const m = mean(g);
    ssB += g.length * (m - grand) ** 2;
    for (const x of g) ssW += (x - m) ** 2;
  }
  const df1 = k - 1;
  const df2 = N - k;
  const f = df1 === 0 || ssW === 0 ? 0 : ssB / df1 / (ssW / df2);
  return { f, df1, df2, p: fDistSF(f, df1, df2) };
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
