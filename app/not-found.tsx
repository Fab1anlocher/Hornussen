import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-xl flex-col items-center px-5 py-24 text-center">
      <h1 className="font-display text-3xl font-bold">Der Nouss ist im Feld gelandet</h1>
      <p className="mt-3 text-[var(--text-secondary)]">
        Diese Seite gibt es nicht (oder nicht mehr). Zurück zur Geschichte:
      </p>
      <Link
        href="/"
        className="mt-6 rounded-full bg-meadow-600 px-5 py-2.5 font-semibold text-white transition hover:bg-meadow-700"
      >
        Zum Anfang
      </Link>
    </main>
  );
}
