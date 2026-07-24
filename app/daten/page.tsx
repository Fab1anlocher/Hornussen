import { getAnalysis } from "@/lib/data";
import { SectionHeading } from "@/components/ui";

export const metadata = { title: "Methodik & Grenzen — Hornussen-Wetteranalyse" };

export default function DatenPage() {
  const a = getAnalysis();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <SectionHeading kicker="Transparenz" title="Methodik & Grenzen der Analyse">
        Damit die Zahlen ehrlich bleiben: So entstehen sie — und was sie nicht können.
      </SectionHeading>

      <Block title="Woher die Daten stammen">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Spielresultate:</strong> das öffentliche{" "}
            <a href="https://www.ehv.ch/listen/resultate_meisterschaft_archiv.php" className="underline" target="_blank" rel="noreferrer">
              Meisterschaftsarchiv des EHV
            </a>{" "}
            — pro Runde ein PDF, aus dem Teams, Rundenpunkte, Nummern und Schlagpunkte
            ausgelesen werden.
          </li>
          <li>
            <strong>Spielplätze:</strong> das Platz-Verzeichnis der hgverwaltung/EHV (Name,
            Ort, Koordinaten).
          </li>
          <li>
            <strong>Wetter:</strong> die{" "}
            <a href="https://open-meteo.com/en/docs/historical-weather-api" className="underline" target="_blank" rel="noreferrer">
              Historical-Weather-API von Open-Meteo
            </a>{" "}
            (ERA5-Reanalyse, stundengenau) — Bewölkung, Windgeschwindigkeit und -richtung je
            Platz und Spieltag.
          </li>
        </ul>
      </Block>

      <Block title="Wie eine Nummer und Schlagpunkte gezählt werden">
        <p>
          Jedes Spiel liefert <strong>zwei Beobachtungen</strong> — eine pro Mannschaft. Beide
          spielten am selben Ort unter demselben Himmel und schlugen in dieselbe Richtung, also
          zählen beide Resultate für den betreffenden Platz und Tag. «Nummern» sind die Fehler
          der abtuenden Mannschaft, «Schlagpunkte» die erzielte Weite/Zahl.
        </p>
      </Block>

      <Block title="Grenzen — bitte mitdenken" tone="warn">
        <ul className="list-disc space-y-3 pl-5">
          <li>
            <strong>Keine exakten Anspielzeiten.</strong> Die PDFs nennen nur das Rundendatum,
            nicht die Startzeit. Wir nehmen ein Spielfenster von{" "}
            <strong>ca. 12–17 Uhr</strong> an und mitteln das Wetter darüber. Wurde früher oder
            später gespielt, passt das Wetterfenster nicht exakt.
          </li>
          <li>
            <strong>Der Wind dreht.</strong> Über den Nachmittag ändert sich die Richtung. Wir
            mitteln den Wind deshalb <em>vektoriell</em> (nicht über den Gradwert), sodass die
            mittlere Rückenwind-Komponente auch bei drehendem Wind stimmt. Eine
            «Windbeständigkeit» misst, wie stabil die Richtung war.
          </li>
          <li>
            <strong>Reanalyse statt Platzmessung.</strong> Open-Meteo/ERA5 hat ~9–25 km
            Auflösung. Das ist das <em>regionale</em> Wetter, nicht das Mikroklima genau auf dem
            Ries — lokale Böen oder Thermik werden nicht aufgelöst.
          </li>
          <li>
            <strong>Heimplatz-Annahme.</strong> Als Spielort nehmen wir den Platz der
            <em> erstgenannten</em> Mannschaft an. Bei abweichender Spielstätte kann die
            Zuordnung im Einzelfall daneben liegen.
          </li>
          <li>
            <strong>Spielrichtungen sind unvollständig.</strong> Die Wind-Analyse deckt nur
            Plätze mit manuell erfasster Schlagrichtung ab. Mehr Plätze = aussagekräftiger.
          </li>
          <li>
            <strong>Korrelation ≠ Kausalität.</strong> Selbst ein klarer Zusammenhang beweist
            keine Ursache — Wetterlagen hängen mit Jahreszeit, Platz und Spielstärke zusammen.
          </li>
          <li>
            <strong>Lückenhafte Jahre.</strong> 2020 (keine Meisterschaft) fehlt; 2021 lag in
            einem abweichenden Format vor und ist nur teilweise erfasst.
          </li>
        </ul>
      </Block>

      <Block title="Rechenweg">
        <p>
          Wir berechnen Pearson- und Spearman-Korrelation, eine lineare Regression sowie ein
          Bootstrap-Konfidenzintervall. Der p-Wert ist eine Näherung. Als «bestätigt» gilt eine
          These nur, wenn Richtung <em>und</em> Signifikanz (p &lt; 0.05) stimmen. Alles ist als
          reproduzierbare Pipeline (öffentliche Quellen → JSON) umgesetzt.
        </p>
      </Block>

      {a && (
        <p className="mt-8 text-sm text-[var(--text-muted)]">
          Datenstand: {new Date(a.generatedAt).toLocaleString("de-CH")} · {a.totalMatches.toLocaleString("de-CH")}{" "}
          Spiele · {a.observationsWithWeather.toLocaleString("de-CH")} Beobachtungen mit Wetter ·
          Saisons {a.seasons[0]}–{a.seasons[a.seasons.length - 1]}.
        </p>
      )}
    </div>
  );
}

function Block({
  title,
  children,
  tone,
}: {
  title: string;
  children: React.ReactNode;
  tone?: "warn";
}) {
  return (
    <section
      className={`card mt-6 p-6 ${tone === "warn" ? "border-l-4" : ""}`}
      style={tone === "warn" ? { borderLeftColor: "var(--warning)" } : undefined}
    >
      <h3 className="mb-3 font-display text-xl font-semibold">{title}</h3>
      <div className="space-y-2 text-[var(--text-secondary)]">{children}</div>
    </section>
  );
}
