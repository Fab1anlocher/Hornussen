// Server-side data loaders. Reads the committed JSON datasets produced by the
// pipeline scripts. Used by React Server Components.
import fs from "node:fs";
import path from "node:path";
import type { AnalysisResult, Match, Observation, Venue } from "./types";

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

export function getMatches(): Match[] {
  return readJson<Match[]>("matches.json", []);
}

export function getObservations(): Observation[] {
  return readJson<Observation[]>("dataset.json", []);
}

export function getAnalysis(): AnalysisResult | null {
  return readJson<AnalysisResult | null>("analysis.json", null);
}
