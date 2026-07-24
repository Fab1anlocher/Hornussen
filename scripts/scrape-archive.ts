// Scrapes the EHV championship archive: discovers all round-ranking PDFs,
// downloads them (cached), extracts text via `pdftotext -layout`, and parses
// per-match results (teams + Rundenpunkte/Nummern/Schlagpunkte + date).
//
// Usage:
//   tsx scripts/scrape-archive.ts                 # all seasons >= 2013
//   tsx scripts/scrape-archive.ts --years=2025    # single season
//   tsx scripts/scrape-archive.ts --from=2018     # from a season onward
//
// Requires `pdftotext` (poppler-utils) on PATH, or set PDFTOTEXT=/path/to/pdftotext.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import type { Match, TeamMatchResult } from "../lib/types";
import { CACHE_DIR, ensureDir, fetchWithRetry, slug, writeJson } from "./lib-scrape";

const ARCHIVE_INDEX = "https://www.ehv.ch/listen/resultate_meisterschaft_archiv.php";
const BASE = "https://www.ehv.ch/listen/";
const MIN_YEAR = 2013;

function args() {
  const a = process.argv.slice(2);
  const get = (k: string) => {
    const m = a.find((x) => x.startsWith(`--${k}=`));
    return m ? m.split("=")[1] : undefined;
  };
  return { years: get("years"), from: get("from") ? Number(get("from")) : undefined };
}

function pdftotext(pdfPath: string): string {
  const bin = process.env.PDFTOTEXT || "pdftotext";
  // -raw keeps each match on one line with both teams' triples intact;
  // -layout floats long away-team numbers to the top of the section.
  return execFileSync(bin, ["-raw", "-enc", "UTF-8", pdfPath, "-"], {
    encoding: "utf-8",
    maxBuffer: 32 * 1024 * 1024,
  });
}

/** Discover PDF hrefs grouped by season from the archive index page. */
async function discoverPdfs(): Promise<{ url: string; file: string; year: number }[]> {
  const res = await fetchWithRetry(ARCHIVE_INDEX);
  const html = await res.text();
  const out: { url: string; file: string; year: number }[] = [];
  const re = /href=['"]([^'"]*resultate_meisterschaft\/archiv(\d{4})\/([^'"]+\.pdf))['"]/gi;
  let m: RegExpExecArray | null;
  const seen = new Set<string>();
  while ((m = re.exec(html))) {
    const rel = m[1];
    const year = Number(m[2]);
    const file = m[3];
    // Only round rankings carry per-match results (skip SM finals, single lists).
    if (!/rundenrangliste/i.test(file)) continue;
    const url = rel.startsWith("http") ? rel : BASE + rel;
    if (seen.has(url)) continue;
    seen.add(url);
    out.push({ url, file, year });
  }
  return out;
}

function parseDateFromTitleOrFile(text: string, file: string): string | null {
  const t = text.match(/Rundenrangliste vom\s+(\d{2})\.(\d{2})\.(\d{4})/i);
  if (t) return `${t[3]}-${t[2]}-${t[1]}`;
  const iso = file.match(/(\d{4})[-.](\d{2})[-.](\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  return null;
}

// League header, e.g. "NLA 1. Runde", "NLB Gruppe 1 1. Runde", "3. Liga Gruppe 4 1. Runde".
const LEAGUE_HEADER_RE = /^(.{1,40}?)\s+\d+\.\s*Runde\b/i;
const LEAGUE_TOKEN_RE = /NL[AB]?|Liga|St[äa]rkeklasse|Gruppe/i;

function normalizeLeague(raw: string): string {
  return raw
    .replace(/\s+/g, " ")
    .replace(/(\d)\.\s*Liga/i, "$1. Liga")
    .replace(/(\d)\.\s*St/i, "$1. St")
    .trim();
}

function cleanTeam(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

const isInt = (s: string) => /^\d+$/.test(s.trim());

/** Parse "Team name  RP NM SP" (inline 2025 format). */
function parseInlineSide(sideRaw: string): TeamMatchResult | null {
  const m = sideRaw.trim().match(/^(.+?)\s+(\d+)\s+(\d+)\s+(\d+)\s*$/);
  if (!m || isInt(m[1].trim())) return null;
  return {
    team: cleanTeam(m[1]),
    rundenpunkte: Number(m[2]),
    nummern: Number(m[3]),
    schlagpunkte: Number(m[4]),
  };
}

/** Parse "Team name  SP" (team line of the multiline 2013–2024 format). */
function parseTeamSchlag(sideRaw: string): { team: string; schlagpunkte: number } | null {
  const m = sideRaw.trim().match(/^(.+?)\s+(\d+)\s*$/);
  if (!m || isInt(m[1].trim())) return null;
  return { team: cleanTeam(m[1]), schlagpunkte: Number(m[2]) };
}

function parseMatches(text: string, date: string, season: number): Match[] {
  // Work on a compacted (blank-free) line array so neighbour indexing is stable.
  const lines = text.split(/\r?\n/).map((l) => l.trimEnd()).filter((l) => l.trim().length > 0);
  const matches: Match[] = [];
  let league = "?";

  const push = (home: TeamMatchResult, away: TeamMatchResult) => {
    matches.push({
      id: `${date}-${slug(home.team)}-vs-${slug(away.team)}`,
      date,
      season,
      league,
      home,
      away,
    });
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const dashIdx = line.indexOf(" - ");
    if (dashIdx === -1) {
      const hdr = line.match(LEAGUE_HEADER_RE);
      if (hdr && LEAGUE_TOKEN_RE.test(hdr[1])) league = normalizeLeague(hdr[1]);
      continue;
    }
    const left = line.slice(0, dashIdx);
    const right = line.slice(dashIdx + 3);

    // --- Inline format (2025+): "Home RP NM SP - Away RP NM SP" ---
    const inlineHome = parseInlineSide(left);
    if (inlineHome) {
      const inlineAway = parseInlineSide(right);
      if (inlineAway) push(inlineHome, inlineAway);
      continue;
    }

    // --- Multiline format (2013–2024) ---
    // line[i-2]: "Home SP" | line[i-1]: HomeNM | line[i]: "HomeRP - Away SP"
    // line[i+1]: AwayNM   | line[i+2]: AwayRP
    if (isInt(left) && i >= 2 && i + 2 < lines.length) {
      const homeTS = parseTeamSchlag(lines[i - 2]);
      const awayTS = parseTeamSchlag(right);
      const homeNM = lines[i - 1];
      const awayNM = lines[i + 1];
      const awayRP = lines[i + 2];
      if (homeTS && awayTS && isInt(homeNM) && isInt(awayNM) && isInt(awayRP)) {
        push(
          {
            team: homeTS.team,
            rundenpunkte: Number(left),
            nummern: Number(homeNM),
            schlagpunkte: homeTS.schlagpunkte,
          },
          {
            team: awayTS.team,
            rundenpunkte: Number(awayRP),
            nummern: Number(awayNM),
            schlagpunkte: awayTS.schlagpunkte,
          },
        );
      }
    }
  }
  return matches;
}

async function main() {
  const { years, from } = args();
  ensureDir(CACHE_DIR);
  console.log("Discovering archive PDFs …");
  let pdfs = await discoverPdfs();
  pdfs = pdfs.filter((p) => p.year >= MIN_YEAR);
  if (years) pdfs = pdfs.filter((p) => p.year === Number(years));
  if (from) pdfs = pdfs.filter((p) => p.year >= from);
  console.log(`  ${pdfs.length} round-ranking PDFs to process`);

  const allMatches: Match[] = [];
  let ok = 0;
  let fail = 0;
  for (const { url, file, year } of pdfs) {
    const cachePath = path.join(CACHE_DIR, `archiv${year}`, path.basename(file));
    try {
      if (!fs.existsSync(cachePath)) {
        ensureDir(path.dirname(cachePath));
        const res = await fetchWithRetry(url);
        const buf = Buffer.from(await res.arrayBuffer());
        fs.writeFileSync(cachePath, buf);
      }
      const text = pdftotext(cachePath);
      const date = parseDateFromTitleOrFile(text, file);
      if (!date) {
        console.warn(`  ! no date for ${file}, skipping`);
        continue;
      }
      const matches = parseMatches(text, date, Number(date.slice(0, 4)));
      allMatches.push(...matches);
      ok++;
      if (ok <= 3 || ok % 20 === 0) {
        console.log(`  ${file}: ${matches.length} matches (${date})`);
      }
    } catch (e) {
      fail++;
      console.warn(`  ! failed ${file}: ${(e as Error).message.split("\n")[0]}`);
    }
  }

  // Deduplicate (same match id can appear if a round is re-published).
  const byId = new Map<string, Match>();
  for (const m of allMatches) byId.set(m.id, m);
  const matches = [...byId.values()].sort((a, b) => a.date.localeCompare(b.date));

  console.log(`Processed ${ok} PDFs (${fail} failed) → ${matches.length} unique matches`);
  const seasons = [...new Set(matches.map((m) => m.season))].sort();
  console.log(`  seasons: ${seasons.join(", ")}`);
  writeJson("matches.json", matches);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
