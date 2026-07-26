import { getAnalysis } from "@/lib/data";
import { formatCH, formatPct } from "@/lib/format";
import { StoryMotion } from "@/components/story/StoryMotion";
import type { Bucket } from "@/lib/types";

export default function Home() {
  const analysis = getAnalysis();

  if (!analysis) {
    return (
      <main className="mx-auto max-w-xl px-5 py-24 text-center">
        <h1 className="font-display text-3xl font-bold">Noch keine Analyse vorhanden</h1>
        <p className="mt-3 text-[var(--text-secondary)]">
          Führe die Daten-Pipeline aus:{" "}
          <code className="rounded bg-[var(--surface-2)] px-1.5 py-0.5">npm run pipeline</code>.
        </p>
      </main>
    );
  }

  const bs = analysis.blueSky;
  const clearPct = Math.round((bs.clearMean / bs.overcastMean - 1) * 100);
  const bars = withBarHeights(bs.buckets);
  const [heiter, bewoelkt, bedeckt] = bs.categories.buckets;
  const heiterVsBewoelkt = bs.categories.pairwise.find(
    (p) => p.a === heiter?.label && p.b === bewoelkt?.label,
  );
  const firstSeason = analysis.seasons[0];
  const lastSeason = analysis.seasons[analysis.seasons.length - 1];

  return (
    <main>
      <StoryMotion />

      {/* reading progress */}
      <div
        data-progress
        className="fixed left-0 top-0 z-50 h-[3px] w-0 bg-[var(--meadow)]"
        aria-hidden
      />

      {/* ---------------------------------------------------------- hero */}
      <section className="story-sky relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-5 text-center">
        <div
          className="pointer-events-none absolute inset-0"
          style={{ padding: "clamp(80px,14vh,96px) 0 clamp(96px,16vh,140px)" }}
          aria-hidden
        >
          <div data-parallax="0.25" className="absolute right-[11%] top-[9%]">
            <div className="story-sun anim-sun h-[170px] w-[170px] rounded-full" />
          </div>
          <div data-parallax="0.12" className="absolute left-[-40px] top-[22%]">
            <div className="story-cloud anim-drift h-14 w-[220px] rounded-full" />
          </div>
          <div data-parallax="0.18" className="absolute right-[-30px] top-[34%]">
            <div className="story-cloud anim-drift-slow h-11 w-40 rounded-full opacity-75" />
          </div>
          <div className="story-nouss anim-nouss absolute left-0 top-0 h-3.5 w-3.5 rounded-full bg-ink shadow-[0_0_0_4px_rgba(18,36,26,0.12)]" />
        </div>

        <div
          className="relative flex flex-col items-center"
          style={{ padding: "clamp(80px,14vh,96px) 0 clamp(96px,16vh,140px)" }}
        >
          <p className="mb-[22px] text-xs font-semibold tracking-[0.18em] text-[var(--sky-kicker)]">
            HORNUSSEN · EINE DATENGESCHICHTE
          </p>
          <blockquote
            data-reveal="0"
            className="m-0 max-w-[22ch] font-display font-extrabold text-ink"
            style={{
              fontSize: "clamp(34px,9vw,84px)",
              lineHeight: 1.02,
              letterSpacing: "-0.035em",
              textWrap: "balance",
            }}
          >
            «Bei blauem Himmel sieht man den Nouss schlechter.»
          </blockquote>
          <p data-reveal="120" className="mt-[26px] text-[15px] text-[var(--sky-ink-soft)]">
            — verbreitete Hornusser-Weisheit
          </p>
          <p
            data-reveal="240"
            className="mt-[34px] max-w-[44ch] text-[var(--sky-ink)]"
            style={{ fontSize: 19, lineHeight: 1.55 }}
          >
            Stimmt das? Wir sind {formatCH(analysis.totalMatches)} Meisterschaftsspielen und dem
            Wetter darüber nachgegangen.
          </p>
          <div
            data-reveal="420"
            className="mt-[52px] flex flex-col items-center gap-2.5 text-[13px] tracking-[0.14em] text-[var(--sky-ink-soft)]"
          >
            <span>SCROLLEN</span>
            <span
              aria-hidden
              className="anim-bob block h-[46px] w-px"
              style={{
                background:
                  "linear-gradient(180deg,var(--sky-ink-soft),rgba(61,93,117,0))",
              }}
            />
          </div>
        </div>

        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-[60px]"
          style={{
            background: "linear-gradient(180deg,rgba(238,246,230,0) 0%,#eef6e6 100%)",
          }}
        />
      </section>

      {/* meadow seam */}
      <div className="bg-[#eef6e6] pt-3.5" aria-hidden>
        <div className="story-grass anim-grass h-[46px] opacity-55" />
      </div>

      <div className="bg-[var(--bg)]">
        {/* ------------------------------------------------- 1 · worum es geht */}
        <section
          className="mx-auto max-w-[720px] px-5"
          style={{ paddingTop: "clamp(68px,13vw,110px)" }}
        >
          <Kicker>KAPITEL 1 · WORUM ES GEHT</Kicker>
          <ChapterTitle delay={60}>Eine «Nummer» ist ein verpasster Nouss.</ChapterTitle>
          <Body delay={140}>
            Verpasst die abtuende Mannschaft den anfliegenden Nouss und lässt ihn im Feld
            aufkommen, gibt das eine <strong className="text-ink">Nummer</strong>. Der Nouss ist
            klein, schwarz und fliegt bis 350 Meter weit. Wer ihn nicht rechtzeitig sieht, tut ihn
            nicht ab.
          </Body>
          <Body delay={220}>
            Vor wolkenlosem Himmel fehlt der Kontrast — er verschwindet im gleissenden Licht. Vor
            Wolken hebt er sich ab. So lautet die Theorie.
          </Body>
        </section>

        {/* stat tiles */}
        <section
          className="mx-auto max-w-[1000px] px-5"
          style={{ paddingTop: "clamp(56px,11vw,96px)" }}
        >
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,190px),1fr))] gap-3">
            <StatTile
              delay={0}
              count={analysis.totalMatches}
              label="Meisterschaftsspiele"
              sub={`${analysis.seasons.length} Saisons, ${firstSeason}–${lastSeason}`}
            />
            <StatTile
              delay={90}
              count={analysis.observationsWithWeather}
              label="Resultate mit Wetterdaten"
              sub="zwei pro Spiel — je Mannschaft"
              accent="var(--series-1)"
            />
            <StatTile
              delay={180}
              value={String(bs.buckets.length)}
              label="Stufen Bewölkung"
              sub="Okta: 0/8 wolkenlos bis 8/8 bedeckt"
            />
          </div>
        </section>

        {/* --------------------------------------------------- 2 · das ergebnis */}
        <section
          className="mx-auto max-w-[820px] px-5 text-center"
          style={{ paddingTop: "clamp(76px,15vw,120px)" }}
        >
          <Kicker>KAPITEL 2 · DAS ERGEBNIS</Kicker>
          <div
            data-reveal="80"
            className="inline-flex items-center gap-2 rounded-full bg-[rgba(12,163,12,0.12)] px-4 py-[7px] text-sm font-semibold text-[var(--good)]"
          >
            <span aria-hidden className="h-2 w-2 rounded-full bg-[var(--good)]" />
            {bs.verdict.level === "confirmed" ? "Bestätigt" : bs.verdict.headline}
          </div>
          <div
            data-reveal="180"
            data-count={clearPct}
            data-format="pct"
            className="mt-[26px] font-display font-extrabold tabular text-[var(--good)]"
            style={{
              fontSize: "clamp(72px,16vw,180px)",
              lineHeight: 0.9,
              letterSpacing: "-0.05em",
            }}
          >
            {formatPct(clearPct)}
          </div>
          <p
            data-reveal="280"
            className="mx-auto mt-[22px] max-w-[30ch] font-display font-semibold"
            style={{
              fontSize: "clamp(22px,3.2vw,32px)",
              lineHeight: 1.2,
              letterSpacing: "-0.02em",
            }}
          >
            mehr Nummern bei wolkenlosem Himmel als bei bedecktem.
          </p>
          <p
            data-reveal="360"
            className="mx-auto mt-5 max-w-[52ch] text-[17px] leading-[1.6] text-[var(--text-secondary)]"
          >
            {bs.clearMean.toFixed(2)} gegen {bs.overcastMean.toFixed(2)} Nummern pro Team und
            Spiel. Statistisch klar gesichert: p &lt; 0.001 bei n = {formatCH(bs.correlation.n)}.
          </p>
        </section>

        {/* okta chart */}
        <section
          className="mx-auto max-w-[1000px] px-5"
          style={{ paddingTop: "clamp(68px,13vw,110px)" }}
        >
          <figure
            data-reveal="0"
            className="m-0 rounded-[20px] border border-[var(--border)] bg-[var(--surface)]"
            style={{ padding: "clamp(18px,4.5vw,28px) clamp(14px,3.5vw,26px) clamp(16px,4vw,24px)" }}
          >
            <figcaption className="font-display text-xl font-semibold">
              Nummern nach Bewölkung
            </figcaption>
            <p className="mb-[26px] mt-1.5 max-w-[60ch] text-sm text-[var(--text-muted)]">
              Mittlere Nummern pro Team und Spiel je Achtel Bewölkung. Der wolkenlose Himmel sticht
              heraus — alles dazwischen ist beinahe flach.
            </p>

            <div
              data-bars
              className="flex items-end border-b border-[var(--grid)]"
              style={{ gap: "clamp(3px,1.1vw,8px)", height: "clamp(180px,42vw,250px)" }}
            >
              {bars.map((b, i) => (
                <div
                  key={b.label}
                  className="flex h-full flex-1 flex-col items-center justify-end gap-2"
                >
                  <span
                    className="font-semibold tabular text-[var(--text-secondary)]"
                    style={{ fontSize: "clamp(9px,2.4vw,13px)", letterSpacing: "-0.02em" }}
                  >
                    {b.mean.toFixed(2)}
                  </span>
                  <div
                    className="okta-bar w-full rounded-t-lg"
                    style={
                      {
                        "--bar-h": `${b.heightPct}%`,
                        background: i === 0 ? "var(--series-1)" : "var(--series-muted)",
                      } as React.CSSProperties
                    }
                  />
                </div>
              ))}
            </div>
            <div className="mt-2.5 flex" style={{ gap: "clamp(3px,1.1vw,8px)" }}>
              {bars.map((b) => (
                <span
                  key={b.label}
                  className="flex-1 text-center text-[var(--text-muted)]"
                  style={{ fontSize: "clamp(9px,2.3vw,12px)" }}
                >
                  {b.label}
                </span>
              ))}
            </div>
            <p className="mt-5 text-[13px] text-[var(--text-muted)]">
              links wolkenlos · rechts bedeckt · Achse gekürzt, damit der Schwelleneffekt sichtbar
              wird
            </p>
          </figure>
        </section>

        {/* ------------------------------------------------------ 3 · der haken */}
        <section
          className="mx-auto max-w-[720px] px-5"
          style={{ paddingTop: "clamp(68px,13vw,110px)" }}
        >
          <Kicker>KAPITEL 3 · DER HAKEN</Kicker>
          <ChapterTitle delay={60} small>
            Es ist keine Skala — es ist eine Schwelle.
          </ChapterTitle>
          <Body delay={140}>
            «Etwas mehr Wolken, etwas weniger Nummern» stimmt nicht. Zwischen 1/8 und 8/8
            Bewölkung liegen alle Werte in einem engen Band um 1.1 bis 1.2. Der ganze Effekt
            entsteht am Rand: beim komplett wolkenlosen Himmel.
          </Body>

          <div data-reveal="220" className="mt-[30px] grid gap-3">
            {bs.categories.buckets.map((c, i) => (
              <div
                key={c.label}
                className={
                  "flex items-baseline justify-between gap-4 rounded-2xl px-[18px] py-4 " +
                  (i === 0
                    ? "border border-[rgba(28,107,220,0.16)] bg-[#e8f2ff]"
                    : "border border-[var(--border)] bg-[var(--surface)]")
                }
              >
                <span className="text-base font-semibold">{prettyCategory(c.label)}</span>
                <span
                  className="font-display text-[26px] font-extrabold tabular"
                  style={{ color: i === 0 ? "var(--series-1)" : "var(--text-secondary)" }}
                >
                  {c.mean.toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <p
            data-reveal="300"
            className="mt-[18px] text-sm leading-[1.6] text-[var(--text-muted)]"
          >
            Alle drei Vergleiche sind signifikant (ANOVA F = {bs.categories.anovaF.toFixed(1)}, p
            &lt; 0.001), aber die Lücke zwischen heiter und bewölkt ist mit +
            {Math.round(heiterVsBewoelkt?.pctDiff ?? 0)} % dreimal so gross wie die zwischen
            bewölkt und bedeckt.
          </p>
        </section>

        {/* ------------------------------------------- 4 · was wir nicht wissen */}
        <section
          className="mx-auto max-w-[720px] px-5"
          style={{ paddingTop: "clamp(68px,13vw,110px)" }}
        >
          <Kicker>KAPITEL 4 · WAS WIR NICHT WISSEN</Kicker>
          <ChapterTitle delay={60} small>
            Blauer Himmel kommt nie allein.
          </ChapterTitle>
          <Body delay={140}>
            Wolkenlose Tage sind auch heisser, trockener und windstiller — und liegen oft mitten im
            Sommer, wo andere Mannschaften spielen. Der Zusammenhang ist gemessen, die Ursache
            nicht bewiesen. Ausserdem stammt das Wetter aus Stundenwerten der nächstgelegenen
            Station, nicht vom Platzrand.
          </Body>
          <Body delay={220}>
            Trotzdem: die Richtung passt genau zu dem, was Hornusser seit Jahrzehnten sagen.
          </Body>
        </section>

        {/* ------------------------------------------------------------ schluss */}
        <section
          className="mx-auto max-w-[820px] px-5 text-center"
          style={{
            paddingTop: "clamp(68px,13vw,110px)",
            paddingBottom: "clamp(88px,16vw,130px)",
          }}
        >
          <blockquote
            data-reveal="0"
            className="m-0 font-display font-extrabold"
            style={{
              fontSize: "clamp(30px,5vw,58px)",
              lineHeight: 1.06,
              letterSpacing: "-0.035em",
              textWrap: "balance",
            }}
          >
            Die Weisheit hält stand — aber nur, wenn keine einzige Wolke am Himmel steht.
          </blockquote>
          <p data-reveal="120" className="mt-7 text-[15px] text-[var(--text-muted)]">
            Datenbasis: Meisterschaftsresultate {firstSeason}–{lastSeason}, Wetter stündlich pro
            Spielort. Ein Hobbyprojekt, keine offizielle EHV-Statistik.
          </p>
        </section>
      </div>
    </main>
  );
}

/* -------------------------------------------------------------- fragments */

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <p
      data-reveal="0"
      className="mb-3.5 text-xs font-semibold tracking-[0.14em] text-[var(--meadow-deep)]"
    >
      {children}
    </p>
  );
}

function ChapterTitle({
  children,
  delay,
  small,
}: {
  children: React.ReactNode;
  delay: number;
  small?: boolean;
}) {
  return (
    <h2
      data-reveal={delay}
      className="m-0 font-display font-extrabold"
      style={{
        fontSize: small ? "clamp(28px,4.4vw,46px)" : "clamp(30px,4.6vw,50px)",
        lineHeight: small ? 1.07 : 1.05,
        letterSpacing: "-0.03em",
      }}
    >
      {children}
    </h2>
  );
}

function Body({ children, delay }: { children: React.ReactNode; delay: number }) {
  return (
    <p
      data-reveal={delay}
      className="text-[var(--text-secondary)] [&:first-of-type]:mt-[22px] [&:not(:first-of-type)]:mt-[18px]"
      style={{ fontSize: "clamp(17px,4.3vw,19px)", lineHeight: 1.6 }}
    >
      {children}
    </p>
  );
}

function StatTile({
  delay,
  count,
  value,
  label,
  sub,
  accent,
}: {
  delay: number;
  count?: number;
  value?: string;
  label: string;
  sub: string;
  accent?: string;
}) {
  return (
    <div
      data-reveal={delay}
      className="rounded-[18px] border border-[var(--border)] bg-[var(--surface)] px-5 py-[22px]"
    >
      <div
        {...(count != null ? { "data-count": count, "data-format": "ch" } : {})}
        className="font-display font-extrabold tabular leading-none"
        style={{
          fontSize: "clamp(32px,8vw,38px)",
          letterSpacing: "-0.02em",
          color: accent,
        }}
      >
        {count != null ? formatCH(count) : value}
      </div>
      <div className="mt-2 text-sm font-semibold">{label}</div>
      <div className="mt-[3px] text-[13px] text-[var(--text-muted)]">{sub}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ helpers */

interface BarDatum extends Bucket {
  heightPct: number;
}

/**
 * Maps bucket means onto bar heights. The domain is padded rather than starting
 * at zero — otherwise the 0/8 spike, which is the whole story, is a barely
 * visible bump above eight near-identical bars. Flagged under the chart.
 */
function withBarHeights(buckets: Bucket[]): BarDatum[] {
  const means = buckets.map((b) => b.mean);
  const lo = Math.min(...means);
  const hi = Math.max(...means);
  const span = hi - lo || 1;
  const domainLo = lo - span * 0.15;
  const domainHi = hi + span * 0.12;
  return buckets.map((b) => ({
    ...b,
    heightPct: Math.round(((b.mean - domainLo) / (domainHi - domainLo)) * 100),
  }));
}

/** "Heiter (0–2/8)" → "Heiter · 0–2/8" */
function prettyCategory(label: string): string {
  return label.replace(/\s*\(([^)]+)\)\s*$/, " · $1");
}
