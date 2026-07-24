"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Nouss } from "./Nouss";
import { ThemeToggle } from "./ThemeToggle";

const links = [
  { href: "/", label: "Übersicht" },
  { href: "/wetter", label: "Blauer Himmel" },
  { href: "/wind", label: "Wind" },
  { href: "/plaetze", label: "Spielplätze" },
  { href: "/daten", label: "Methodik" },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--bg)]/85 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2.5">
          <Nouss size={30} className="animate-float" />
          <span className="font-display text-lg font-bold leading-none tracking-tight">
            Nouss &amp; Wetter
          </span>
        </Link>
        <div className="flex items-center gap-1 sm:gap-2">
          <ul className="hidden items-center gap-0.5 sm:flex">
            {links.map((l) => {
              const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    aria-current={active ? "page" : undefined}
                    className={
                      "rounded-full px-3 py-1.5 text-sm transition " +
                      (active
                        ? "bg-meadow-100 font-semibold text-ink dark:bg-meadow-800/50 dark:text-meadow-50"
                        : "text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]")
                    }
                  >
                    {l.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
