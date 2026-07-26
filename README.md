# Nouss & Wetter: die Hornussen-Wetteranalyse

Untersucht datenbasiert die Hornusser-Volksweisheit **„Bei blauem Himmel sieht man den
Nouss schlechter, wodurch mehr Nummern entstehen"**. Untersucht wird auch die These, dass Rückenwind mehr
Schlagpunkte bringt. Für die Schweizer Hornusser-Gemeinschaft.

Die Website ist ein **One-Pager**: eine Scroll-Geschichte zur Blauer-Himmel-These in vier
Kapiteln. Die Wind-Analyse läuft weiterhin in der Pipeline mit und liegt in
`data/analysis.json` bereit, wird aktuell aber nicht dargestellt.

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind. Statische JSON-Datenpipeline,
deploybar auf Vercel. Keine Chart- oder Karten-Bibliothek, der Okta-Chart ist reines
CSS.

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
npm run verify                            # rechnet alle Zahlen der Seite unabhängig nach
```

`npm run verify` liest `matches.json` und `dataset.json` neu ein und prüft jede Zahl,
die die Seite zitiert, gegen eine unabhängige Rechnung. Läuft am Ende von `npm run pipeline`
automatisch mit und bricht ab, wenn etwas nicht stimmt.

Erzeugt versionierte Datensätze in `data/`:
`venues.json`, `matches.json`, `weather.json`, `dataset.json`, `analysis.json`.

## App

```bash
npm run dev     # http://localhost:3000
npm run build && npm start
```

Eine einzige Seite: `/`, die Scroll-Geschichte. Sie zieht alle Zahlen aus
`data/analysis.json`, nichts ist im Markup fest verdrahtet.

Der Aufbau: Hero (Weisheit) → Kapitel 1 «Worum es geht» → Kapitel 2 «Das Ergebnis»
(+50 %, Okta-Chart) → Kapitel 3 «Der Haken» (Schwelle statt Skala) → Kapitel 4 «Was wir
nicht wissen» → Schlusszitat.

Alle Scroll-Effekte hängen an `components/story/StoryMotion.tsx`; das Markup selbst trägt
nur `data-`Attribute. Animationen sind über die `js`-Klasse am `<html>` gated und in
`prefers-reduced-motion` abgeschaltet. Ohne JavaScript rendert die Seite vollständig und
lesbar. Parallax ist unter 700 px Breite aus (ruckelt sonst auf dem Handy).

## Spielrichtungen ergänzen

`config/playing-directions.json`: je Platz Azimut (0°=N, 90°=O …), in die der Nouss
geschlagen wird, plus Koordinaten (aus `data/venues.json` übernehmen). `model.k` steuert das
Wind-Erwartungsmodell (`Faktor = 1 + k · Rückenwind[km/h]`), `playWindowStart/End` das
angenommene Spielfenster. Nach dem Editieren:
`npm run scrape:venues && npm run build:dataset && npm run analyze`.

## Automatik

`.github/workflows/scrape.yml` läuft wöchentlich, aktualisiert `data/*.json` und committet,
Vercel deployt den Commit automatisch.

## Grenzen

Reanalyse-Wetter (~9–25 km, nicht das Mikroklima am Ries), keine exakten Anspielzeiten
(Fenster ~12–17 Uhr angenommen), Heimplatz = erstgenannte Mannschaft, Wind-Analyse nur für
Plätze mit erfasster Richtung. Korrelation ≠ Kausalität, Kapitel 5 der Seite sagt das auch
so. Der Okta-Chart hat eine gekürzte Achse, damit der Schwelleneffekt sichtbar wird; das ist
unter der Grafik vermerkt.
