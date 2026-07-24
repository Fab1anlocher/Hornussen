// Joins matches + venues + weather into per-team-match observations (two per
// match — home & away — since both teams played under the same sky and hit in
// the same direction at the same field).
import type {
  Match,
  MatchWeather,
  Observation,
  PlayingDirectionsConfig,
  TeamMatchResult,
  Venue,
} from "../lib/types";
import { tailwindFromVector } from "../lib/wind";
import {
  buildVenueResolver,
  coordKey,
  isYouthTeam,
  readConfig,
  readData,
  writeJson,
} from "./lib-scrape";

function makeObservation(
  m: Match,
  side: TeamMatchResult,
  opponent: TeamMatchResult,
  isHome: boolean,
  venue: Venue | undefined,
  weather: MatchWeather | undefined,
): Observation | null {
  if (!Number.isFinite(side.nummern) && !Number.isFinite(side.schlagpunkte)) return null;
  const dir = venue?.playingDirectionDeg ?? null;
  let tailwind: number | null = null;
  if (weather && dir != null) {
    tailwind = tailwindFromVector(weather.windU, weather.windV, dir);
  }
  return {
    matchId: m.id,
    date: m.date,
    season: m.season,
    league: m.league,
    team: side.team,
    opponent: opponent.team,
    isHome,
    nummern: side.nummern,
    schlagpunkte: side.schlagpunkte,
    rundenpunkte: side.rundenpunkte,
    venueId: venue?.id,
    venueName: venue?.name,
    lat: venue?.lat,
    lng: venue?.lng,
    cloudCoverMean: weather?.cloudCoverMean,
    cloudCoverMin: weather?.cloudCoverMin,
    windSpeedMean: weather?.windSpeedMean,
    windDirectionMean: weather?.windDirectionMean,
    temperatureMean: weather?.temperatureMean,
    playingDirectionDeg: dir,
    tailwindComponent: tailwind,
  };
}

function main() {
  const matches = readData<Match[]>("matches.json", []);
  const venues = readData<Venue[]>("venues.json", []);
  const weather = readData<MatchWeather[]>("weather.json", []);
  readConfig<PlayingDirectionsConfig>("playing-directions.json", {
    model: { k: 0.02, playWindowStart: 12, playWindowEnd: 17 },
    directions: [],
  });

  const resolve = buildVenueResolver(venues);
  const weatherByKey = new Map<string, MatchWeather>();
  for (const w of weather) weatherByKey.set(w.key, w);

  const observations: Observation[] = [];
  for (const m of matches) {
    if (isYouthTeam(m.home.team) || isYouthTeam(m.away.team)) continue; // exclude Nachwuchs
    const venue = resolve(m.home.team); // match location = home field
    const weatherRec = venue
      ? weatherByKey.get(`${coordKey(venue.lat, venue.lng)}@${m.date}`)
      : undefined;
    const oHome = makeObservation(m, m.home, m.away, true, venue, weatherRec);
    const oAway = makeObservation(m, m.away, m.home, false, venue, weatherRec);
    if (oHome) observations.push(oHome);
    if (oAway) observations.push(oAway);
  }

  const withWeather = observations.filter((o) => typeof o.cloudCoverMean === "number").length;
  const withWind = observations.filter(
    (o) => typeof o.tailwindComponent === "number" && Number.isFinite(o.tailwindComponent as number),
  ).length;
  console.log(
    `Built ${observations.length} observations from ${matches.length} matches\n` +
      `  with weather: ${withWeather}\n  with wind (direction set): ${withWind}`,
  );
  writeJson("dataset.json", observations);
}

main();
