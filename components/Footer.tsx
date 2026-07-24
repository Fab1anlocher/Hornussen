import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--surface)]">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-[var(--text-muted)]">
        <div className="flex flex-col justify-between gap-4 sm:flex-row">
          <p className="max-w-md">
            Ein datenbasiertes Hobbyprojekt für die Schweizer Hornusser-Gemeinschaft. Keine
            offizielle Statistik des EHV.
          </p>
          <div className="flex flex-col gap-1 sm:text-right">
            <span>Daten: EHV-Meisterschaftsarchiv &amp; Open-Meteo</span>
            <Link href="/daten" className="underline hover:text-[var(--text-secondary)]">
              Methodik &amp; Grenzen der Analyse
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
