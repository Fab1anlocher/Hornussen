import { getVenues } from "@/lib/data";
import { VenueMap, type MapVenue } from "@/components/VenueMap";
import { SectionHeading } from "@/components/ui";
import { cardinal } from "@/lib/wind";

export const metadata = { title: "Spielplätze — Hornussen-Wetteranalyse" };

export default function PlaetzePage() {
  const venues = getVenues();
  const mapVenues: MapVenue[] = venues.map((v) => ({
    id: v.id,
    name: v.name,
    ort: v.ort,
    lat: v.lat,
    lng: v.lng,
    teams: v.teams.length,
    directionDeg: v.playingDirectionDeg,
  }));
  const withDir = venues
    .filter((v) => v.playingDirectionDeg != null)
    .sort((a, b) => a.name.localeCompare(b.name, "de"));

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <SectionHeading kicker="Spielstätten" title="Wo gespielt wird — und in welche Richtung">
        {venues.length} Hornusserplätze aus dem EHV-Verzeichnis. Der blaue Pfeil zeigt die
        erfasste Schlagrichtung; grüne Punkte sind Plätze ohne (noch) erfasste Richtung.
      </SectionHeading>

      <VenueMap venues={mapVenues} />

      <div className="mt-6 flex flex-wrap gap-4 text-sm text-[var(--text-secondary)]">
        <Legend swatch={<span className="inline-block h-3 w-3 rounded-full" style={{ background: "#45762a", border: "2px solid #fff" }} />}>
          Platz ohne Spielrichtung
        </Legend>
        <Legend
          swatch={
            <svg viewBox="0 0 26 26" width="18" height="18">
              <circle cx="13" cy="13" r="6" fill="#d1953c" stroke="#7f4b1c" strokeWidth="1.5" />
              <path d="M13 1 L16 7 L10 7 Z" fill="#2a78d6" />
            </svg>
          }
        >
          Spielrichtung erfasst (Pfeil = Schlagrichtung)
        </Legend>
      </div>

      <h3 className="mt-10 font-display text-xl font-semibold">
        Erfasste Spielrichtungen ({withDir.length})
      </h3>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[420px] text-left text-sm">
          <thead className="text-[var(--text-muted)]">
            <tr className="border-b border-[var(--border)]">
              <th className="py-2 pr-4 font-medium">Platz</th>
              <th className="py-2 pr-4 font-medium">Ort</th>
              <th className="py-2 pr-4 font-medium">Mannschaften</th>
              <th className="py-2 pr-4 font-medium">Schlagrichtung</th>
            </tr>
          </thead>
          <tbody className="tabular">
            {withDir.map((v) => (
              <tr key={v.id} className="border-b border-[var(--border)]">
                <td className="py-2 pr-4 font-medium">{v.name}</td>
                <td className="py-2 pr-4 text-[var(--text-secondary)]">{v.ort ?? "—"}</td>
                <td className="py-2 pr-4 text-[var(--text-secondary)]">{v.teams.length}</td>
                <td className="py-2 pr-4">
                  {Math.round(v.playingDirectionDeg!)}° {cardinal(v.playingDirectionDeg!)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 max-w-2xl text-sm text-[var(--text-muted)]">
        Spielrichtungen werden manuell in{" "}
        <code className="rounded bg-[var(--surface-2)] px-1.5 py-0.5">config/playing-directions.json</code>{" "}
        gepflegt und beim nächsten Pipeline-Lauf übernommen. Platz-Koordinaten stammen aus dem
        EHV-/hgverwaltung-Verzeichnis.
      </p>
    </div>
  );
}

function Legend({ swatch, children }: { swatch: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2">
      {swatch}
      {children}
    </span>
  );
}
