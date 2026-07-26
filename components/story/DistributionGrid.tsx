import type { CorrelationResult, NummernDistribution } from "@/lib/types";

const W = 380;
const H = 262;
// Bottom padding clears R_MAX: the zero-Nummern row holds the fattest dots and
// would otherwise sit on top of the okta labels.
const PAD = { left: 30, right: 10, top: 22, bottom: 46 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;
const COL_W = PLOT_W / 9;
/** Biggest dot radius; sized so neighbours never touch on the tightest axis. */
const R_MAX = 16;

/**
 * Every observation as one cell of an okta × Nummern grid: dot area is the
 * share of that column, so the nine columns stay comparable even though the
 * overcast one holds three times as many games. The OLS line from the analysis
 * is drawn on the same scale, which is the point of the chapter — the model is
 * a thin line through a very wide cloud.
 */
export function DistributionGrid({
  distribution,
  correlation,
}: {
  distribution: NummernDistribution;
  correlation: CorrelationResult;
}) {
  const { counts, cap } = distribution;
  const totals = counts.map((row) => row.reduce((a, b) => a + b, 0));
  const shares = counts.map((row, i) =>
    row.map((v) => (totals[i] === 0 ? 0 : v / totals[i])),
  );
  const maxShare = Math.max(...shares.flat(), 1e-9);

  const x = (okta: number) => PAD.left + COL_W * (okta + 0.5);
  const y = (nummern: number) => PAD.top + PLOT_H - (nummern / cap) * PLOT_H;
  // The regression was fitted on cloud cover in percent; an okta is 12.5 % of sky.
  const fit = (okta: number) => correlation.intercept + correlation.slope * okta * 12.5;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="block w-full"
      role="img"
      aria-label={
        `Verteilung der Nummern je Bewölkungsstufe. Bei wolkenlosem Himmel enden ` +
        `${Math.round(shares[0][0] * 100)} Prozent der Resultate ohne Nummer, bei bedecktem ` +
        `Himmel ${Math.round(shares[8][0] * 100)} Prozent.`
      }
    >
      {/* horizontal guides, one per Nummern value */}
      {Array.from({ length: cap + 1 }, (_, n) => (
        <g key={`row-${n}`}>
          <line
            x1={PAD.left}
            x2={W - PAD.right}
            y1={y(n)}
            y2={y(n)}
            stroke="var(--grid)"
            strokeWidth={1}
          />
          <text
            x={PAD.left - 8}
            y={y(n) + 3.5}
            textAnchor="end"
            fontSize={9}
            fill="var(--text-muted)"
          >
            {n === cap ? `${n}+` : n}
          </text>
        </g>
      ))}

      {/* the data itself */}
      {shares.map((col, i) =>
        col.map((share, n) => {
          if (share <= 0) return null;
          const r = R_MAX * Math.sqrt(share / maxShare);
          return (
            <circle
              key={`d-${i}-${n}`}
              className="dist-dot"
              cx={x(i)}
              cy={y(n)}
              r={r}
              fill={i === 0 ? "var(--series-1)" : "var(--series-muted)"}
              fillOpacity={i === 0 ? 0.85 : 0.7}
              style={{ transitionDelay: `${i * 55 + n * 18}ms` }}
            />
          );
        }),
      )}

      {/* OLS fit across the whole scale */}
      <line
        className="dist-fit"
        x1={x(0)}
        y1={y(fit(0))}
        x2={x(8)}
        y2={y(fit(8))}
        stroke="var(--fit)"
        strokeWidth={2}
        strokeLinecap="round"
      />

      {/* okta labels */}
      {counts.map((_, i) => (
        <text
          key={`x-${i}`}
          x={x(i)}
          y={H - PAD.bottom + 26}
          textAnchor="middle"
          fontSize={9}
          fill="var(--text-muted)"
        >
          {i}/8
        </text>
      ))}
      <text x={PAD.left} y={H - 4} fontSize={9} fill="var(--text-muted)">
        wolkenlos
      </text>
      <text x={W - PAD.right} y={H - 4} textAnchor="end" fontSize={9} fill="var(--text-muted)">
        bedeckt
      </text>
      <text x={0} y={10} fontSize={9} fill="var(--text-muted)">
        Nummern ↑
      </text>
    </svg>
  );
}
