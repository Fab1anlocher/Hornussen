// Fetches historical hourly weather (Open-Meteo archive API, free, no key) for
// every match LOCATION (= home team's field) and date, aggregated over the
// assumed playing window. Wind is vector-averaged so rotating wind is handled.
//
// Cached per (location, season) in .cache/weather to avoid refetching.
import fs from "node:fs";
import path from "node:path";
import type { Match, MatchWeather, PlayingDirectionsConfig, Venue } from "../lib/types";
import {
  buildVenueResolver,
  CACHE_DIR,
  coordKey,
  ensureDir,
  fetchWithRetry,
  readConfig,
  readData,
  sleep,
  writeJson,
} from "./lib-scrape";

const ARCHIVE_API = "https://archive-api.open-meteo.com/v1/archive";
const HOURLY = "temperature_2m,cloud_cover,wind_speed_10m,wind_direction_10m,wind_gusts_10m";

interface OpenMeteoResponse {
  hourly?: {
    time: string[];
    temperature_2m: number[];
    cloud_cover: number[];
    wind_speed_10m: number[];
    wind_direction_10m: number[];
    wind_gusts_10m: number[];
  };
}

async function fetchSeason(
  lat: number,
  lng: number,
  year: number,
  start: string,
  end: string,
): Promise<OpenMeteoResponse> {
  const cacheDir = path.join(CACHE_DIR, "weather");
  ensureDir(cacheDir);
  const cachePath = path.join(cacheDir, `${coordKey(lat, lng)}_${year}.json`);
  if (fs.existsSync(cachePath)) {
    return JSON.parse(fs.readFileSync(cachePath, "utf-8"));
  }
  const url =
    `${ARCHIVE_API}?latitude=${lat}&longitude=${lng}` +
    `&start_date=${start}&end_date=${end}&hourly=${HOURLY}&timezone=Europe%2FZurich`;
  const res = await fetchWithRetry(url);
  const json = (await res.json()) as OpenMeteoResponse;
  fs.writeFileSync(cachePath, JSON.stringify(json));
  await sleep(350); // be gentle with the free API
  return json;
}

function aggregate(
  resp: OpenMeteoResponse,
  date: string,
  lat: number,
  lng: number,
  winStart: number,
  winEnd: number,
): MatchWeather | null {
  const h = resp.hourly;
  if (!h) return null;
  const clouds: number[] = [];
  const speeds: number[] = [];
  const temps: number[] = [];
  let gustMax = 0;
  let uSum = 0;
  let vSum = 0;
  for (let i = 0; i < h.time.length; i++) {
    const t = h.time[i]; // "2025-07-12T14:00"
    if (!t.startsWith(date)) continue;
    const hour = Number(t.slice(11, 13));
    if (hour < winStart || hour > winEnd) continue;
    const cc = h.cloud_cover[i];
    const sp = h.wind_speed_10m[i];
    const dir = h.wind_direction_10m[i];
    const temp = h.temperature_2m[i];
    const gust = h.wind_gusts_10m[i];
    if (cc != null) clouds.push(cc);
    if (temp != null) temps.push(temp);
    if (gust != null) gustMax = Math.max(gustMax, gust);
    if (sp != null && dir != null) {
      speeds.push(sp);
      // Vector where the wind blows TOWARD (dir is the FROM direction).
      const to = ((dir + 180) * Math.PI) / 180;
      uSum += sp * Math.sin(to);
      vSum += sp * Math.cos(to);
    }
  }
  if (clouds.length === 0 || speeds.length === 0) return null;
  const n = speeds.length;
  const windU = uSum / n;
  const windV = vSum / n;
  const resultant = Math.hypot(windU, windV);
  const scalarMean = speeds.reduce((a, b) => a + b, 0) / n;
  const fromDeg = (((Math.atan2(windU, windV) * 180) / Math.PI + 180) % 360 + 360) % 360;
  return {
    key: `${coordKey(lat, lng)}@${date}`,
    date,
    lat,
    lng,
    cloudCoverMean: clouds.reduce((a, b) => a + b, 0) / clouds.length,
    cloudCoverMin: Math.min(...clouds),
    windSpeedMean: scalarMean,
    windDirectionMean: fromDeg,
    windU,
    windV,
    windSteadiness: scalarMean === 0 ? 1 : resultant / scalarMean,
    windGustMax: gustMax,
    temperatureMean: temps.reduce((a, b) => a + b, 0) / temps.length,
    hoursUsed: clouds.length,
  };
}

async function main() {
  const matches = readData<Match[]>("matches.json", []);
  const venues = [
    ...readData<Venue[]>("venues.json", []),
    ...readData<Venue[]>("geo-venues.json", []),
  ];
  const cfg = readConfig<PlayingDirectionsConfig>("playing-directions.json", {
    model: { k: 0.02, playWindowStart: 12, playWindowEnd: 17 },
    directions: [],
  });
  const { playWindowStart, playWindowEnd } = cfg.model;

  // team → home field (exact, then normalized fallback)
  const resolve = buildVenueResolver(venues);

  // Collect needed dates per location (match location = home team's field).
  const needed = new Map<string, { lat: number; lng: number; dates: Set<string> }>();
  let unresolved = 0;
  for (const m of matches) {
    const c = resolve(m.home.team);
    if (!c) {
      unresolved++;
      continue;
    }
    const key = coordKey(c.lat, c.lng);
    if (!needed.has(key)) needed.set(key, { lat: c.lat, lng: c.lng, dates: new Set() });
    needed.get(key)!.dates.add(m.date);
  }
  console.log(
    `Need weather for ${needed.size} locations (${unresolved} matches had an unmapped home team)`,
  );

  const weather: MatchWeather[] = [];
  let done = 0;
  for (const { lat, lng, dates } of needed.values()) {
    // group dates by year → one API call per (location, year)
    const byYear = new Map<number, string[]>();
    for (const d of dates) {
      const y = Number(d.slice(0, 4));
      if (!byYear.has(y)) byYear.set(y, []);
      byYear.get(y)!.push(d);
    }
    for (const [year, ds] of byYear) {
      ds.sort();
      try {
        const resp = await fetchSeason(lat, lng, year, ds[0], ds[ds.length - 1]);
        for (const d of ds) {
          const w = aggregate(resp, d, lat, lng, playWindowStart, playWindowEnd);
          if (w) weather.push(w);
        }
      } catch (e) {
        console.warn(`  ! weather ${lat},${lng} ${year}: ${(e as Error).message.split("\n")[0]}`);
      }
    }
    done++;
    if (done % 25 === 0) console.log(`  … ${done}/${needed.size} locations`);
  }

  console.log(`Aggregated ${weather.length} match-day weather records`);
  writeJson("weather.json", weather);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
