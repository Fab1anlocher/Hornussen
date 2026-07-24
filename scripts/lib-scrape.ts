// Shared helpers for the pipeline scripts (Node-only).
import fs from "node:fs";
import path from "node:path";

export const ROOT = process.cwd();
export const DATA_DIR = path.join(ROOT, "data");
export const CACHE_DIR = path.join(ROOT, ".cache");
export const CONFIG_DIR = path.join(ROOT, "config");

export function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

export function writeJson(file: string, data: unknown): void {
  ensureDir(DATA_DIR);
  const p = path.join(DATA_DIR, file);
  fs.writeFileSync(p, JSON.stringify(data, null, 2));
  console.log(`  → wrote ${path.relative(ROOT, p)}`);
}

export function readData<T>(file: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), "utf-8")) as T;
  } catch {
    return fallback;
  }
}

export function readConfig<T>(file: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(path.join(CONFIG_DIR, file), "utf-8")) as T;
  } catch {
    return fallback;
  }
}

/** Stable slug for ids/keys (keeps umlauts readable, ascii-only). */
export function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Key identifying a physical field by coordinate (4 decimals ≈ 11 m). */
export function coordKey(lat: number, lng: number): string {
  return `${lat.toFixed(4)},${lng.toFixed(4)}`;
}

/** Strip team suffixes to get the club/field base name. */
export function baseName(team: string): string {
  return team
    .replace(/_alt\b/gi, "")
    .replace(/\s+(A|B|C|D|E)\b/g, "")
    .replace(/\s+(NW|Nachwuchs|Junioren|Damen)\b/gi, "")
    .trim();
}

/** Find a configured playing direction for a coordinate (≤ ~70 m tolerance). */
export function findDirection(
  lat: number,
  lng: number,
  directions: { lat: number; lng: number; directionDeg: number; note?: string }[],
): { directionDeg: number; note?: string } | null {
  const d = directions.find(
    (x) => Math.abs(x.lat - lat) < 0.0006 && Math.abs(x.lng - lng) < 0.0009,
  );
  return d ? { directionDeg: d.directionDeg, note: d.note } : null;
}

/** True for youth / Nachwuchs teams (e.g. "Auswil-Wyssbach NW") — excluded from the analysis. */
export function isYouthTeam(name: string): boolean {
  return /\b(NW|Nachwuchs|Junioren|Junior|Jugend)\b/i.test(name);
}

/** Normalized team key for fuzzy venue matching (handles SG/HG + renames). */
export function normalizeTeam(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s+(sg|hg)\s+/g, " ")
    .replace(/\s+(a|b|c|d|e|nw|nachwuchs|junioren|damen)\b/g, "")
    .replace(/[^a-zäöü]/g, "");
}

interface VenueLike {
  teams: string[];
  lat: number;
  lng: number;
}

/**
 * Builds a team → venue resolver: exact team-name match first, then a
 * normalized-base fallback (recovers "Höchstetten SG A" → Höchstetten). Returns
 * undefined for teams with no field in the directory.
 */
export function buildVenueResolver<V extends VenueLike>(venues: V[]): (team: string) => V | undefined {
  const exact = new Map<string, V>();
  const norm = new Map<string, V>();
  for (const v of venues) {
    for (const t of v.teams) {
      exact.set(t, v);
      const n = normalizeTeam(t);
      if (n && !norm.has(n)) norm.set(n, v);
    }
  }
  return (team: string) => exact.get(team) ?? norm.get(normalizeTeam(team));
}

export async function fetchWithRetry(
  url: string,
  init?: RequestInit,
  retries = 3,
): Promise<Response> {
  let lastErr: unknown;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        ...init,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; HornussenWetterAnalyse/1.0; +https://github.com/Fab1anlocher/Hornussen)",
          ...(init?.headers ?? {}),
        },
      });
      if (res.ok) return res;
      lastErr = new Error(`HTTP ${res.status} for ${url}`);
    } catch (e) {
      lastErr = e;
    }
    await sleep(500 * (i + 1));
  }
  throw lastErr;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
