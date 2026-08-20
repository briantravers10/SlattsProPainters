"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Home, Building2, KeyRound, HardHat, Sparkles, X, MapPin, Layers } from "lucide-react";
import { Badge, Button, Card, CardHeader, PageHeader, Select } from "@/components/ui";
import { StageBadge } from "@/components/ui/StageBadge";
import { ScorePill } from "@/components/ui/ScoreIndicators";
import { useData } from "@/lib/store/DataProvider";
import {
  BOROUGH_COLORS,
  BOROUGH_LABEL_POINTS,
  BOROUGH_SHAPES,
  insetShape,
  project,
} from "@/lib/geo/nyc";
import { BOROUGHS } from "@/lib/types";
import type { Borough, Lead } from "@/lib/types";
import { cn, currency } from "@/lib/utils";

const W = 1000;
const H = 990;

type LayerId = "property" | "managers" | "realtors" | "contractors" | "other";

const LAYERS: { id: LayerId; label: string; color: string; icon: typeof Home }[] = [
  { id: "property", label: "Property opportunities", color: "#2a78d6", icon: Home },
  { id: "managers", label: "Property managers", color: "#eb6834", icon: Building2 },
  { id: "realtors", label: "Realtors & brokerages", color: "#7c3aed", icon: KeyRound },
  { id: "contractors", label: "Contractors", color: "#0d9488", icon: HardHat },
  { id: "other", label: "Other partners", color: "#db2777", icon: Sparkles },
];

function layerOf(lead: Lead): LayerId {
  if (lead.kind === "property") return "property";
  switch (lead.group) {
    case "Property Managers":
      return "managers";
    case "Realtors":
      return "realtors";
    case "Contractors":
      return "contractors";
    default:
      return "other";
  }
}

export default function MapPage() {
  const { propertyLeads, businessLeads } = useData();
  const [active, setActive] = useState<Set<LayerId>>(
    new Set<LayerId>(["property", "managers", "realtors", "contractors", "other"]),
  );
  const [borough, setBorough] = useState<Borough | "all">("all");
  const [minScore, setMinScore] = useState(0);
  const [selected, setSelected] = useState<Lead | null>(null);

  const points = useMemo(() => {
    return [...propertyLeads, ...businessLeads]
      .filter((l) => active.has(layerOf(l)))
      .filter((l) => borough === "all" || l.borough === borough)
      .filter((l) => l.score.score >= minScore)
      .map((l) => {
        const p = project(l.lng, l.lat);
        return { lead: l, x: p.x * W, y: p.y * H, layer: layerOf(l) };
      });
  }, [propertyLeads, businessLeads, active, borough, minScore]);

  const toggle = (id: LayerId) =>
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const counts = useMemo(() => {
    const c: Record<LayerId, number> = { property: 0, managers: 0, realtors: 0, contractors: 0, other: 0 };
    for (const l of [...propertyLeads, ...businessLeads]) {
      if (borough !== "all" && l.borough !== borough) continue;
      c[layerOf(l)]++;
    }
    return c;
  }, [propertyLeads, businessLeads, borough]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Territory map"
        title="Where the work is across the five boroughs"
        description="Every live opportunity plotted on the service territory. Filter by layer, borough or score, then click any marker to open the lead. Routing crews by density — rather than by lead count — is what makes the neighbor campaign work."
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
            {LAYERS.map((layer) => {
              const on = active.has(layer.id);
              const Icon = layer.icon;
              return (
                <button
                  key={layer.id}
                  onClick={() => toggle(layer.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[12px] font-medium transition-all",
                    on
                      ? "border-transparent text-white shadow-sm"
                      : "border-border bg-surface text-subtle hover:text-muted",
                  )}
                  style={on ? { background: layer.color } : undefined}
                >
                  <Icon className="size-3.5" />
                  {layer.label}
                  <span className={cn("tabular-nums", on ? "text-white/75" : "text-subtle")}>
                    {counts[layer.id]}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="relative bg-[var(--surface-2)]">
            <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="NYC territory map">
              <defs>
                <pattern id="water" width="24" height="24" patternUnits="userSpaceOnUse">
                  <rect width="24" height="24" fill="var(--surface-2)" />
                  <path d="M0 12h24" stroke="var(--border)" strokeWidth="0.6" opacity="0.5" />
                  <path d="M12 0v24" stroke="var(--border)" strokeWidth="0.6" opacity="0.5" />
                </pattern>
              </defs>
              <rect width={W} height={H} fill="url(#water)" />

              {BOROUGHS.map((b) => {
                const pts = insetShape(BOROUGH_SHAPES[b])
                  .map(([lng, lat]) => {
                    const p = project(lng, lat);
                    return `${(p.x * W).toFixed(1)},${(p.y * H).toFixed(1)}`;
                  })
                  .join(" ");
                const dim = borough !== "all" && borough !== b;
                return (
                  <polygon
                    key={b}
                    points={pts}
                    fill={BOROUGH_COLORS[b]}
                    fillOpacity={dim ? 0.05 : 0.12}
                    stroke={BOROUGH_COLORS[b]}
                    strokeOpacity={dim ? 0.15 : 0.45}
                    strokeWidth={1.6}
                    strokeLinejoin="round"
                    className="transition-all duration-300"
                  />
                );
              })}

              {BOROUGHS.map((b) => {
                const [lng, lat] = BOROUGH_LABEL_POINTS[b];
                const p = project(lng, lat);
                return (
                  <text
                    key={b}
                    x={p.x * W}
                    y={p.y * H}
                    textAnchor="middle"
                    className="pointer-events-none select-none"
                    style={{
                      fontSize: 19,
                      fontWeight: 600,
                      letterSpacing: "0.06em",
                      fill: "var(--text-subtle)",
                      textTransform: "uppercase",
                      opacity: borough !== "all" && borough !== b ? 0.35 : 1,
                    }}
                  >
                    {b}
                  </text>
                );
              })}

              {points.map(({ lead, x, y, layer }) => {
                const color = LAYERS.find((l) => l.id === layer)!.color;
                const isSel = selected?.id === lead.id;
                const r = lead.score.score >= 85 ? 8 : lead.score.score >= 70 ? 6.5 : 5.5;
                return (
                  <g
                    key={lead.id}
                    onClick={() => setSelected(lead)}
                    className="cursor-pointer"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && setSelected(lead)}
                  >
                    {(isSel || lead.score.score >= 90) && (
                      <circle cx={x} cy={y} r={r + 5} fill={color} opacity={0.18} />
                    )}
                    <circle
                      cx={x}
                      cy={y}
                      r={r}
                      fill={color}
                      stroke="var(--surface)"
                      strokeWidth={2}
                      className="transition-all duration-200 hover:brightness-110"
                      opacity={isSel ? 1 : 0.92}
                    />
                  </g>
                );
              })}
            </svg>

            {/* Selected lead callout */}
            {selected && (
              <div className="absolute bottom-3 left-3 right-3 animate-fade-up sm:right-auto sm:w-[340px]">
                <div className="card p-4 shadow-xl">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-brand">
                        {selected.kind === "property" ? "Property opportunity" : "Partnership opportunity"}
                      </p>
                      <p className="mt-1 truncate text-[14px] font-semibold text-fg">
                        {selected.kind === "property" ? selected.address : selected.businessName}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 text-[12px] text-subtle">
                        <MapPin className="size-3" />
                        {selected.neighborhood}, {selected.borough}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelected(null)}
                      className="flex size-7 shrink-0 items-center justify-center rounded-lg text-subtle hover:bg-surface-2"
                      aria-label="Close"
                    >
                      <X className="size-4" />
                    </button>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <ScorePill score={selected.score.score} />
                    <StageBadge stage={selected.stage} />
                    <Badge tone="muted">
                      {selected.kind === "property"
                        ? `${currency(selected.estimatedValueLow, true)}–${currency(selected.estimatedValueHigh, true)}`
                        : `${currency(selected.estimatedAnnualOpportunity, true)}/yr`}
                    </Badge>
                  </div>

                  <p className="mt-2.5 line-clamp-3 text-[12.5px] leading-relaxed text-muted">
                    {selected.kind === "property" ? selected.identifiedReason : selected.recommendedPitch}
                  </p>

                  <Link
                    href={
                      selected.kind === "property"
                        ? `/property-leads/${selected.id}`
                        : `/partnership-leads/${selected.id}`
                    }
                    className="mt-3 block"
                  >
                    <Button variant="primary" size="sm" className="w-full">
                      Open full lead
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-border px-4 py-2.5">
            <p className="text-[11.5px] text-subtle">
              Stylised territory map. Borough outlines are simplified for the demo and marker positions
              are approximate synthetic coordinates — not real addresses.
            </p>
          </div>
        </Card>

        {/* Controls */}
        <div className="space-y-4">
          <Card>
            <CardHeader title="Map controls" icon={<Layers className="size-4.5" />} />
            <div className="space-y-4 px-5 pb-5">
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.07em] text-subtle">
                  Borough
                </label>
                <Select value={borough} onChange={(e) => setBorough(e.target.value as Borough | "all")}>
                  <option value="all">All five boroughs</option>
                  {BOROUGHS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="mb-1 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.07em] text-subtle">
                  Minimum score
                  <span className="tabular-nums text-fg">{minScore}</span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={95}
                  step={5}
                  value={minScore}
                  onChange={(e) => setMinScore(Number(e.target.value))}
                  className="w-full accent-[var(--brand)]"
                />
              </div>
              <div className="rounded-xl border border-border bg-surface-2/60 p-3">
                <p className="text-[12.5px] text-muted">
                  <strong className="font-semibold text-fg">{points.length}</strong> markers shown.
                  Larger markers indicate higher-scoring opportunities; a halo marks a 90+ lead.
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Density by borough" subtitle="Where crews should be routed" />
            <ul className="divide-y divide-border">
              {BOROUGHS.map((b) => {
                const inBorough = points.filter((p) => p.lead.borough === b);
                const pct = points.length ? (inBorough.length / points.length) * 100 : 0;
                return (
                  <li key={b} className="px-5 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 text-[13px] text-fg">
                        <span className="size-2 rounded-full" style={{ background: BOROUGH_COLORS[b] }} />
                        {b}
                      </span>
                      <span className="text-[12.5px] tabular-nums text-muted">{inBorough.length}</span>
                    </div>
                    <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-surface-3">
                      <div
                        className="h-full rounded-full transition-[width] duration-500"
                        style={{ width: `${pct}%`, background: BOROUGH_COLORS[b] }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
