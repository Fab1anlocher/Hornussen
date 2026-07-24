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
  const cat = bs.categories;
  const clearVsHeavyPct =
    cat.pairwise.find((p) => /Klar/.test(p.a) && /Stark/.test(p.b))?.pctDiff ?? 0;

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
        <StatTile value={bs.clearMean.toFixed(2)} label="Ø Nummern bei klarem Himmel" sub="0–15 % Wolken" accent="var(--series-1)" />
        <StatTile value={bs.overcastMean.toFixed(2)} label="Ø Nummern bei bedecktem Himmel" sub="85–100 % Wolken" />
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

      {/* Threshold / category comparison */}
      <div className="card mt-8 p-6">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <h3 className="font-display text-xl font-semibold">Schwelleneffekt: Vergleich der Kategorien</h3>
          <span className="rounded-full bg-[var(--surface-2)] px-3 py-1 text-sm text-[var(--text-secondary)]">
            ANOVA F = {cat.anovaF.toFixed(1)}, p {fmtP(cat.anovaP)}
          </span>
        </div>
        <p className="mb-5 text-[var(--text-secondary)]">
          Der Zusammenhang ist <strong>nicht linear</strong>: Fast der gesamte Effekt tritt beim
          <em> klaren</em> Himmel auf. Statt nur die lineare Korrelation zu betrachten, vergleichen
          wir vier Bewölkungs-Kategorien und testen die Unterschiede paarweise (Welch-t-Test).
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[var(--text-muted)]">
                <tr className="border-b border-[var(--border)]">
                  <th className="py-2 pr-3 font-medium">Kategorie</th>
                  <th className="py-2 pr-3 font-medium">Ø Nummern</th>
                  <th className="py-2 font-medium">n</th>
                </tr>
              </thead>
              <tbody className="tabular">
                {cat.buckets.map((b, i) => (
                  <tr key={b.label} className="border-b border-[var(--border)]">
                    <td className="py-2 pr-3">
                      <span
                        className="mr-2 inline-block h-2.5 w-2.5 rounded-full align-middle"
                        style={{ background: i === 0 ? "var(--series-1)" : "var(--text-muted)" }}
                      />
                      {b.label}
                    </td>
                    <td className="py-2 pr-3 font-semibold">
                      {b.mean.toFixed(2)}{" "}
                      <span className="font-normal text-[var(--text-muted)]">± {b.stdErr.toFixed(2)}</span>
                    </td>
                    <td className="py-2 text-[var(--text-secondary)]">{b.count.toLocaleString("de-CH")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-semibold text-[var(--text-secondary)]">Paarweise Unterschiede</h4>
            <ul className="space-y-2 text-sm">
              {cat.pairwise.map((p) => (
                <li key={p.a + p.b} className="flex items-start justify-between gap-3 border-b border-[var(--border)] pb-2">
                  <span className="text-[var(--text-secondary)]">
                    {shortCat(p.a)} vs. {shortCat(p.b)}
                  </span>
                  <span className="flex items-center gap-2 whitespace-nowrap">
                    <span className="font-semibold tabular" style={{ color: p.diff > 0 ? "var(--series-1)" : "var(--text-muted)" }}>
                      {p.pctDiff >= 0 ? "+" : ""}
                      {p.pctDiff.toFixed(0)} %
                    </span>
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-semibold"
                      style={{
                        color: p.significant ? "var(--good)" : "var(--text-muted)",
                        background: p.significant ? "color-mix(in srgb, var(--good) 14%, transparent)" : "var(--surface-2)",
                      }}
                    >
                      {p.significant ? "signifikant" : "n.s."} · p {fmtP(p.p)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="mt-4 text-sm text-[var(--text-muted)]">
          Lesehilfe: Bei klarem Himmel (0–15 %) fallen rund {Math.abs(clearVsHeavyPct).toFixed(0)} %{" "}
          {clearVsHeavyPct >= 0 ? "mehr" : "weniger"} Nummern als bei stark bewölktem Himmel. Der
          Unterschied zwischen «teils» und «stark» bewölkt ist dagegen klein — ein klassischer
          Schwelleneffekt.
        </p>
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

function fmtP(p: number): string {
  if (!Number.isFinite(p)) return "—";
  if (p < 0.001) return "< 0.001";
  return `= ${p.toFixed(3)}`;
}

function shortCat(label: string): string {
  if (/Klar/.test(label)) return "Klar";
  if (/Leicht/.test(label)) return "Leicht bew.";
  if (/Stark/.test(label)) return "Stark bew.";
  if (/Bewölkt/.test(label)) return "Bewölkt";
  return label;
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
