import { getAnalysis, getObservations, getVenues } from "@/lib/data";
import { binnedTrend } from "@/lib/chart-data";
import { BarBuckets } from "@/components/charts/BarBuckets";
import { BinnedTrend } from "@/components/charts/BinnedTrend";
import { SectionHeading, StatTile, VerdictBadge } from "@/components/ui";
import { cardinal, windFactor } from "@/lib/wind";

export const metadata = { title: "Rückenwind & Schlagpunkte — Hornussen-Wetteranalyse" };

export default function WindPage() {
  const analysis = getAnalysis();
  const obs = getObservations();
  const venues = getVenues();
  if (!analysis) return <NoData />;

  const w = analysis.wind;
  const windObs = obs.filter(
    (o) => typeof o.tailwindComponent === "number" && Number.isFinite(o.tailwindComponent as number),
  );
  const trend = binnedTrend(
    windObs,
    (o) => o.tailwindComponent as number,
    (o) => o.schlagpunkte,
    2,
    -10,
    10,
  );
  const corr = w.correlation;
  const configured = venues.filter((v) => v.playingDirectionDeg != null);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <SectionHeading kicker="Hypothese 2" title="Bringt Rückenwind mehr Schlagpunkte?">
        Der Nouss fliegt bis 350 m — und der Wind schiebt mit. Für jeden Platz mit erfasster
        Spielrichtung berechnen wir die <em>Rückenwind-Komponente</em> (km/h in Schlagrichtung)
        und vergleichen sie mit den erzielten Schlagpunkten.
      </SectionHeading>

      <div className="mb-8 flex flex-wrap items-center gap-3">
        <VerdictBadge level={w.verdict.level} />
        <span className="text-lg font-medium">{w.verdict.headline}</span>
      </div>

      <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile value={fmt0(w.tailwindMean)} label="Ø Schlagpunkte bei Rückenwind" sub="≥ +1 km/h" accent="var(--pole-tail)" />
        <StatTile value={fmt0(w.headwindMean)} label="Ø Schlagpunkte bei Gegenwind" sub="≤ −1 km/h" accent="var(--pole-head)" />
        <StatTile
          value={Number.isFinite(w.ratio) ? `${w.ratio >= 1 ? "+" : ""}${((w.ratio - 1) * 100).toFixed(0)} %` : "—"}
          label="Unterschied Rücken- vs. Gegenwind"
        />
        <StatTile value={fmtR(corr.pearson)} label="Korrelation (Pearson)" sub={`n = ${corr.n.toLocaleString("de-CH")}`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <figure className="card p-5">
          <figcaption className="mb-1 font-display text-lg font-semibold">
            Schlagpunkte nach Windlage
          </figcaption>
          <p className="mb-3 text-sm text-[var(--text-muted)]">
            Mittlere Schlagpunkte pro Team &amp; Spiel. Rot = Gegenwind, Blau = Rückenwind.
          </p>
          <BarBuckets
            buckets={w.buckets}
            unit="Punkte"
            colors={["var(--pole-head)", "var(--text-muted)", "var(--pole-tail)"]}
          />
        </figure>

        <figure className="card p-5">
          <figcaption className="mb-1 font-display text-lg font-semibold">
            Trend: Rückenwind vs. Schlagpunkte
          </figcaption>
          <p className="mb-3 text-sm text-[var(--text-muted)]">
            Punkte = Mittelwert je 2-km/h-Band, Linie = lineare Regression. Positiv =
            Rückenwind.
          </p>
          <BinnedTrend
            bins={trend.bins}
            line={trend.line}
            xLabel="Rückenwind-Komponente (km/h)"
            yLabel="Ø Schlagpunkte"
            xUnit="km/h"
            color="var(--pole-tail)"
          />
        </figure>
      </div>

      {/* Model */}
      <div className="card mt-8 p-6">
        <h3 className="mb-2 font-display text-lg font-semibold">Das Erwartungsmodell</h3>
        <p className="text-[var(--text-secondary)]">
          Die Theorie «mit Wind ~20 % mehr» lässt sich als Faktor schreiben:{" "}
          <code className="rounded bg-[var(--surface-2)] px-1.5 py-0.5">
            Faktor = 1 + k · Rückenwind[km/h]
          </code>
          . Mit dem aktuell konfigurierten <strong>k = {w.modelK}</strong> ergibt das:
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[0, 5, 10, 15].map((v) => (
            <div key={v} className="rounded-xl bg-[var(--surface-2)] p-3 text-center">
              <div className="font-display text-2xl font-bold tabular">
                ×{windFactor(v, w.modelK).toFixed(2)}
              </div>
              <div className="text-xs text-[var(--text-muted)]">bei {v} km/h Rückenwind</div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-[var(--text-muted)]">
          k ist frei einstellbar in{" "}
          <code className="rounded bg-[var(--surface-2)] px-1.5 py-0.5">config/playing-directions.json</code>.
          Das Modell dient dem Vergleich mit der oben gemessenen, <em>empirischen</em> Realität.
        </p>
      </div>

      {/* Configured venues */}
      <div className="card mt-8 p-6">
        <h3 className="mb-3 font-display text-lg font-semibold">
          Erfasste Spielrichtungen ({configured.length})
        </h3>
        {configured.length === 0 ? (
          <p className="text-[var(--text-secondary)]">
            Noch keine Spielrichtungen gesetzt. Ergänze sie in{" "}
            <code className="rounded bg-[var(--surface-2)] px-1.5 py-0.5">config/playing-directions.json</code>.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {configured.map((v) => (
              <span
                key={v.id}
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1 text-sm"
              >
                <span className="font-medium">{v.name}</span>
                <span className="text-[var(--text-muted)]">
                  {Math.round(v.playingDirectionDeg!)}° {cardinal(v.playingDirectionDeg!)}
                </span>
              </span>
            ))}
          </div>
        )}
        <p className="mt-3 text-sm text-[var(--text-muted)]">
          Nur Spiele auf diesen Plätzen (als Heimplatz) fliessen in die Wind-Analyse ein — für
          beide Mannschaften, da sie am selben Ort in dieselbe Richtung schlagen.
        </p>
      </div>
    </div>
  );
}

function fmt0(n: number): string {
  return Number.isFinite(n) ? Math.round(n).toLocaleString("de-CH") : "—";
}
function fmtR(r: number): string {
  return Number.isFinite(r) ? (r >= 0 ? "+" : "") + r.toFixed(2) : "—";
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
