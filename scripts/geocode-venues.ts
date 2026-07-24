// Fallback for teams whose club is NOT in the EHV/hgverwaltung directory: geocode
// the town name (Open-Meteo Geocoding, Switzerland) to get coordinates for the
// WEATHER lookup. These are approximate town-centroid anchors — good enough for
// regional cloud cover (ERA5 ~9–25 km), never used for playing direction/wind.
//
// Reads data/venues.json + data/matches.json, writes data/geo-venues.json.
import fs from "node:fs";
import path from "node:path";
import type { Match, Venue } from "../lib/types";
import {
  buildVenueResolver,
  CACHE_DIR,
  coordKey,
  ensureDir,
  fetchWithRetry,
  isYouthTeam,
  readData,
  slug,
  sleep,
  writeJson,
} from "./lib-scrape";

const GEO_API = "https://geocoding-api.open-meteo.com/v1/search";

interface GeoHit {
  name: string;
  latitude: number;
  longitude: number;
  country_code?: string;
  admin1?: string;
}

/** Town-name candidates from a team name (strip suffixes; try compound then first token). */
function townCandidates(team: string): string[] {
  const base = team
    .replace(/\s+(A|B|C|D|E)\b/g, "")
    .replace(/\s+(SG|HG)\b/gi, "")
    .replace(/\s+\b(BE|SO|LU|AG|FR|BL|ZH|TG|SH)\b/g, "") // trailing canton hints
    .trim();
  const cands = [base];
  if (base.includes("-")) cands.push(base.split("-")[0].trim());
  return [...new Set(cands)].filter((c) => c.length >= 3);
}

async function geocode(
  query: string,
  cache: Record<string, GeoHit | null>,
): Promise<GeoHit | null> {
  if (query in cache) return cache[query];
  const url = `${GEO_API}?name=${encodeURIComponent(query)}&count=5&language=de&format=json`;
  try {
    const res = await fetchWithRetry(url);
    const json = (await res.json()) as { results?: GeoHit[] };
    const hit = (json.results ?? []).find((r) => r.country_code === "CH") ?? null;
    cache[query] = hit;
    await sleep(250);
    return hit;
  } catch {
    cache[query] = null;
    return null;
  }
}

async function main() {
  const venues = readData<Venue[]>("venues.json", []);
  const matches = readData<Match[]>("matches.json", []);
  const resolve = buildVenueResolver(venues);

  // Unresolved home teams (these determine match location) with match counts.
  const missing = new Map<string, number>();
  for (const m of matches) {
    if (isYouthTeam(m.home.team)) continue;
    if (!resolve(m.home.team)) missing.set(m.home.team, (missing.get(m.home.team) ?? 0) + 1);
  }
  const teams = [...missing.entries()].sort((a, b) => b[1] - a[1]);
  console.log(`${teams.length} unresolved home teams → geocoding town names …`);

  ensureDir(CACHE_DIR);
  const cachePath = path.join(CACHE_DIR, "geocode.json");
  const cache: Record<string, GeoHit | null> = fs.existsSync(cachePath)
    ? JSON.parse(fs.readFileSync(cachePath, "utf-8"))
    : {};

  const geoVenues: Venue[] = [];
  let ok = 0;
  for (const [team] of teams) {
    let hit: GeoHit | null = null;
    for (const q of townCandidates(team)) {
      hit = await geocode(q, cache);
      if (hit) break;
    }
    fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2));
    if (!hit) continue;
    ok++;
    geoVenues.push({
      id: slug(`geo-${team}-${coordKey(hit.latitude, hit.longitude)}`),
      name: team,
      ort: hit.name,
      lat: hit.latitude,
      lng: hit.longitude,
      teams: [team],
      playingDirectionDeg: null,
      source: "geocoded",
    });
  }

  console.log(`  geocoded ${ok}/${teams.length} teams (rest have no Swiss match)`);
  writeJson("geo-venues.json", geoVenues);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
