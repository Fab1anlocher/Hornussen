# Nouss & Wetter — Hornussen-Wetteranalyse

Untersucht datenbasiert die Hornusser-Volksweisheit **„Bei blauem Himmel sieht man den
Nouss schlechter, wodurch mehr Nummern entstehen"** — und die These, dass Rückenwind mehr
Schlagpunkte bringt. Für die Schweizer Hornusser-Gemeinschaft.

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind · Recharts · MapLibre. Statische
JSON-Datenpipeline, deploybar auf Vercel.

## Datenquellen

| Was | Quelle |
|---|---|
| Meisterschaftsresultate | EHV-Archiv (`ehv.ch/listen/…`), Runden-PDFs, geparst mit `pdftotext` |
| Spielplätze (Koordinaten) | hgverwaltung/EHV-Verzeichnis (`hgverwaltung.ch/api/1/clubs/locations/alle`) |
| Wetter (stundengenau, historisch) | Open-Meteo Historical Weather API (ERA5-Reanalyse, kein Key nötig) |
| Spielrichtung pro Platz | manuell gepflegt in `config/playing-directions.json` |

## Pipeline

Voraussetzung: **`pdftotext`** (poppler-utils) auf dem PATH.

```bash
npm install
npm run pipeline        # venues → archive → weather → dataset → analyze
# oder einzeln:
npm run scrape:venues
npm run scrape:archive                    # alle Saisons ab 2013
npm run scrape:archive -- --years=2025    # nur eine Saison
npm run scrape:weather                    # gecacht in .cache/weather
npm run build:dataset
npm run analyze
```

Erzeugt versionierte Datensätze in `data/`:
`venues.json`, `matches.json`, `weather.json`, `dataset.json`, `analysis.json`.

## App

```bash
npm run dev     # http://localhost:3000
npm run build && npm start
```

Seiten: `/` (Übersicht + Urteil), `/wetter` (Blauer-Himmel-These), `/wind`
(Rückenwind-These), `/plaetze` (Karte + Spielrichtungen), `/daten` (Methodik & Grenzen).

## Spielrichtungen ergänzen

`config/playing-directions.json` — je Platz Azimut (0°=N, 90°=O …), in die der Nouss
geschlagen wird, plus Koordinaten (aus `data/venues.json` übernehmen). `model.k` steuert das
Wind-Erwartungsmodell (`Faktor = 1 + k · Rückenwind[km/h]`), `playWindowStart/End` das
angenommene Spielfenster. Nach dem Editieren:
`npm run scrape:venues && npm run build:dataset && npm run analyze`.

## Automatik

`.github/workflows/scrape.yml` läuft wöchentlich, aktualisiert `data/*.json` und committet —
Vercel deployt den Commit automatisch.

## Grenzen

Reanalyse-Wetter (~9–25 km, nicht das Mikroklima am Ries), keine exakten Anspielzeiten
(Fenster ~12–17 Uhr angenommen), Heimplatz = erstgenannte Mannschaft, Wind-Analyse nur für
Plätze mit erfasster Richtung. Details unter `/daten`. Korrelation ≠ Kausalität.
