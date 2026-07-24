"use client";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ErrorBar,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Bucket } from "@/lib/types";

interface Props {
  buckets: Bucket[];
  unit: string;
  /** Color each bar; defaults to sequential blue. Diverging: pass colors. */
  colors?: string[];
  domainPad?: number;
}

export function BarBuckets({ buckets, unit, colors, domainPad = 0.08 }: Props) {
  const data = buckets
    .filter((b) => b.count > 0)
    .map((b) => ({ ...b, mean: Math.round(b.mean * 100) / 100, se: Math.round(b.stdErr * 100) / 100 }));
  const vals = data.map((d) => d.mean);
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);
  const span = hi - lo || 1;

  return (
    <div className="h-72 w-full text-[var(--text-muted)]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 24, right: 12, left: 4, bottom: 4 }}>
          <CartesianGrid stroke="var(--grid)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12, fill: "var(--text-secondary)" }}
            tickLine={false}
            axisLine={{ stroke: "var(--axis)" }}
            interval={0}
          />
          <YAxis
            domain={[lo - span * domainPad, hi + span * domainPad]}
            tick={{ fontSize: 12, fill: "var(--text-muted)" }}
            tickLine={false}
            axisLine={false}
            width={44}
          />
          <Tooltip
            cursor={{ fill: "var(--surface-2)" }}
            contentStyle={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              color: "var(--text-primary)",
            }}
            formatter={(v: number, _n, p) => [
              `${v} ${unit} (±${(p.payload as { se: number }).se})`,
              "Mittelwert",
            ]}
            labelFormatter={(l, p) => `${l} · n=${(p?.[0]?.payload as { count: number })?.count ?? 0}`}
          />
          <Bar dataKey="mean" radius={[4, 4, 0, 0]} maxBarSize={90} isAnimationActive={false}>
            {data.map((_, i) => (
              <Cell key={i} fill={colors?.[i] ?? "var(--series-1)"} />
            ))}
            <ErrorBar dataKey="se" width={4} strokeWidth={1.5} stroke="var(--text-muted)" direction="y" />
            <LabelList
              dataKey="mean"
              position="top"
              style={{ fill: "var(--text-primary)", fontSize: 12, fontWeight: 600 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
