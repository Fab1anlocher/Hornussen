import Link from "next/link";
import { Nouss } from "@/components/Nouss";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <Nouss size={56} className="animate-float" />
      <h1 className="mt-6 font-display text-3xl font-bold">Der Nouss ist im Feld gelandet</h1>
      <p className="mt-3 text-[var(--text-secondary)]">
        Diese Seite gibt es nicht (oder nicht mehr). Zurück ins Spiel:
      </p>
      <Link
        href="/"
        className="mt-6 rounded-full bg-meadow-600 px-5 py-2.5 font-semibold text-white transition hover:bg-meadow-700"
      >
        Zur Startseite
      </Link>
    </div>
  );
}
