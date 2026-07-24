// Wind logic: relate meteorological wind to the direction the Nouss is played.
//
// Convention:
//  - playingDirectionDeg = azimuth (0°=N, 90°=E, 180°=S, 270°=W) the Nouss is HIT TOWARD.
//  - windDirectionMean   = meteorological "from" direction (0°=wind coming FROM north).
//
// The wind blows TOWARD (windFrom + 180) mod 360. A pure tailwind (helps the
// Nouss fly farther) is when the wind blows toward the playing direction.

/** Smallest absolute angle (deg) between two azimuths, in [0,180]. */
export function angleBetween(a: number, b: number): number {
  const d = Math.abs(((a - b) % 360) + 360) % 360;
  return d > 180 ? 360 - d : d;
}

/** Direction (deg) the wind blows toward, given the "from" direction. */
export function windToDirection(windFromDeg: number): number {
  return (windFromDeg + 180) % 360;
}

/**
 * Tailwind component in km/h along the playing direction.
 *  > 0  → tailwind (wind pushes the Nouss forward)
 *  < 0  → headwind
 *  = 0  → pure crosswind
 */
export function tailwindComponent(
  windFromDeg: number,
  windSpeedKmh: number,
  playingDirectionDeg: number,
): number {
  const windTo = windToDirection(windFromDeg);
  const theta = (angleBetween(windTo, playingDirectionDeg) * Math.PI) / 180;
  return windSpeedKmh * Math.cos(theta);
}

/**
 * Tailwind component (km/h) from a resultant wind vector along the playing
 * direction. windU/windV point TOWARD where the wind blows (east/north).
 * Equivalent to the average of the per-hour tailwind components, so rotating
 * wind is handled correctly.
 */
export function tailwindFromVector(
  windU: number,
  windV: number,
  playingDirectionDeg: number,
): number {
  const phi = (playingDirectionDeg * Math.PI) / 180;
  // Unit vector where the Nouss is played (east=sin, north=cos).
  return windU * Math.sin(phi) + windV * Math.cos(phi);
}

/**
 * Expected schlagpunkte multiplier from tailwind.
 * factor = 1 + k * tailwindKmh  (headwind → factor < 1).
 * k is configurable in config/playing-directions.json.
 */
export function windFactor(tailwindKmh: number, k: number): number {
  return 1 + k * tailwindKmh;
}

/** Human label for a tailwind value. */
export function tailwindLabel(tailwindKmh: number): string {
  if (tailwindKmh >= 4) return "Starker Rückenwind";
  if (tailwindKmh >= 1) return "Rückenwind";
  if (tailwindKmh > -1) return "Seiten-/Windstille";
  if (tailwindKmh > -4) return "Gegenwind";
  return "Starker Gegenwind";
}

/** Cardinal abbreviation (German) for an azimuth. */
export function cardinal(deg: number): string {
  const dirs = ["N", "NO", "O", "SO", "S", "SW", "W", "NW"];
  return dirs[Math.round(((deg % 360) / 45)) % 8];
}
