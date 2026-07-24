// Runs the statistical analysis over the observation dataset and writes
// data/analysis.json plus data/charts.json (small, precomputed chart series so
// the frontend never has to load the full dataset).
import type { Observation, PlayingDirectionsConfig } from "../lib/types";
import { analyze } from "../lib/analysis";
import { binnedTrend } from "../lib/chart-data";
import { readConfig, readData, writeJson } from "./lib-scrape";

function main() {
  const obs = readData<Observation[]>("dataset.json", []);
  const cfg = readConfig<PlayingDirectionsConfig>("playing-directions.json", {
    model: { k: 0.02, playWindowStart: 12, playWindowEnd: 17 },
    directions: [],
  });
  if (obs.length === 0) {
    console.error("No observations found — run the pipeline first.");
    process.exit(1);
  }
  const result = analyze(obs, cfg.model.k);
  console.log("Blue-sky verdict:", result.blueSky.verdict.level, "-", result.blueSky.verdict.headline);
  console.log("  ", result.blueSky.verdict.detail);
  console.log("Wind verdict:", result.wind.verdict.level, "-", result.wind.verdict.headline);
  console.log("  ", result.wind.verdict.detail);
  writeJson("analysis.json", result);

  // Precomputed chart series (tiny).
  const windObs = obs.filter(
    (o) => typeof o.tailwindComponent === "number" && Number.isFinite(o.tailwindComponent as number),
  );
  const charts = {
    blueSky: binnedTrend(obs, (o) => o.cloudCoverMean, (o) => o.nummern, 10, 0, 100),
    wind: binnedTrend(windObs, (o) => o.tailwindComponent as number, (o) => o.schlagpunkte, 2, -10, 10),
  };
  writeJson("charts.json", charts);
}

main();
