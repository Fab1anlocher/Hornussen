"use client";
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import type { BinPoint } from "@/lib/chart-data";

interface Props {
  bins: BinPoint[];
  line: { x: number; y: number }[];
  xLabel: string;
  yLabel: string;
  xUnit?: string;
  yUnit?: string;
  color?: string;
}

export function BinnedTrend({ bins, line, xLabel, yLabel, xUnit = "", yUnit = "", color = "var(--series-1)" }: Props) {
  const ys = bins.map((b) => b.y);
  const lineYs = line.map((p) => p.y);
  const lo = Math.min(...ys, ...lineYs);
  const hi = Math.max(...ys, ...lineYs);
  const pad = (hi - lo) * 0.12 || 1;

  return (
    <div className="h-80 w-full text-[var(--text-muted)]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart margin={{ top: 16, right: 16, left: 8, bottom: 28 }}>
          <CartesianGrid stroke="var(--grid)" />
          <XAxis
            type="number"
            dataKey="x"
            name={xLabel}
            tick={{ fontSize: 12, fill: "var(--text-muted)" }}
            tickLine={false}
            axisLine={{ stroke: "var(--axis)" }}
            label={{ value: xLabel, position: "insideBottom", offset: -16, fill: "var(--text-secondary)", fontSize: 13 }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name={yLabel}
            domain={[lo - pad, hi + pad]}
            tick={{ fontSize: 12, fill: "var(--text-muted)" }}
            tickLine={false}
            axisLine={false}
            width={52}
            label={{ value: yLabel, angle: -90, position: "insideLeft", fill: "var(--text-secondary)", fontSize: 13, style: { textAnchor: "middle" } }}
          />
          <ZAxis type="number" dataKey="count" range={[40, 500]} name="Beobachtungen" />
          <Tooltip
            cursor={{ stroke: "var(--axis)", strokeDasharray: "3 3" }}
            contentStyle={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              color: "var(--text-primary)",
            }}
            formatter={(v: number, n) => {
              if (n === "Beobachtungen") return [v, "n"];
              if (n === yLabel) return [`${Math.round(v * 100) / 100} ${yUnit}`, yLabel];
              return [`${v} ${xUnit}`, xLabel];
            }}
          />
          {/* OLS trend line */}
          <Line
            data={line}
            dataKey="y"
            stroke={color}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
            legendType="none"
          />
          {/* Binned means, sized by observation count */}
          <Scatter
            data={bins}
            fill={color}
            fillOpacity={0.55}
            stroke={color}
            strokeWidth={1.5}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
