// Shared domain types for the Hornussen weather-analysis app.

/** Raw venue record as returned by the hgverwaltung locations API. */
export interface RawVenue {
  name: string;
  ort?: string;
  strasse?: string;
  plz?: string;
  lat: number;
  lng: number;
  homepage?: string;
}

/** A physical Hornussen field (one coordinate), possibly shared by several teams. */
export interface Venue {
  id: string; // slug derived from base name + coordinates
  name: string; // canonical display name (team base name, e.g. "Schüpbach")
  ort?: string;
  strasse?: string;
  plz?: string;
  lat: number;
  lng: number;
  homepage?: string;
  teams: string[]; // team names whose home field this is
  /** Azimuth (deg, 0=N, 90=E) the Nouss is hit toward. null until user sets it. */
  playingDirectionDeg: number | null;
  playingDirectionNote?: string;
  /** "directory" = EHV/hgverwaltung venue; "geocoded" = town-centroid fallback for weather. */
  source?: "directory" | "geocoded";
}

/** One team's line in a single match. */
export interface TeamMatchResult {
  team: string;
  rundenpunkte: number; // first PDF number — duel/round points
  nummern: number; // middle PDF number — faults (blue-sky hypothesis metric)
  schlagpunkte: number; // last PDF number — distance points (wind hypothesis metric)
}

/** A single match (pairing of two teams) on a given round date. */
export interface Match {
  id: string;
  date: string; // ISO yyyy-mm-dd (round date)
  season: number;
  league: string; // e.g. "NLA", "NLB", "1. Liga Gruppe 1"
  home: TeamMatchResult;
  away: TeamMatchResult;
  // Resolved location = home team's field (assumption: first-listed team = home).
  venueId?: string;
  venueName?: string;
  lat?: number;
  lng?: number;
}

/** Aggregated weather for a match location + date, over the playing window. */
export interface MatchWeather {
  key: string; // `${lat.toFixed(4)},${lng.toFixed(4)}@${date}`
  date: string;
  lat: number;
  lng: number;
  cloudCoverMean: number; // %
  cloudCoverMin: number; // % (bluest moment)
  windSpeedMean: number; // km/h — scalar mean magnitude (how windy)
  windDirectionMean: number; // deg, meteorological FROM (resultant)
  // Resultant wind-vector (direction wind blows TOWARD), km/h in east/north.
  // Vector-averaged over the play window, so it correctly handles rotating wind.
  windU: number; // eastward component
  windV: number; // northward component
  windSteadiness: number; // |resultant| / scalarMean, 0=fully rotating … 1=steady
  windGustMax: number; // km/h
  temperatureMean: number; // °C
  hoursUsed: number; // number of hourly samples aggregated
}

/** One team-match observation joined with weather + wind, the unit of analysis. */
export interface Observation {
  matchId: string;
  date: string;
  season: number;
  league: string;
  team: string;
  opponent: string;
  isHome: boolean;
  nummern: number;
  schlagpunkte: number;
  rundenpunkte: number;
  // location & weather (both teams share the match location & sky)
  venueId?: string;
  venueName?: string;
  lat?: number;
  lng?: number;
  cloudCoverMean?: number;
  cloudCoverMin?: number;
  windSpeedMean?: number;
  windDirectionMean?: number;
  temperatureMean?: number;
  // wind relative to this venue's playing direction (only if direction set)
  playingDirectionDeg?: number | null;
  tailwindComponent?: number | null; // km/h, + = tailwind, − = headwind
}

export interface Bucket {
  label: string;
  count: number;
  mean: number;
  stdErr: number;
}

export interface CorrelationResult {
  n: number;
  pearson: number;
  spearman: number;
  slope: number; // OLS slope (y per unit x)
  intercept: number;
  ciLow: number; // bootstrap 95% CI of pearson
  ciHigh: number;
  pValueApprox: number;
}

export interface PairwiseTest {
  a: string; // category label A
  b: string; // category label B
  meanA: number;
  meanB: number;
  diff: number;
  pctDiff: number;
  t: number;
  p: number;
  significant: boolean; // p < 0.05
  nA: number;
  nB: number;
}

/**
 * The headline contrast repeated inside a stratum, e.g. one temperature band.
 * If the difference only existed because clear days are hot days, it would
 * vanish here; that it does not is the reason chapter 5 can rule heat out.
 */
export interface Stratum {
  label: string;
  meanClear: number;
  meanOvercast: number;
  diff: number;
  p: number;
  nClear: number;
  nOvercast: number;
}

/** A group difference with cluster-robust inference (Liang–Zeger). */
export interface ClusteredTest {
  diff: number;
  stdErr: number;
  t: number;
  p: number;
  clusters: number;
  /** How much wider the clustered standard error is than the naive one. */
  inflation: number;
}

/**
 * What else changes when the sky clears. These are the confounders the story
 * names, measured rather than assumed — a cloudless day differs from an
 * overcast one in more than just its cloud cover.
 */
export interface ClearSkyContext {
  temperatureClear: number; // °C at 0/8
  temperatureOvercast: number; // °C at 8/8
  windSpeedClear: number; // km/h at 0/8
  windSpeedOvercast: number; // km/h at 8/8
  /** Share of observations played in June/July (0..1) — clear skies sit later. */
  midsummerShareClear: number;
  midsummerShareOvercast: number;
  /** Share of observations from the top flight, NLA/NLB (0..1). */
  topLeagueShareClear: number;
  topLeagueShareOvercast: number;
}

/**
 * The full joint distribution of cloud cover and Nummern — every observation
 * lands in exactly one cell. Lets the story show the raw spread the averages
 * are drawn from, instead of only the averages.
 */
export interface NummernDistribution {
  /** Last explicit row; the row at this index means "cap or more". */
  cap: number;
  /** counts[okta 0..8][nummern 0..cap] — the final row is the tail. */
  counts: number[][];
  /** Share of all observations that ended without a single Nummer, 0..1. */
  zeroShare: number;
  /** Largest single Nummern value in the data — the tail the grid folds away. */
  maxNummern: number;
}

export interface CategoryAnalysis {
  buckets: Bucket[]; // the 3 categories (0–20 / 20–80 / 80–100 %)
  anovaF: number;
  anovaP: number;
  anovaSignificant: boolean;
  pairwise: PairwiseTest[];
}

export interface BlueSkyAnalysis {
  metric: "nummern";
  correlation: CorrelationResult; // cloudCover vs nummern (linear)
  buckets: Bucket[]; // official okta scale 0/8 … 8/8 (dose-response)
  oktaAnovaF: number; // ANOVA across the 9 oktas
  oktaAnovaP: number;
  clearMean: number; // mean nummern, wolkenlos (0/8)
  overcastMean: number; // mean nummern, bedeckt (8/8)
  /**
   * Welch test for exactly the headline claim: 0/8 vs 8/8. Kept separate from
   * `correlation` (which spans all nine oktas) so the reported p-value and n
   * belong to the comparison actually being quoted.
   */
  extremes: PairwiseTest;
  /**
   * The same 0/8-vs-8/8 difference, but with standard errors clustered by
   * playing day. Weather is a property of the round date, not of the single
   * result: 91 % of the variance in cloud cover sits between playing days, so
   * treating each team result as independent evidence overstates precision by
   * roughly a factor of 2.5. This is the honest test.
   */
  extremesClustered: ClusteredTest;
  /** Distinct round dates with weather — the real number of independent draws. */
  playingDays: number;
  /** 0/8 vs 8/8 repeated within temperature bands, to test the heat explanation. */
  temperatureStrata: Stratum[];
  /**
   * Share of the variance in cloud cover that sits between playing days rather
   * than between venues on the same day (0..1). Near 1 means the exposure is
   * effectively a property of the date, which is what limits what the
   * comparison can identify.
   */
  betweenDayShare: number;
  context: ClearSkyContext; // what else differs between 0/8 and 8/8 days
  distribution: NummernDistribution; // okta × Nummern, all observations
  categories: CategoryAnalysis; // coarse official groups + pairwise tests
  verdict: Verdict;
}

export interface WindAnalysis {
  metric: "schlagpunkte";
  correlation: CorrelationResult; // tailwind vs schlagpunkte
  buckets: Bucket[]; // by tailwind class
  tailwindMean: number; // mean schlagpunkte with tailwind
  headwindMean: number; // mean schlagpunkte with headwind
  ratio: number; // tailwindMean / headwindMean
  modelK: number; // configured factor slope (factor = 1 + k * tailwindKmh)
  verdict: Verdict;
}

export type VerdictLevel = "confirmed" | "weak" | "none" | "contradicted" | "insufficient";

export interface Verdict {
  level: VerdictLevel;
  headline: string;
  detail: string;
}

export interface AnalysisResult {
  generatedAt: string;
  seasons: number[];
  leagues: string[];
  totalMatches: number;
  totalObservations: number;
  observationsWithWeather: number;
  observationsWithWind: number;
  /** Archive rows recorded as 0:0 because the round was never played. */
  matchesNotPlayed: number;
  blueSky: BlueSkyAnalysis;
  wind: WindAnalysis;
}

/** User-maintained config: playing direction per physical field. */
export interface PlayingDirectionEntry {
  venue: string; // display label
  lat: number;
  lng: number;
  directionDeg: number; // azimuth the Nouss is hit toward
  note?: string;
}

export interface WindModelConfig {
  /** factor = 1 + k * tailwindKmh, applied to expected schlagpunkte. */
  k: number;
  /** hours (local) considered the playing window for weather aggregation. */
  playWindowStart: number;
  playWindowEnd: number;
}

export interface PlayingDirectionsConfig {
  model: WindModelConfig;
  directions: PlayingDirectionEntry[];
}
