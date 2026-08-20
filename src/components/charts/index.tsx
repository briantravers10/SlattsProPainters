"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useViz } from "./tokens";
import { VizLegend, VizTooltip } from "./Tooltip";
import { currency } from "@/lib/utils";

const AXIS_TICK = { fontSize: 11.5 };

/* ------------------------------------------------------------------ */
/* Leads by borough — two categorical series, grouped columns          */
/* ------------------------------------------------------------------ */

export function BoroughChart({
  data,
}: {
  data: { borough: string; properties: number; businesses: number }[];
}) {
  const t = useViz();
  const short = data.map((d) => ({ ...d, label: d.borough.replace("The ", "") }));

  return (
    <div>
      <VizLegend
        items={[
          { label: "Property leads", color: t.series[0] },
          { label: "Partnership leads", color: t.series[1] },
        ]}
      />
      <div className="mt-3 h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={short} margin={{ top: 8, right: 4, bottom: 0, left: -18 }} barGap={2}>
            <CartesianGrid stroke={t.grid} vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={{ stroke: t.axis }}
              tick={{ ...AXIS_TICK, fill: t.inkMuted }}
              interval={0}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ ...AXIS_TICK, fill: t.inkMuted }}
              width={44}
              allowDecimals={false}
            />
            <Tooltip
              cursor={{ fill: t.grid, opacity: 0.5 }}
              content={<VizTooltip />}
            />
            <Bar
              dataKey="properties"
              name="Property leads"
              fill={t.series[0]}
              radius={[4, 4, 0, 0]}
              maxBarSize={24}
            />
            <Bar
              dataKey="businesses"
              name="Partnership leads"
              fill={t.series[1]}
              radius={[4, 4, 0, 0]}
              maxBarSize={24}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Discovery over the last 7 days — two series, area                   */
/* ------------------------------------------------------------------ */

export function DiscoveryChart({
  data,
}: {
  data: { day: string; properties: number; businesses: number }[];
}) {
  const t = useViz();
  return (
    <div>
      <VizLegend
        items={[
          { label: "Properties discovered", color: t.series[0] },
          { label: "Partners discovered", color: t.series[1] },
        ]}
      />
      <div className="mt-3 h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 6, bottom: 0, left: -18 }}>
            <defs>
              <linearGradient id="gradA" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={t.series[0]} stopOpacity={0.16} />
                <stop offset="100%" stopColor={t.series[0]} stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gradB" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={t.series[1]} stopOpacity={0.16} />
                <stop offset="100%" stopColor={t.series[1]} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={t.grid} vertical={false} />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={{ stroke: t.axis }}
              tick={{ ...AXIS_TICK, fill: t.inkMuted }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ ...AXIS_TICK, fill: t.inkMuted }}
              width={44}
              allowDecimals={false}
            />
            <Tooltip cursor={{ stroke: t.axis, strokeWidth: 1 }} content={<VizTooltip />} />
            <Area
              type="monotone"
              dataKey="properties"
              name="Properties discovered"
              stroke={t.series[0]}
              strokeWidth={2}
              fill="url(#gradA)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: t.surface }}
            />
            <Area
              type="monotone"
              dataKey="businesses"
              name="Partners discovered"
              stroke={t.series[1]}
              strokeWidth={2}
              fill="url(#gradB)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: t.surface }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Single-measure horizontal bars (sources, categories)                */
/* ------------------------------------------------------------------ */

export function HorizontalBars({
  data,
  height = 240,
  valueLabel = "Leads",
  yWidth = 168,
}: {
  data: { name: string; value: number }[];
  height?: number;
  valueLabel?: string;
  yWidth?: number;
}) {
  const t = useViz();
  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 2, right: 34, bottom: 2, left: 0 }}
          barCategoryGap={6}
        >
          <CartesianGrid stroke={t.grid} horizontal={false} />
          <XAxis type="number" hide allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="name"
            tickLine={false}
            axisLine={false}
            width={yWidth}
            tick={{ ...AXIS_TICK, fill: t.inkMuted }}
          />
          <Tooltip
            cursor={{ fill: t.grid, opacity: 0.5 }}
            content={<VizTooltip formatter={(v) => `${v} ${valueLabel.toLowerCase()}`} />}
          />
          <Bar dataKey="value" name={valueLabel} fill={t.single} radius={[0, 4, 4, 0]} maxBarSize={18}>
            <LabelList
              dataKey="value"
              position="right"
              offset={8}
              style={{ fontSize: 11.5, fill: t.inkMuted, fontWeight: 600 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Score distribution — ordinal ramp, direct-labelled                  */
/* ------------------------------------------------------------------ */

export function ScoreBandChart({ data }: { data: { band: string; count: number }[] }) {
  const t = useViz();
  // Ordinal ramp runs light → dark; highest opportunity gets the darkest step.
  const ramp = [...t.ordinal].reverse();
  const rows = data.map((d, i) => ({ ...d, fill: ramp[i] ?? t.ordinal[0] }));

  return (
    <div className="h-[190px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={rows}
          layout="vertical"
          margin={{ top: 2, right: 34, bottom: 2, left: 0 }}
          barCategoryGap={8}
        >
          <CartesianGrid stroke={t.grid} horizontal={false} />
          <XAxis type="number" hide allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="band"
            tickLine={false}
            axisLine={false}
            width={148}
            tick={{ ...AXIS_TICK, fill: t.inkMuted }}
            tickFormatter={(v: string) => v.replace(" Opportunity", "").replace(" Priority", "")}
          />
          <Tooltip
            cursor={{ fill: t.grid, opacity: 0.5 }}
            content={<VizTooltip formatter={(v) => `${v} leads`} />}
          />
          <Bar dataKey="count" name="Leads" radius={[0, 4, 4, 0]} maxBarSize={20}>
            {rows.map((r) => (
              <Cell key={r.band} fill={r.fill} />
            ))}
            <LabelList
              dataKey="count"
              position="right"
              offset={8}
              style={{ fontSize: 11.5, fill: t.inkMuted, fontWeight: 600 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Pipeline funnel — single series, position carries the order         */
/* ------------------------------------------------------------------ */

export function FunnelChart({ data }: { data: { stage: string; count: number }[] }) {
  const t = useViz();
  return (
    <div className="w-full" style={{ height: data.length * 30 + 16 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 2, right: 34, bottom: 2, left: 0 }}
          barCategoryGap={7}
        >
          <CartesianGrid stroke={t.grid} horizontal={false} />
          <XAxis type="number" hide allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="stage"
            tickLine={false}
            axisLine={false}
            width={132}
            tick={{ ...AXIS_TICK, fill: t.inkMuted }}
          />
          <Tooltip
            cursor={{ fill: t.grid, opacity: 0.5 }}
            content={<VizTooltip formatter={(v) => `${v} leads`} />}
          />
          <Bar dataKey="count" name="Leads" fill={t.single} radius={[0, 4, 4, 0]} maxBarSize={18}>
            <LabelList
              dataKey="count"
              position="right"
              offset={8}
              style={{ fontSize: 11.5, fill: t.inkMuted, fontWeight: 600 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Borough pipeline value — single measure, currency labels            */
/* ------------------------------------------------------------------ */

export function ValueByBoroughChart({
  data,
}: {
  data: { borough: string; value: number }[];
}) {
  const t = useViz();
  const rows = data.map((d) => ({ name: d.borough.replace("The ", ""), value: Math.round(d.value) }));
  return (
    <div className="h-[190px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={rows}
          layout="vertical"
          margin={{ top: 2, right: 52, bottom: 2, left: 0 }}
          barCategoryGap={8}
        >
          <CartesianGrid stroke={t.grid} horizontal={false} />
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            tickLine={false}
            axisLine={false}
            width={104}
            tick={{ ...AXIS_TICK, fill: t.inkMuted }}
          />
          <Tooltip
            cursor={{ fill: t.grid, opacity: 0.5 }}
            content={<VizTooltip formatter={(v) => currency(Number(v))} />}
          />
          <Bar dataKey="value" name="Pipeline value" fill={t.single} radius={[0, 4, 4, 0]} maxBarSize={20}>
            <LabelList
              dataKey="value"
              position="right"
              offset={8}
              formatter={(v: unknown) => currency(Number(v ?? 0), true)}
              style={{ fontSize: 11.5, fill: t.inkMuted, fontWeight: 600 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Small inline sparkline for stat tiles. */
export function Sparkline({ values, color }: { values: number[]; color?: string }) {
  const t = useViz();
  const data = values.map((v, i) => ({ i, v }));
  return (
    <div className="h-8 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color ?? t.single}
            strokeWidth={2}
            fill={color ?? t.single}
            fillOpacity={0.1}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
