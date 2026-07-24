// Server-side data loaders. Reads the committed JSON datasets produced by the
// pipeline scripts. Used by React Server Components.
import fs from "node:fs";
import path from "node:path";
import type { AnalysisResult, Match, Observation, PlayingDirectionEntry, Venue } from "./types";
import type { TrendData } from "./chart-data";

const DATA_DIR = path.join(process.cwd(), "data");

function readJson<T>(file: string, fallback: T): T {
  const p = path.join(DATA_DIR, file);
  try {
    return JSON.parse(fs.readFileSync(p, "utf-8")) as T;
  } catch {
    return fallback;
  }
}

export function getVenues(): Venue[] {
  return readJson<Venue[]>("venues.json", []);
}

/** User-configured playing directions (from config/, source of truth). */
export function getPlayingDirections(): PlayingDirectionEntry[] {
  try {
    const p = path.join(process.cwd(), "config", "playing-directions.json");
    return (JSON.parse(fs.readFileSync(p, "utf-8")).directions ?? []) as PlayingDirectionEntry[];
  } catch {
    return [];
  }
}

export function getMatches(): Match[] {
  return readJson<Match[]>("matches.json", []);
}

export function getObservations(): Observation[] {
  return readJson<Observation[]>("dataset.json", []);
}

export function getAnalysis(): AnalysisResult | null {
  return readJson<AnalysisResult | null>("analysis.json", null);
}

export interface ChartsData {
  blueSky: TrendData;
  wind: TrendData;
}

export function getCharts(): ChartsData | null {
  return readJson<ChartsData | null>("charts.json", null);
}
