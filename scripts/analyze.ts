// Runs the statistical analysis over the observation dataset and writes
// data/analysis.json (consumed by the frontend).
import type { Observation, PlayingDirectionsConfig } from "../lib/types";
import { analyze } from "../lib/analysis";
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
}

main();
