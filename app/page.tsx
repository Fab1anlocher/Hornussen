import Link from "next/link";
import { getAnalysis, getVenues } from "@/lib/data";
import { StatTile, VerdictBadge, VerdictCard } from "@/components/ui";
import { Nouss } from "@/components/Nouss";

export default function Home() {
  const analysis = getAnalysis();
  const venues = getVenues();
  const venuesWithDir = venues.filter((v) => v.playingDirectionDeg != null).length;
  const bs = analysis?.blueSky;
  const clearPct =
    bs && bs.overcastMean ? Math.round((bs.clearMean / bs.overcastMean - 1) * 100) : 0;

  return (
    <>
      {/* Hero */}
      <section className="hero-sky relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-0 top-1/3">
            <Nouss size={26} className="animate-fly-nouss opacity-80" />
          </div>
        </div>
        <div className="mx-auto max-w-5xl px-4 pb-20 pt-16 sm:pt-24">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)]/70 px-3 py-1 text-sm font-medium text-[var(--text-secondary)] backdrop-blur">
            <Nouss size={16} /> Hornussen · Datenanalyse
          </p>
          <h1 className="max-w-3xl font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
            Sieht man den Nouss bei blauem Himmel wirklich schlechter?
          </h1>
          <blockquote className="mt-6 max-w-2xl border-l-4 border-meadow-400 pl-4 text-lg italic text-[var(--text-secondary)]">
            «Bei blauem Himmel sieht man den Nouss schlechter, wodurch mehr Nummern
            entstehen.»
            <span className="mt-1 block text-sm not-italic text-[var(--text-muted)]">
              — verbreitete Hornusser-Weisheit
            </span>
          </blockquote>

          {bs && (
            <div className="mt-7 inline-flex max-w-2xl flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 px-5 py-4 backdrop-blur">
              <VerdictBadge level={bs.verdict.level} />
              <span className="text-lg font-semibold leading-snug">
                {bs.verdict.level === "confirmed" ? "Ja" : "Kurz gesagt"} — bei wolkenlosem Himmel
                fallen im Schnitt <span className="text-sky-700 dark:text-sky-400">+{clearPct} %</span>{" "}
                mehr Nummern als bei bedecktem Himmel.
              </span>
            </div>
          )}

          <p className="mt-6 max-w-2xl text-lg text-[var(--text-secondary)]">
            Wir prüfen diese Volksweisheit mit echten Zahlen: {analysis ? formatN(analysis.totalMatches) : "tausenden"}{" "}
            Meisterschaftsspielen des EHV, kombiniert mit stundengenauen historischen
            Wetterdaten für jeden Spieltag und jeden Platz.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/wetter"
              className="rounded-full bg-meadow-600 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-meadow-700"
            >
              Zur Himmel-Analyse
            </Link>
            <Link
              href="/wind"
              className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-5 py-2.5 font-semibold text-[var(--text-primary)] transition hover:bg-[var(--surface-2)]"
            >
              Bringt Rückenwind mehr?
            </Link>
          </div>
        </div>
      </section>

      {/* Verdicts */}
      <section className="mx-auto max-w-5xl px-4 py-14">
        <h2 className="mb-6 font-display text-2xl font-bold tracking-tight">Das Urteil in Kürze</h2>
        {analysis ? (
          <div className="grid gap-5 md:grid-cols-2">
            <VerdictCard title="Blauer Himmel → mehr Nummern" verdict={analysis.blueSky.verdict} />
            <VerdictCard title="Rückenwind → mehr Schlagpunkte" verdict={analysis.wind.verdict} />
          </div>
        ) : (
          <div className="card p-6 text-[var(--text-secondary)]">
            Noch keine Analyse vorhanden. Führe die Daten-Pipeline aus:{" "}
            <code className="rounded bg-[var(--surface-2)] px-1.5 py-0.5">npm run pipeline</code>.
          </div>
        )}
      </section>

      {/* Key numbers */}
      {analysis && (
        <section className="mx-auto max-w-5xl px-4 pb-16">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatTile value={formatN(analysis.totalMatches)} label="Meisterschaftsspiele" sub={`${analysis.seasons.length} Saisons`} />
            <StatTile value={formatN(analysis.observationsWithWeather)} label="Team-Resultate mit Wetter" accent="var(--series-1)" />
            <StatTile value={`${analysis.seasons[0]}–${analysis.seasons[analysis.seasons.length - 1]}`} label="Zeitraum" />
            <StatTile value={`${venuesWithDir}`} label="Plätze mit Spielrichtung" sub={`von ${venues.length} erfasst`} />
          </div>
        </section>
      )}

      {/* Explainer */}
      <section className="border-t border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto grid max-w-5xl gap-8 px-4 py-14 md:grid-cols-3">
          <Explainer title="Was ist eine «Nummer»?">
            Verpasst die abtuende Mannschaft den anfliegenden Nouss und lässt ihn im Feld
            aufkommen, gibt das eine Nummer. Je schlechter man den Nouss sieht, desto eher
            passiert das — so die Theorie.
          </Explainer>
          <Explainer title="Warum blauer Himmel?">
            Vor wolkenlosem Himmel fehlt der Kontrast, der kleine schwarze Nouss verschwindet
            im gleissenden Licht. Bei Bewölkung hebt er sich angeblich besser ab.
          </Explainer>
          <Explainer title="Und der Wind?">
            Der Nouss fliegt bis 350 m weit — stark abhängig vom Wind. Mit Rückenwind sollten
            mehr Schlagpunkte drinliegen. Auch das prüfen wir, Platz für Platz.
          </Explainer>
        </div>
      </section>
    </>
  );
}

function Explainer({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 font-display text-lg font-semibold">{title}</h3>
      <p className="text-[var(--text-secondary)]">{children}</p>
    </div>
  );
}

function formatN(n: number): string {
  return n.toLocaleString("de-CH");
}
