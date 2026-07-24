import { getAnalysis, getCharts } from "@/lib/data";
import { BarBuckets } from "@/components/charts/BarBuckets";
import { BinnedTrend } from "@/components/charts/BinnedTrend";
import { SectionHeading, StatTile, VerdictBadge } from "@/components/ui";

export const metadata = { title: "Blauer Himmel & Nummern — Hornussen-Wetteranalyse" };

export default function WetterPage() {
  const analysis = getAnalysis();
  const charts = getCharts();
  if (!analysis || !charts) return <NoData />;

  const bs = analysis.blueSky;
  const trend = charts.blueSky;
  const corr = bs.correlation;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <SectionHeading kicker="Hypothese 1" title="Blauer Himmel → mehr Nummern?">
        Die Weisheit sagt: Ohne Wolken verschwindet der Nouss im Licht, das Abtun misslingt
        öfter. Wenn das stimmt, müssten bei tiefer Bewölkung <em>mehr</em> Nummern fallen.
      </SectionHeading>

      <div className="mb-8 flex flex-wrap items-center gap-3">
        <VerdictBadge level={bs.verdict.level} />
        <span className="text-lg font-medium">{bs.verdict.headline}</span>
      </div>

      <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile value={bs.clearMean.toFixed(2)} label="Ø Nummern bei blauem Himmel" sub="< 25 % Wolken" accent="var(--series-1)" />
        <StatTile value={bs.overcastMean.toFixed(2)} label="Ø Nummern bei bedecktem Himmel" sub="> 75 % Wolken" />
        <StatTile value={fmtR(corr.pearson)} label="Korrelation (Pearson)" sub={`Spearman ${fmtR(corr.spearman)}`} />
        <StatTile value={corr.pValueApprox < 0.001 ? "< 0.001" : corr.pValueApprox.toFixed(3)} label="p-Wert (ca.)" sub={`n = ${corr.n.toLocaleString("de-CH")}`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <figure className="card p-5">
          <figcaption className="mb-1 font-display text-lg font-semibold">
            Nummern nach Bewölkung
          </figcaption>
          <p className="mb-3 text-sm text-[var(--text-muted)]">
            Mittlere Nummern pro Team &amp; Spiel, gruppiert nach Bewölkungsgrad. Fehlerbalken =
            Standardfehler.
          </p>
          <BarBuckets buckets={bs.buckets} unit="Nummern" />
        </figure>

        <figure className="card p-5">
          <figcaption className="mb-1 font-display text-lg font-semibold">
            Trend über den ganzen Bereich
          </figcaption>
          <p className="mb-3 text-sm text-[var(--text-muted)]">
            Punkte = Mittelwert je 10-%-Wolkenband (Grösse ∝ Anzahl Spiele), Linie = lineare
            Regression.
          </p>
          <BinnedTrend
            bins={trend.bins}
            line={trend.line}
            xLabel="Bewölkung (%)"
            yLabel="Ø Nummern"
            xUnit="%"
          />
        </figure>
      </div>

      <div className="card mt-8 p-6">
        <h3 className="mb-2 font-display text-lg font-semibold">Interpretation</h3>
        <p className="text-[var(--text-secondary)]">{bs.verdict.detail}</p>
        <p className="mt-3 text-sm text-[var(--text-muted)]">
          Gelesen wird die Weisheit als <em>negative</em> Korrelation: weniger Wolken (blauer
          Himmel) → mehr Nummern. Ein negativer Pearson-Wert stützt die These, ein positiver
          spricht dagegen. Zur Einordnung und zu den Grenzen dieser Auswertung siehe die{" "}
          <a href="/daten" className="underline">Methodik-Seite</a>.
        </p>
      </div>
    </div>
  );
}

function fmtR(r: number): string {
  if (!Number.isFinite(r)) return "—";
  return (r >= 0 ? "+" : "") + r.toFixed(2);
}

function NoData() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center text-[var(--text-secondary)]">
      <h1 className="mb-3 font-display text-2xl font-bold">Noch keine Daten</h1>
      <p>
        Führe zuerst die Pipeline aus:{" "}
        <code className="rounded bg-[var(--surface-2)] px-1.5 py-0.5">npm run pipeline</code>.
      </p>
    </div>
  );
}
