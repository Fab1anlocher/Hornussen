import { getAnalysis } from "@/lib/data";
import { formatCH, formatPct } from "@/lib/format";
import { StoryMotion } from "@/components/story/StoryMotion";
import { DistributionGrid } from "@/components/story/DistributionGrid";
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
  const ext = bs.extremes; // 0/8 vs 8/8, the test behind the headline number
  const ctx = bs.context;
  const clustered = bs.extremesClustered;
  const dist = bs.distribution;
  const colTotals = dist.counts.map((row) => row.reduce((a, b) => a + b, 0));
  const zeroClear = {
    clear: colTotals[0] === 0 ? 0 : dist.counts[0][0] / colTotals[0],
    overcast: colTotals[8] === 0 ? 0 : dist.counts[8][0] / colTotals[8],
  };
  const clearPct = Math.round(ext.pctDiff);
  const { bars, baseline } = withBarHeights(bs.buckets);
  const band = cloudyBand(bs.buckets);
  const [heiter, bewoelkt, bedeckt] = bs.categories.buckets;
  const heiterVsBewoelkt = bs.categories.pairwise.find(
    (p) => p.a === heiter?.label && p.b === bewoelkt?.label,
  );
  const bewoelktVsBedeckt = bs.categories.pairwise.find(
    (p) => p.a === bewoelkt?.label && p.b === bedeckt?.label,
  );
  const firstSeason = analysis.seasons[0];
  const lastSeason = analysis.seasons[analysis.seasons.length - 1];
  const missingSeasons = seasonGaps(analysis.seasons);

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
            – verbreitete Hornusser-Weisheit
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
            Vor wolkenlosem Himmel fehlt der Kontrast, er verschwindet im gleissenden Licht. Vor
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
              sub={`je Mannschaft eines, von ${formatCH(analysis.totalObservations)} insgesamt`}
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
            Spiel, aus {formatCH(ext.nA)} wolkenlosen und {formatCH(ext.nB)} bedeckten
            Team-Resultaten. Diese Resultate verteilen sich allerdings auf nur{" "}
            {bs.playingDays} Spieltage, und wer am selben Tag spielt, spielt unter praktisch
            demselben Himmel. Rechnet man den Spieltag als Einheit, bleibt der Unterschied
            gesichert: t = {clustered.t.toFixed(1)}, {formatP(clustered.p)} über{" "}
            {clustered.clusters} Spieltage.
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
              heraus; die übrigen acht Stufen bleiben eng beieinander und ordnen sich in keine
              Reihenfolge.
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
            {/* the axis as sky: each column carries the colour of its own cloud cover */}
            <div
              data-bars
              className="mt-2.5 flex items-center"
              style={{ gap: "clamp(3px,1.1vw,8px)" }}
            >
              {bars.map((b, i) => (
                <span key={b.label} className="flex flex-1 flex-col items-center gap-1.5">
                  <span
                    aria-hidden
                    className="sky-swatch block w-full rounded-full"
                    style={{
                      background: skyColor(i, bars.length - 1),
                      height: "clamp(7px,1.8vw,10px)",
                      transitionDelay: `${i * 70}ms`,
                    }}
                  />
                  <span
                    className="text-center text-[var(--text-muted)]"
                    style={{ fontSize: "clamp(9px,2.3vw,12px)" }}
                  >
                    {b.label}
                  </span>
                </span>
              ))}
            </div>
            <p className="mt-5 text-[13px] text-[var(--text-muted)]">
              links wolkenlos · rechts bedeckt · die Achse beginnt bei {baseline.toFixed(2)} statt
              bei null, damit der Sprung sichtbar wird. Die Balken sind dadurch stärker
              gestaffelt, als die Zahlen es sind
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
            Es ist keine Skala, sondern eine Schwelle.
          </ChapterTitle>
          <Body delay={140}>
            «Etwas mehr Wolken, etwas weniger Nummern» stimmt nicht. Sobald auch nur ein Achtel
            Himmel bedeckt ist, liegen alle Stufen zwischen {band.lo.toFixed(2)} und{" "}
            {band.hi.toFixed(2)}, ohne erkennbare Richtung. Der ganze Effekt entsteht am Rand:
            beim komplett wolkenlosen Himmel.
          </Body>
          <Body delay={180}>
            Eine Stufe schert aus: bei {band.hiLabel} liegt der Schnitt bei {band.hi.toFixed(2)}.
            Das ist mehr, als Zufall bequem erklärt, passt aber in keine Richtung. Wir führen ihn
            als offenen Ausreisser, nicht als Gegenbeweis.
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
            Die drei Gruppen unterscheiden sich gesichert (ANOVA F ={" "}
            {bs.categories.anovaF.toFixed(1)}, {formatP(bs.categories.anovaP)}); auch jedes
            einzelne Paar ist signifikant, bewölkt gegen bedeckt allerdings nur knapp (
            {formatP(bewoelktVsBedeckt?.p ?? NaN)}). Entscheidend sind die Abstände: heiter liegt
            +{Math.round(heiterVsBewoelkt?.pctDiff ?? 0)} % über bewölkt, bewölkt nur +
            {Math.round(bewoelktVsBedeckt?.pctDiff ?? 0)} % über bedeckt.
          </p>
        </section>

        {/* ---------------------------------------------- 4 · die ganze masse */}
        <section
          className="mx-auto max-w-[720px] px-5"
          style={{ paddingTop: "clamp(68px,13vw,110px)" }}
        >
          <Kicker>KAPITEL 4 · DIE GANZE MASSE</Kicker>
          <ChapterTitle delay={60} small>
            Ein dünner Strich durch eine breite Wolke.
          </ChapterTitle>
          <Body delay={140}>
            Bisher haben wir Mittelwerte verglichen. Hier ist alles auf einmal: jedes der{" "}
            {formatCH(bs.correlation.n)} Team-Resultate sitzt in einem Punkt dieses Rasters: links
            der wolkenlose Himmel, rechts der bedeckte, nach oben die Zahl der Nummern. Je grösser
            der Punkt, desto mehr Spiele endeten so.
          </Body>
        </section>

        <section
          className="mx-auto max-w-[1000px] px-5"
          style={{ paddingTop: "clamp(30px,6vw,44px)" }}
        >
          <figure
            data-reveal="0"
            className="m-0 rounded-[20px] border border-[var(--border)] bg-[var(--surface)]"
            style={{ padding: "clamp(18px,4.5vw,28px) clamp(14px,3.5vw,26px) clamp(16px,4vw,24px)" }}
          >
            <figcaption className="font-display text-xl font-semibold">
              Alle Resultate, nach Bewölkung
            </figcaption>
            <p className="mb-5 mt-1.5 max-w-[60ch] text-sm text-[var(--text-muted)]">
              Punktfläche = Anteil innerhalb einer Spalte, damit sich die neun Stufen vergleichen
              lassen. Die braune Gerade ist die lineare Regression über alle Beobachtungen.
            </p>
            <div data-dots>
              <DistributionGrid distribution={dist} correlation={bs.correlation} />
            </div>
            <p className="mt-4 text-[13px] text-[var(--text-muted)]">
              Spalten sind unterschiedlich stark besetzt: {formatCH(Math.max(...colTotals))}{" "}
              Resultate bei bedecktem, nur {formatCH(colTotals[0])} bei wolkenlosem Himmel. Die
              oberste Reihe fasst alles ab {dist.cap} Nummern zusammen, der längste Schwanz reicht
              bis {dist.maxNummern}.
            </p>
          </figure>
        </section>

        <section
          className="mx-auto max-w-[720px] px-5"
          style={{ paddingTop: "clamp(44px,8vw,64px)" }}
        >
          <Body delay={0}>
            Zwei Dinge fallen auf. Erstens: {Math.round(dist.zeroShare * 100)} % aller Resultate
            enden ohne eine einzige Nummer, das ist der dicke Punkt ganz unten. Bei bedecktem
            Himmel sind es {Math.round(zeroClear.overcast * 100)} %, bei wolkenlosem nur{" "}
            {Math.round(zeroClear.clear * 100)} %. Der blaue Himmel nimmt der Mannschaft die
            fehlerfreie Runde weg und macht dafür den oberen Rand dicker.
          </Body>
          <Body delay={80}>
            Zweitens: die Gerade fällt über die ganze Skala um nur{" "}
            {Math.abs(bs.correlation.slope * 100).toFixed(2)} Nummern, von{" "}
            {bs.correlation.intercept.toFixed(2)} bei blankem Himmel auf{" "}
            {(bs.correlation.intercept + bs.correlation.slope * 100).toFixed(2)} bei geschlossener
            Decke. Neben einer Streuung, die von 0 bis {dist.maxNummern} reicht, ist das fast
            nichts. Genau deshalb ist die Korrelation mit r ={" "}
            {bs.correlation.pearson.toFixed(2)} so klein, obwohl der Unterschied echt ist: Das
            Wetter verschiebt die Verteilung, es bestimmt sie nicht.
          </Body>
          <Body delay={160}>
            Ein Modell, das aus der Bewölkung die Nummern eines einzelnen Spiels vorhersagt, gibt es
            hier also nicht, und wird es nicht geben. Was es gibt, ist ein Effekt, der erst über
            Tausende von Spielen aus dem Rauschen auftaucht.
          </Body>
        </section>

        {/* ------------------------------------------- 5 · was wir nicht wissen */}
        <section
          className="mx-auto max-w-[720px] px-5"
          style={{ paddingTop: "clamp(68px,13vw,110px)" }}
        >
          <Kicker>KAPITEL 5 · WAS WIR NICHT WISSEN</Kicker>
          <ChapterTitle delay={60} small>
            Blauer Himmel kommt nie allein.
          </ChapterTitle>
          <Body delay={140}>
            Ein wolkenloser Tag ist nicht nur wolkenlos. Er ist im Schnitt{" "}
            {Math.round(ctx.temperatureClear - ctx.temperatureOvercast)} Grad wärmer (
            {ctx.temperatureClear.toFixed(1)} statt {ctx.temperatureOvercast.toFixed(1)} °C) und
            liegt viel häufiger im Hochsommer: {Math.round(ctx.midsummerShareClear * 100)} % der
            wolkenlosen Resultate fallen in Juni oder Juli, bei bedecktem Himmel nur{" "}
            {Math.round(ctx.midsummerShareOvercast * 100)} %. Die Hitze wäre also die naheliegende
            Gegenerklärung.
          </Body>
          <Body delay={170}>
            Sie trägt aber nicht. Teilt man die Spiele in Temperaturbänder und vergleicht innerhalb
            jedes Bandes noch einmal wolkenlos gegen bedeckt, bleibt der Abstand überall bestehen:
            {" "}
            {bs.temperatureStrata
              .map((t) => `${t.label} +${t.diff.toFixed(2)}`)
              .join(", ")}
            . Bei gleicher Temperatur macht der blanke Himmel also weiterhin den Unterschied.
          </Body>
          <Body delay={200}>
            Eine Erklärung können wir ausschliessen: dass bei schönem Wetter einfach andere
            Mannschaften antreten. Der Anteil der obersten Ligen ist in beiden Gruppen praktisch
            gleich ({Math.round(ctx.topLeagueShareClear * 100)} % gegen{" "}
            {Math.round(ctx.topLeagueShareOvercast * 100)} % NLA/NLB). Und ruhiger ist es bei
            blauem Himmel auch nicht: der Wind liegt mit {ctx.windSpeedClear.toFixed(1)} km/h
            sogar leicht über den {ctx.windSpeedOvercast.toFixed(1)} km/h bei bedecktem Himmel.
          </Body>
          <Body delay={260}>
            Dazu kommt, woher das Wetter stammt: aus der ERA5-Reanalyse (Open-Meteo), einem
            Rechenmodell mit rund 9 bis 25 Kilometern Auflösung. Gemessen wird damit das regionale
            Wetter, nicht die Luft über dem Ries. Und weil die Ranglisten keine Anspielzeiten nennen, nehmen wir für
            jedes Spiel den Wert um <strong className="text-ink">13 Uhr</strong> Ortszeit. Wer
            früher oder später spielte, spielte unter einem anderen Himmel als dem hier gemessenen.
          </Body>
          <Body delay={290}>
            Nicht ausgetragene Runden stehen im Archiv als 0:0. Solche Einträge lassen wir weg,
            sonst wanderte jedes verregnete Wochenende als fehlerfreies Spiel in die Statistik.
            Darum rechnen wir mit {formatCH(analysis.totalMatches)} Spielen und nicht mit den{" "}
            {formatCH(analysis.totalMatches + analysis.matchesNotPlayed)} Einträgen, die im Archiv stehen.
          </Body>
          <Body delay={310}>
            Die grösste Einschränkung ist eine andere. Der Vergleich lebt davon, dass sich klare
            und bedeckte <em>Spieltage</em> unterscheiden, nicht einzelne Plätze:{" "}
            {Math.round(bs.betweenDayShare * 100)} % der Unterschiede in der Bewölkung liegen
            zwischen den Tagen, nur der kleine Rest zwischen den Plätzen eines Tages. Vergleicht
            man nur Plätze innerhalb desselben Spieltags, ist vom Effekt nichts mehr messbar. Ob
            das gegen die Weisheit spricht oder nur daran liegt, dass ein 9-Kilometer-Raster
            benachbarte Plätze gar nicht auseinanderhalten kann, lässt sich mit diesen Daten nicht
            entscheiden.
          </Body>
          <Body delay={320}>
            Der Zusammenhang ist also gemessen, die Ursache nicht bewiesen. Trotzdem: die Richtung
            passt genau zu dem, was Hornusser seit Jahrzehnten sagen.
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
            Die Weisheit hält stand, aber nur, wenn keine einzige Wolke am Himmel steht.
          </blockquote>
          <p data-reveal="120" className="mt-7 text-[15px] text-[var(--text-muted)]">
            Datenbasis: {analysis.seasons.length} Meisterschaftssaisons {firstSeason}–{lastSeason}{" "}
            aus dem EHV-Archiv{missingSeasons.length > 0 && ` (ohne ${missingSeasons.join(" und ")})`}
            , dazu das Wetter um 13 Uhr über jedem Spielort aus der ERA5-Reanalyse von Open-Meteo.
            Ein Hobbyprojekt, keine offizielle EHV-Statistik.
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
 * at zero, otherwise the 0/8 spike, which is the whole story, is a barely
 * visible bump above eight near-identical bars. That exaggerates the ratio
 * between bars, so `baseline` is printed under the chart: a truncated axis is
 * only fair if the reader can see where it was cut.
 */
function withBarHeights(buckets: Bucket[]): { bars: BarDatum[]; baseline: number } {
  const means = buckets.map((b) => b.mean);
  const lo = Math.min(...means);
  const hi = Math.max(...means);
  const span = hi - lo || 1;
  const domainLo = lo - span * 0.15;
  const domainHi = hi + span * 0.12;
  return {
    bars: buckets.map((b) => ({
      ...b,
      heightPct: Math.round(((b.mean - domainLo) / (domainHi - domainLo)) * 100),
    })),
    baseline: domainLo,
  };
}

/** "Heiter (0–2/8)" → "Heiter · 0–2/8" */
function prettyCategory(label: string): string {
  return label.replace(/\s*\(([^)]+)\)\s*$/, " · $1");
}

/**
 * Range of the buckets once any cloud is present (1/8 … 8/8). Chapter 3 claims
 * this range is flat, so it reads the actual span rather than quoting fixed
 * numbers that a later pipeline run could quietly falsify.
 */
function cloudyBand(buckets: Bucket[]): { lo: number; hi: number; hiLabel: string } {
  const rest = buckets.slice(1).filter((b) => b.count > 0);
  const hi = rest.reduce((a, b) => (b.mean > a.mean ? b : a), rest[0]);
  const lo = rest.reduce((a, b) => (b.mean < a.mean ? b : a), rest[0]);
  return { lo: lo.mean, hi: hi.mean, hiLabel: hi.label };
}

/** Seasons absent from an otherwise continuous run, e.g. [2020, 2021]. */
function seasonGaps(seasons: number[]): number[] {
  const gaps: number[] = [];
  for (let y = seasons[0]; y < seasons[seasons.length - 1]; y++) {
    if (!seasons.includes(y)) gaps.push(y);
  }
  return gaps;
}

/**
 * Colour of the sky at a given okta, blending a cloudless blue into overcast
 * grey. Turns the chart's x-axis into the thing it measures, so the reader sees
 * the scale before reading a single label.
 */
function skyColor(step: number, steps: number): string {
  const clear = [90, 180, 240];
  const overcast = [169, 180, 187];
  const t = steps === 0 ? 0 : step / steps;
  const [r, g, b] = clear.map((c, i) => Math.round(c + (overcast[i] - c) * t));
  return `rgb(${r}, ${g}, ${b})`;
}

/** p-values as read aloud: "p < 0.001" below the floor, otherwise "p = 0.010". */
function formatP(p: number): string {
  if (!Number.isFinite(p)) return "p unbekannt";
  return p < 0.001 ? "p < 0.001" : `p = ${p.toFixed(3)}`;
}
