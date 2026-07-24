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
import {
  bootstrapCI,
  correlationPValue,
  mean,
  ols,
  pearson,
  spearman,
  stdErr,
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

  const clear = withWeather.filter((o) => (o.cloudCoverMean as number) < 25).map((o) => o.nummern);
  const mixed = withWeather
    .filter((o) => (o.cloudCoverMean as number) >= 25 && (o.cloudCoverMean as number) <= 75)
    .map((o) => o.nummern);
  const overcast = withWeather
    .filter((o) => (o.cloudCoverMean as number) > 75)
    .map((o) => o.nummern);

  const buckets: Bucket[] = [
    bucketOf(clear, "Blauer Himmel (<25% Wolken)"),
    bucketOf(mixed, "Gemischt (25–75%)"),
    bucketOf(overcast, "Bedeckt (>75%)"),
  ];

  const clearMean = mean(clear);
  const overcastMean = mean(overcast);

  // The wisdom predicts a NEGATIVE correlation (less cloud → more Nummern).
  const verdict = blueSkyVerdict(corr, clearMean, overcastMean);

  return { metric: "nummern", correlation: corr, buckets, clearMean, overcastMean, verdict };
}

function blueSkyVerdict(corr: CorrelationResult, clearMean: number, overcastMean: number): Verdict {
  if (corr.n < 30) {
    return {
      level: "insufficient",
      headline: "Noch zu wenig Daten",
      detail: `Nur ${corr.n} Beobachtungen mit Wetterdaten – für ein belastbares Urteil zu wenig.`,
    };
  }
  const diffPct = overcastMean === 0 ? 0 : ((clearMean - overcastMean) / overcastMean) * 100;
  const sig = corr.pValueApprox < 0.05;
  // Wisdom = blue sky → MORE Nummern → negative r (cloud↓, nummern↑) & clearMean > overcastMean.
  const supports = corr.pearson < 0 && clearMean > overcastMean;

  if (supports && sig && Math.abs(corr.pearson) >= 0.1) {
    return {
      level: "confirmed",
      headline: "Die Weisheit hält stand",
      detail: `Bei blauem Himmel werden im Schnitt ${diffPct.toFixed(0)}% mehr Nummern gemacht als bei bedecktem Himmel (r=${corr.pearson.toFixed(2)}, p<0.05).`,
    };
  }
  if (supports && Math.abs(corr.pearson) >= 0.05) {
    return {
      level: "weak",
      headline: "Schwacher Hinweis dafür",
      detail: `Es gibt einen leichten Trend zu mehr Nummern bei blauem Himmel (r=${corr.pearson.toFixed(2)}), statistisch aber nicht klar gesichert.`,
    };
  }
  if (corr.pearson > 0 && sig) {
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

export function analyze(obs: Observation[], modelK: number): AnalysisResult {
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
    blueSky: analyzeBlueSky(obs),
    wind: analyzeWind(obs, modelK),
  };
}
