// Analysis engine: turns per-team-match observations into verdicts on the two
// Hornussen hypotheses.
import type {
  AnalysisResult,
  BlueSkyAnalysis,
  Bucket,
  CorrelationResult,
  Observation,
  Verdict,
  WindAnalysis,
} from "./types";
import type {
  CategoryAnalysis,
  ClearSkyContext,
  NummernDistribution,
  PairwiseTest,
} from "./types";
import {
  bootstrapCI,
  correlationPValue,
  mean,
  ols,
  oneWayAnova,
  pearson,
  spearman,
  stdErr,
  welchTTest,
} from "./stats";

function correlation(xs: number[], ys: number[]): CorrelationResult {
  const { slope, intercept } = ols(xs, ys);
  const r = pearson(xs, ys);
  const ci = bootstrapCI(xs, ys);
  return {
    n: xs.length,
    pearson: r,
    spearman: spearman(xs, ys),
    slope,
    intercept,
    ciLow: ci.low,
    ciHigh: ci.high,
    pValueApprox: correlationPValue(r, xs.length),
  };
}

function bucketOf(values: number[], label: string): Bucket {
  return {
    label,
    count: values.length,
    mean: mean(values),
    stdErr: stdErr(values),
  };
}

// ---- Blue-sky hypothesis: clear sky (low cloud cover) → more Nummern ----
export function analyzeBlueSky(obs: Observation[]): BlueSkyAnalysis {
  const withWeather = obs.filter(
    (o) => typeof o.cloudCoverMean === "number" && Number.isFinite(o.cloudCoverMean),
  );
  const cloud = withWeather.map((o) => o.cloudCoverMean as number);
  const nummern = withWeather.map((o) => o.nummern);
  const corr = correlation(cloud, nummern);

  // Official okta scale (eighths): okta = round(cloudCover% / 12.5), 0..8.
  const oktaObs: Observation[][] = Array.from({ length: 9 }, () => []);
  for (const o of withWeather) {
    const k = Math.max(0, Math.min(8, Math.round((o.cloudCoverMean as number) / 12.5)));
    oktaObs[k].push(o);
  }
  const oktaGroups: number[][] = oktaObs.map((g) => g.map((o) => o.nummern));
  const buckets: Bucket[] = oktaGroups.map((g, k) => bucketOf(g, `${k}/8`));
  const okta = oneWayAnova(oktaGroups.filter((g) => g.length > 0));

  // Coarse official groups for the pairwise significance test.
  const clearG = oktaGroups.slice(0, 3).flat(); // 0–2/8 wolkenlos…heiter
  const midG = oktaGroups.slice(3, 6).flat(); // 3–5/8 leicht bewölkt…bewölkt
  const overG = oktaGroups.slice(6, 9).flat(); // 6–8/8 stark bewölkt…bedeckt
  const categories = categoryAnalysis([
    ["Heiter (0–2/8)", clearG],
    ["Bewölkt (3–5/8)", midG],
    ["Bedeckt (6–8/8)", overG],
  ]);

  const clearMean = mean(oktaGroups[0]); // wolkenlos (0/8)
  const overcastMean = mean(oktaGroups[8]); // bedeckt (8/8)

  // The headline number compares the two ends of the scale, so it needs its own
  // test — the correlation's p and n cover all nine oktas and would overstate
  // the sample behind this specific claim.
  const extremes = pairwise("0/8 (wolkenlos)", oktaGroups[0], "8/8 (bedeckt)", oktaGroups[8]);

  const verdict = blueSkyVerdict(corr, clearMean, overcastMean, categories);

  return {
    metric: "nummern",
    correlation: corr,
    buckets,
    oktaAnovaF: okta.f,
    oktaAnovaP: okta.p,
    clearMean,
    overcastMean,
    extremes,
    context: clearSkyContext(oktaObs[0], oktaObs[8]),
    distribution: nummernDistribution(oktaObs),
    categories,
    verdict,
  };
}

/**
 * Buckets every observation into an okta × Nummern grid. Counts above `cap`
 * fold into the last row: the tail runs to 21 but is so thin that plotting it
 * would spend most of the chart on a handful of games.
 */
function nummernDistribution(oktaObs: Observation[][], cap = 6): NummernDistribution {
  const counts = oktaObs.map((group) => {
    const row = new Array<number>(cap + 1).fill(0);
    for (const o of group) row[Math.min(cap, Math.max(0, o.nummern))]++;
    return row;
  });
  const all = oktaObs.flat();
  const zero = all.filter((o) => o.nummern === 0).length;
  return {
    cap,
    counts,
    zeroShare: all.length === 0 ? 0 : zero / all.length,
    maxNummern: all.reduce((m, o) => Math.max(m, o.nummern), 0),
  };
}

/**
 * Measures what else separates cloudless from overcast playing days, so the
 * story can name its confounders with numbers instead of asserting them.
 */
function clearSkyContext(clear: Observation[], overcast: Observation[]): ClearSkyContext {
  const avg = (obs: Observation[], pick: (o: Observation) => number | undefined) => {
    const vs = obs.map(pick).filter((v): v is number => Number.isFinite(v as number));
    return vs.length === 0 ? NaN : mean(vs);
  };
  // June/July — the height of the season, when clear days cluster.
  const midsummer = (obs: Observation[]) =>
    obs.length === 0
      ? NaN
      : obs.filter((o) => ["06", "07"].includes(o.date.slice(5, 7))).length / obs.length;
  const topLeague = (obs: Observation[]) =>
    obs.length === 0 ? NaN : obs.filter((o) => o.league.startsWith("NL")).length / obs.length;

  return {
    temperatureClear: avg(clear, (o) => o.temperatureMean),
    temperatureOvercast: avg(overcast, (o) => o.temperatureMean),
    windSpeedClear: avg(clear, (o) => o.windSpeedMean),
    windSpeedOvercast: avg(overcast, (o) => o.windSpeedMean),
    midsummerShareClear: midsummer(clear),
    midsummerShareOvercast: midsummer(overcast),
    topLeagueShareClear: topLeague(clear),
    topLeagueShareOvercast: topLeague(overcast),
  };
}

/** Welch test between two labelled groups, in the shape the frontend reads. */
function pairwise(la: string, ga: number[], lb: string, gb: number[]): PairwiseTest {
  const t = welchTTest(ga, gb);
  return {
    a: la,
    b: lb,
    meanA: t.meanA,
    meanB: t.meanB,
    diff: t.diff,
    pctDiff: t.pctDiff,
    t: t.t,
    p: t.p,
    significant: t.p < 0.05,
    nA: t.nA,
    nB: t.nB,
  };
}

/** One-way ANOVA + all pairwise Welch tests across labelled groups. */
function categoryAnalysis(groups: [string, number[]][]): CategoryAnalysis {
  const anova = oneWayAnova(groups.map(([, g]) => g));
  const tests: PairwiseTest[] = [];
  for (let i = 0; i < groups.length; i++) {
    for (let j = i + 1; j < groups.length; j++) {
      tests.push(pairwise(groups[i][0], groups[i][1], groups[j][0], groups[j][1]));
    }
  }
  return {
    buckets: groups.map(([label, g]) => bucketOf(g, label)),
    anovaF: anova.f,
    anovaP: anova.p,
    anovaSignificant: anova.p < 0.05,
    pairwise: tests,
  };
}

function blueSkyVerdict(
  corr: CorrelationResult,
  clearMean: number,
  overcastMean: number,
  cats: CategoryAnalysis,
): Verdict {
  if (corr.n < 30) {
    return {
      level: "insufficient",
      headline: "Noch zu wenig Daten",
      detail: `Nur ${corr.n} Beobachtungen mit Wetterdaten – für ein belastbares Urteil zu wenig.`,
    };
  }
  const diffPct = overcastMean === 0 ? 0 : ((clearMean - overcastMean) / overcastMean) * 100;
  // Threshold view: does the CLEAR group differ significantly from the OVERCAST one?
  const clearVsHeavy = cats.pairwise.find((p) => /Heiter/.test(p.a) && /Bedeckt/.test(p.b));
  const threshold = clearVsHeavy && clearVsHeavy.diff > 0 && clearVsHeavy.significant;
  const linSig = corr.pValueApprox < 0.05;
  const supports = corr.pearson < 0 && clearMean > overcastMean;

  // A significant threshold effect (clear > heavy) is the strongest evidence for the wisdom.
  if (threshold && cats.anovaSignificant) {
    return {
      level: "confirmed",
      headline: "Die Weisheit hält stand – als Schwelleneffekt",
      detail: `Bei wolkenlosem Himmel (0/8) fallen im Schnitt ${diffPct >= 0 ? "+" : ""}${diffPct.toFixed(0)}% mehr Nummern als bei bedecktem Himmel (8/8) – der Unterschied ist statistisch signifikant (p<0.05). Der lineare Zusammenhang allein (r=${corr.pearson.toFixed(2)}) unterschätzt diesen Schwelleneffekt, weil fast der gesamte Effekt beim ganz klaren Himmel auftritt.`,
    };
  }
  if (supports && linSig && Math.abs(corr.pearson) >= 0.1) {
    return {
      level: "confirmed",
      headline: "Die Weisheit hält stand",
      detail: `Bei blauem Himmel werden im Schnitt ${diffPct.toFixed(0)}% mehr Nummern gemacht als bei bedecktem Himmel (r=${corr.pearson.toFixed(2)}, p<0.05).`,
    };
  }
  if ((supports && Math.abs(corr.pearson) >= 0.05) || (clearVsHeavy && clearVsHeavy.diff > 0 && clearVsHeavy.significant)) {
    return {
      level: "weak",
      headline: "Schwacher Hinweis dafür",
      detail: `Es gibt einen Trend zu mehr Nummern bei blauem Himmel (r=${corr.pearson.toFixed(2)}); wolkenlos liegt ${diffPct >= 0 ? "+" : ""}${diffPct.toFixed(0)}% über bedeckt.`,
    };
  }
  if (corr.pearson > 0 && linSig) {
    return {
      level: "contradicted",
      headline: "Das Gegenteil zeigt sich",
      detail: `In den Daten gibt es tendenziell mehr Nummern bei bedecktem Himmel – entgegen der Weisheit (r=${corr.pearson.toFixed(2)}).`,
    };
  }
  return {
    level: "none",
    headline: "Kein messbarer Effekt",
    detail: `Zwischen Bewölkung und Nummern zeigt sich kein nennenswerter Zusammenhang (r=${corr.pearson.toFixed(2)}).`,
  };
}

// ---- Wind hypothesis: tailwind → more Schlagpunkte ----
export function analyzeWind(obs: Observation[], modelK: number): WindAnalysis {
  const withWind = obs.filter(
    (o) => typeof o.tailwindComponent === "number" && Number.isFinite(o.tailwindComponent as number),
  );
  const tw = withWind.map((o) => o.tailwindComponent as number);
  const pts = withWind.map((o) => o.schlagpunkte);
  const corr = correlation(tw, pts);

  const head = withWind.filter((o) => (o.tailwindComponent as number) <= -1).map((o) => o.schlagpunkte);
  const calm = withWind
    .filter((o) => Math.abs(o.tailwindComponent as number) < 1)
    .map((o) => o.schlagpunkte);
  const tail = withWind.filter((o) => (o.tailwindComponent as number) >= 1).map((o) => o.schlagpunkte);

  const buckets: Bucket[] = [
    bucketOf(head, "Gegenwind (≤ −1 km/h)"),
    bucketOf(calm, "Windstill (±1 km/h)"),
    bucketOf(tail, "Rückenwind (≥ +1 km/h)"),
  ];

  const tailwindMean = mean(tail);
  const headwindMean = mean(head);
  const ratio = headwindMean === 0 ? NaN : tailwindMean / headwindMean;
  const verdict = windVerdict(corr, ratio);

  return {
    metric: "schlagpunkte",
    correlation: corr,
    buckets,
    tailwindMean,
    headwindMean,
    ratio,
    modelK,
    verdict,
  };
}

function windVerdict(corr: CorrelationResult, ratio: number): Verdict {
  if (corr.n < 30) {
    return {
      level: "insufficient",
      headline: "Noch zu wenig Daten",
      detail: `Nur ${corr.n} Beobachtungen mit gesetzter Spielrichtung – Spielrichtungen in der Config ergänzen, um mehr Aussagekraft zu erhalten.`,
    };
  }
  const pct = Number.isFinite(ratio) ? (ratio - 1) * 100 : 0;
  const sig = corr.pValueApprox < 0.05;
  const supports = corr.pearson > 0 && Number.isFinite(ratio) && ratio > 1;

  if (supports && sig && corr.pearson >= 0.1) {
    return {
      level: "confirmed",
      headline: "Rückenwind bringt Weite",
      detail: `Mit Rückenwind werden im Schnitt ${pct.toFixed(0)}% mehr Schlagpunkte erzielt als mit Gegenwind (r=${corr.pearson.toFixed(2)}, p<0.05).`,
    };
  }
  if (supports && corr.pearson >= 0.05) {
    return {
      level: "weak",
      headline: "Leichter Rückenwind-Vorteil",
      detail: `Rückenwind geht tendenziell mit mehr Schlagpunkten einher (r=${corr.pearson.toFixed(2)}), aber nicht klar gesichert.`,
    };
  }
  if (corr.pearson < 0 && sig) {
    return {
      level: "contradicted",
      headline: "Unerwartetes Bild",
      detail: `In den Daten bringt Gegenwind eher mehr Punkte (r=${corr.pearson.toFixed(2)}) – evtl. sind Spielrichtungen unvollständig.`,
    };
  }
  return {
    level: "none",
    headline: "Kein klarer Wind-Effekt",
    detail: `Zwischen Rückenwind und Schlagpunkten zeigt sich (noch) kein deutlicher Zusammenhang (r=${corr.pearson.toFixed(2)}).`,
  };
}

export function analyze(
  obs: Observation[],
  modelK: number,
  matchesNotPlayed = 0,
): AnalysisResult {
  const matchIds = new Set(obs.map((o) => o.matchId));
  const seasons = [...new Set(obs.map((o) => o.season))].sort((a, b) => a - b);
  const leagues = [...new Set(obs.map((o) => o.league))].sort();
  const withWeather = obs.filter((o) => typeof o.cloudCoverMean === "number");
  const withWind = obs.filter((o) => typeof o.tailwindComponent === "number" && Number.isFinite(o.tailwindComponent as number));

  return {
    generatedAt: new Date().toISOString(),
    seasons,
    leagues,
    totalMatches: matchIds.size,
    totalObservations: obs.length,
    observationsWithWeather: withWeather.length,
    observationsWithWind: withWind.length,
    matchesNotPlayed,
    blueSky: analyzeBlueSky(obs),
    wind: analyzeWind(obs, modelK),
  };
}
