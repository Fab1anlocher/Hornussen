// Fetches the club/venue locations from hgverwaltung and groups team entries
// into physical fields (one per coordinate). Applies playing directions from
// config/playing-directions.json.
import type { PlayingDirectionsConfig, RawVenue, Venue } from "../lib/types";
import {
  baseName,
  coordKey,
  fetchWithRetry,
  isYouthTeam,
  readConfig,
  slug,
  writeJson,
} from "./lib-scrape";

const LOCATIONS_URL = "https://www.hgverwaltung.ch/api/1/clubs/locations/alle";

async function main() {
  console.log("Scraping venues …");
  const res = await fetchWithRetry(LOCATIONS_URL, {
    headers: { Referer: "https://hgverwaltung.ch/embed/1/maptoposat.html" },
  });
  const raw = (await res.json()) as RawVenue[];
  console.log(`  fetched ${raw.length} team-location entries`);

  const cfg = readConfig<PlayingDirectionsConfig>("playing-directions.json", {
    model: { k: 0.02, playWindowStart: 12, playWindowEnd: 17 },
    directions: [],
  });

  // Group by coordinate.
  const byCoord = new Map<string, RawVenue[]>();
  for (const v of raw) {
    if (typeof v.lat !== "number" || typeof v.lng !== "number") continue;
    const key = coordKey(v.lat, v.lng);
    if (!byCoord.has(key)) byCoord.set(key, []);
    byCoord.get(key)!.push(v);
  }

  const venues: Venue[] = [];
  for (const [key, group] of byCoord) {
    const teams = group.map((g) => g.name).filter((n) => !isYouthTeam(n)).sort();
    if (teams.length === 0) continue; // youth-only location → drop
    // Canonical name = most common base name in the group.
    const bases = teams.map(baseName);
    const name = bases.sort(
      (a, b) => bases.filter((x) => x === b).length - bases.filter((x) => x === a).length,
    )[0];
    const rep = group[0];

    // Match a configured playing direction by nearest coordinate (≤ ~60 m).
    const dir = cfg.directions.find(
      (d) => Math.abs(d.lat - rep.lat) < 0.0006 && Math.abs(d.lng - rep.lng) < 0.0009,
    );

    venues.push({
      id: slug(`${name}-${key}`),
      name,
      ort: rep.ort,
      strasse: rep.strasse,
      plz: rep.plz,
      lat: rep.lat,
      lng: rep.lng,
      homepage: rep.homepage,
      teams,
      playingDirectionDeg: dir ? dir.directionDeg : null,
      playingDirectionNote: dir?.note,
    });
  }

  venues.sort((a, b) => a.name.localeCompare(b.name, "de"));
  const withDir = venues.filter((v) => v.playingDirectionDeg != null).length;
  console.log(`  grouped into ${venues.length} physical fields, ${withDir} with playing direction`);
  writeJson("venues.json", venues);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
