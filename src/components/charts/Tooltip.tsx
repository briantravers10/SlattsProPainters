"use client";

import { useViz } from "./tokens";

interface Entry {
  name?: string;
  value?: number | string;
  color?: string;
  dataKey?: string | number;
}

/** Shared tooltip shell — text always wears text tokens, never the series colour. */
export function VizTooltip({
  active,
  payload,
  label,
  formatter,
  labelSuffix,
}: {
  active?: boolean;
  payload?: Entry[];
  label?: string | number;
  formatter?: (v: number | string, name?: string) => string;
  labelSuffix?: string;
}) {
  const t = useViz();
  if (!active || !payload?.length) return null;

  return (
    <div
      className="rounded-xl px-3 py-2.5 text-[12.5px] shadow-lg"
      style={{ background: t.surface, border: `1px solid ${t.border}`, color: t.ink }}
    >
      {label !== undefined && (
        <p className="mb-1.5 font-semibold" style={{ color: t.ink }}>
          {label}
          {labelSuffix}
        </p>
      )}
      <div className="space-y-1">
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center gap-2 whitespace-nowrap">
            <span
              className="size-2 shrink-0 rounded-[3px]"
              style={{ background: entry.color }}
            />
            <span style={{ color: t.inkMuted }}>{entry.name}</span>
            <span className="ml-auto pl-3 font-semibold tabular-nums" style={{ color: t.ink }}>
              {formatter
                ? formatter(entry.value ?? 0, entry.name)
                : typeof entry.value === "number"
                  ? entry.value.toLocaleString()
                  : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Legend rendered outside recharts so it can use text tokens consistently. */
export function VizLegend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {items.map((i) => (
        <span key={i.label} className="inline-flex items-center gap-1.5 text-[12px] text-muted">
          <span className="size-2 rounded-[3px]" style={{ background: i.color }} />
          {i.label}
        </span>
      ))}
    </div>
  );
}
