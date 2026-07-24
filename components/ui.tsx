import type { Verdict, VerdictLevel } from "@/lib/types";

const VERDICT_META: Record<
  VerdictLevel,
  { color: string; label: string; icon: string }
> = {
  confirmed: { color: "var(--good)", label: "Bestätigt", icon: "✓" },
  weak: { color: "var(--warning)", label: "Schwacher Hinweis", icon: "≈" },
  none: { color: "var(--text-muted)", label: "Kein Effekt", icon: "–" },
  contradicted: { color: "var(--critical)", label: "Widerlegt", icon: "✗" },
  insufficient: { color: "var(--text-muted)", label: "Zu wenig Daten", icon: "?" },
};

export function VerdictBadge({ level }: { level: VerdictLevel }) {
  const m = VERDICT_META[level];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold"
      style={{ color: m.color, backgroundColor: `color-mix(in srgb, ${m.color} 14%, transparent)` }}
    >
      <span aria-hidden className="grid h-4 w-4 place-items-center rounded-full text-[11px]" style={{ backgroundColor: m.color, color: "#fff" }}>
        {m.icon}
      </span>
      {m.label}
    </span>
  );
}

export function VerdictCard({ verdict, title }: { verdict: Verdict; title: string }) {
  return (
    <div className="card rounded-[18px] p-6">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <h3 className="font-display text-xl font-bold tracking-tight">{title}</h3>
        <VerdictBadge level={verdict.level} />
      </div>
      <p className="text-lg font-semibold">{verdict.headline}</p>
      <p className="mt-1.5 text-[var(--text-secondary)]">{verdict.detail}</p>
    </div>
  );
}

export function StatTile({
  value,
  label,
  sub,
  accent,
}: {
  value: string;
  label: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="card p-5">
      <div
        className="font-display text-3xl font-bold tabular sm:text-4xl"
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </div>
      <div className="mt-1 text-sm font-medium text-[var(--text-secondary)]">{label}</div>
      {sub && <div className="mt-0.5 text-xs text-[var(--text-muted)]">{sub}</div>}
    </div>
  );
}

export function SectionHeading({
  kicker,
  title,
  children,
}: {
  kicker?: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-6 max-w-2xl">
      {kicker && (
        <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-meadow-600 dark:text-meadow-300">
          {kicker}
        </div>
      )}
      <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
      {children && <p className="mt-3 text-lg text-[var(--text-secondary)]">{children}</p>}
    </div>
  );
}
