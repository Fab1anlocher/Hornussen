// Recomputes every figure the story quotes straight from data/matches.json and
// data/dataset.json, then checks data/analysis.json against it. Deliberately
// avoids lib/analysis and lib/stats: importing them would only prove the
// pipeline agrees with itself.
//
// Asserts invariants, not today's numbers, so a fresh pipeline run stays green.
//   npm run verify
import type { AnalysisResult, Match, Observation } from "../lib/types";
import { readData } from "./lib-scrape";

let checks = 0;
let fails = 0;

function check(name: string, ok: boolean, detail = "") {
  checks++;
  if (ok) return;
  fails++;
  console.error(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
}

function near(name: string, got: number, want: number, tol = 1e-9) {
  check(name, Math.abs(got - want) <= tol, `${got} vs ${want}`);
}

const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
const variance = (xs: number[]) => {
  const m = mean(xs);
  return xs.reduce((s, x) => s + (x - m) ** 2, 0) / (xs.length - 1);
};

function main() {
  const matches = readData<Match[]>("matches.json", []);
  const obs = readData<Observation[]>("dataset.json", []);
  const a = readData<AnalysisResult | null>("analysis.json", null);
  if (!a || obs.length === 0) {
    console.error("Keine Analyse oder kein Datensatz vorhanden — zuerst `npm run pipeline`.");
    process.exit(1);
  }
  const bs = a.blueSky;

  // --- match accounting -----------------------------------------------------
  const played = new Set(obs.map((o) => o.matchId));
  const unplayed = matches.filter((m) => !played.has(m.id));
  check("totalMatches = gespielte Spiele", a.totalMatches === played.size);
  check("matchesNotPlayed stimmt", a.matchesNotPlayed === matches.length - played.size);
  check("Archiv = gespielt + ungespielt", matches.length === a.totalMatches + a.matchesNotPlayed);
  check(
    "ausgeschlossene Runden sind ausnahmslos 0:0",
    unplayed.every((m) =>
      [m.home, m.away].every(
        (t) => t.rundenpunkte === 0 && t.nummern === 0 && t.schlagpunkte === 0,
      ),
    ),
  );
  check("zwei Beobachtungen je gespieltes Spiel", obs.length === played.size * 2);
  check("totalObservations stimmt", a.totalObservations === obs.length);

  const withWeather = obs.filter((o) => Number.isFinite(o.cloudCoverMean));
  check("observationsWithWeather stimmt", a.observationsWithWeather === withWeather.length);

  // --- okta buckets ---------------------------------------------------------
  const groups: Observation[][] = Array.from({ length: 9 }, () => []);
  for (const o of withWeather) {
    groups[Math.max(0, Math.min(8, Math.round((o.cloudCoverMean as number) / 12.5)))].push(o);
  }
  const nummern = (g: Observation[]) => g.map((o) => o.nummern);

  groups.forEach((g, k) => {
    check(`Bucket ${k}/8 Anzahl`, bs.buckets[k].count === g.length);
    if (g.length > 0) near(`Bucket ${k}/8 Mittelwert`, bs.buckets[k].mean, mean(nummern(g)));
  });
  check(
    "Buckets decken alle Beobachtungen mit Wetter ab",
    bs.buckets.reduce((s, b) => s + b.count, 0) === withWeather.length,
  );

  // --- the headline comparison ---------------------------------------------
  const clear = nummern(groups[0]);
  const overcast = nummern(groups[8]);
  near("clearMean", bs.clearMean, mean(clear));
  near("overcastMean", bs.overcastMean, mean(overcast));
  check("extremes vergleicht 0/8 mit 8/8", bs.extremes.nA === clear.length && bs.extremes.nB === overcast.length);
  near("extremes pctDiff", bs.extremes.pctDiff, (mean(clear) / mean(overcast) - 1) * 100);
  const se = Math.sqrt(variance(clear) / clear.length + variance(overcast) / overcast.length);
  near("extremes Welch t", bs.extremes.t, (mean(clear) - mean(overcast)) / se, 1e-6);
  check(
    "extremes n ist kleiner als das Korrelations-n",
    bs.extremes.nA + bs.extremes.nB < bs.correlation.n,
    "sonst zitiert die Seite wieder den falschen Test",
  );

  // --- clustered inference --------------------------------------------------
  const days = new Set(withWeather.map((o) => o.date));
  check("playingDays stimmt", bs.playingDays === days.size);
  const cl = bs.extremesClustered;
  near("geclusterte Differenz gleich der naiven", cl.diff, bs.extremes.diff, 1e-9);
  check(
    "Clusterung vergroessert den Standardfehler",
    cl.inflation > 1,
    `Inflation ${cl.inflation.toFixed(2)}`,
  );
  check(
    "geclusterter t-Wert ist kleiner als der naive",
    Math.abs(cl.t) < Math.abs(bs.extremes.t),
  );
  check(
    "Cluster sind Spieltage, nicht Beobachtungen",
    cl.clusters <= days.size && cl.clusters > 1,
  );

  // Cloud cover is a property of the date; if that ever stopped being true the
  // story's central caveat would need rewriting, so pin the decomposition.
  const byDate = new Map<string, number[]>();
  for (const o of withWeather) {
    const v = o.cloudCoverMean as number;
    const bucket = byDate.get(o.date);
    if (bucket) bucket.push(v);
    else byDate.set(o.date, [v]);
  }
  const grand = mean(withWeather.map((o) => o.cloudCoverMean as number));
  let betweenSS = 0;
  let withinSS = 0;
  for (const values of byDate.values()) {
    const m = mean(values);
    betweenSS += values.length * (m - grand) ** 2;
    for (const v of values) withinSS += (v - m) ** 2;
  }
  near("betweenDayShare", bs.betweenDayShare, betweenSS / (betweenSS + withinSS), 1e-12);
  const spreads = [...byDate.values()]
    .filter((v) => v.length >= 10)
    .map((v) => Math.max(...v) - Math.min(...v))
    .sort((x, y) => x - y);
  near(
    "withinDaySpreadMedian",
    bs.withinDaySpreadMedian,
    spreads[Math.floor((spreads.length - 1) / 2)],
    1e-9,
  );
  check(
    "der Himmel unterscheidet sich innerhalb eines Spieltags messbar",
    bs.withinDaySpreadMedian > 0,
    "sonst waere die Aussage in Kapitel 2 falsch",
  );

  // --- temperature strata ---------------------------------------------------
  for (const stratum of bs.temperatureStrata) {
    const band = (g: Observation[], lo: number, hi: number) =>
      g.filter((o) => Number.isFinite(o.temperatureMean) && (o.temperatureMean as number) >= lo && (o.temperatureMean as number) < hi);
    const [lo, hi] = {
      "unter 15 °C": [-100, 15],
      "15 bis 20 °C": [15, 20],
      "20 bis 25 °C": [20, 25],
      "über 25 °C": [25, 100],
    }[stratum.label] ?? [NaN, NaN];
    const a = band(groups[0], lo, hi);
    const b = band(groups[8], lo, hi);
    check(`Stratum "${stratum.label}" Anzahl klar`, stratum.nClear === a.length);
    check(`Stratum "${stratum.label}" Anzahl bedeckt`, stratum.nOvercast === b.length);
    near(`Stratum "${stratum.label}" Differenz`, stratum.diff, mean(nummern(a)) - mean(nummern(b)));
  }
  check(
    "Kapitel 5: der Abstand ueberlebt jedes Temperaturband",
    bs.temperatureStrata.length > 0 && bs.temperatureStrata.every((t) => t.diff > 0),
    "sonst traegt die Hitze-Erklaerung doch",
  );

  // --- regression -----------------------------------------------------------
  const xs = withWeather.map((o) => o.cloudCoverMean as number);
  const ys = withWeather.map((o) => o.nummern);
  const mx = mean(xs);
  const my = mean(ys);
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < xs.length; i++) {
    const dx = xs[i] - mx;
    const dy = ys[i] - my;
    sxy += dx * dy;
    sxx += dx * dx;
    syy += dy * dy;
  }
  near("Pearson r", bs.correlation.pearson, sxy / Math.sqrt(sxx * syy));
  near("OLS Steigung", bs.correlation.slope, sxy / sxx, 1e-12);
  near("OLS Achsenabschnitt", bs.correlation.intercept, my - (sxy / sxx) * mx);
  check("Korrelations-n stimmt", bs.correlation.n === withWeather.length);

  // --- categories -----------------------------------------------------------
  const cats = [
    groups.slice(0, 3).flatMap(nummern),
    groups.slice(3, 6).flatMap(nummern),
    groups.slice(6, 9).flatMap(nummern),
  ];
  cats.forEach((g, i) => {
    check(`Kategorie ${i} Anzahl`, bs.categories.buckets[i].count === g.length);
    near(`Kategorie ${i} Mittelwert`, bs.categories.buckets[i].mean, mean(g));
  });
  const all = cats.flat();
  const gm = mean(all);
  const ssB = cats.reduce((s, g) => s + g.length * (mean(g) - gm) ** 2, 0);
  const ssW = cats.reduce((s, g) => s + g.reduce((t, v) => t + (v - mean(g)) ** 2, 0), 0);
  near("ANOVA F", bs.categories.anovaF, ssB / 2 / (ssW / (all.length - 3)), 1e-6);
  check(
    "Kapitel 3 nennt drei Paarvergleiche",
    bs.categories.pairwise.length === 3,
  );

  // --- distribution (chapter 4) --------------------------------------------
  const { cap, counts } = bs.distribution;
  groups.forEach((g, k) => {
    const row = new Array<number>(cap + 1).fill(0);
    for (const o of g) row[Math.min(cap, Math.max(0, o.nummern))]++;
    check(`Verteilung Zeile ${k}/8`, JSON.stringify(counts[k]) === JSON.stringify(row));
  });
  check(
    "Verteilung enthält jede Beobachtung genau einmal",
    counts.flat().reduce((s, v) => s + v, 0) === withWeather.length,
  );
  near(
    "zeroShare",
    bs.distribution.zeroShare,
    withWeather.filter((o) => o.nummern === 0).length / withWeather.length,
    1e-12,
  );
  check(
    "maxNummern stimmt",
    bs.distribution.maxNummern === Math.max(...withWeather.map((o) => o.nummern)),
  );

  // --- confounders (chapter 5) ---------------------------------------------
  const c = bs.context;
  const avg = (g: Observation[], pick: (o: Observation) => number | undefined) =>
    mean(g.map(pick).filter((v): v is number => Number.isFinite(v as number)));
  near("Temperatur 0/8", c.temperatureClear, avg(groups[0], (o) => o.temperatureMean));
  near("Temperatur 8/8", c.temperatureOvercast, avg(groups[8], (o) => o.temperatureMean));
  near("Wind 0/8", c.windSpeedClear, avg(groups[0], (o) => o.windSpeedMean));
  near("Wind 8/8", c.windSpeedOvercast, avg(groups[8], (o) => o.windSpeedMean));
  const share = (g: Observation[], pred: (o: Observation) => boolean) =>
    g.filter(pred).length / g.length;
  near(
    "Hochsommer-Anteil 0/8",
    c.midsummerShareClear,
    share(groups[0], (o) => ["06", "07"].includes(o.date.slice(5, 7))),
  );
  near(
    "NL-Anteil 0/8",
    c.topLeagueShareClear,
    share(groups[0], (o) => o.league.startsWith("NL")),
  );

  // The story states these as directions, so guard the direction, not the value.
  check(
    "Kapitel 5: wolkenlose Tage sind wärmer",
    c.temperatureClear > c.temperatureOvercast,
  );
  check(
    "Kapitel 5: wolkenlose Tage liegen häufiger im Hochsommer",
    c.midsummerShareClear > c.midsummerShareOvercast,
  );

  console.log(
    fails === 0
      ? `\n  ${checks} Checks, alle bestanden.\n`
      : `\n  ${checks - fails}/${checks} Checks bestanden, ${fails} fehlgeschlagen.\n`,
  );
  process.exit(fails === 0 ? 0 : 1);
}

main();
