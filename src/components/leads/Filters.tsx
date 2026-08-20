"use client";

import { useEffect, useRef, useState } from "react";
import { Check, MapPin, Search, SlidersHorizontal, X } from "lucide-react";
import { Badge, Button, Input, Select } from "@/components/ui";
import { BOROUGHS, LEAD_STAGES } from "@/lib/types";
import type { Borough, LeadStage } from "@/lib/types";
import { NEIGHBORHOODS, zipsByBorough } from "@/lib/geo/nyc";
import { cn } from "@/lib/utils";

export interface FilterState {
  q: string;
  borough: Borough | "all";
  neighborhood: string;
  stage: LeadStage | "all";
  band: "all" | "hot" | "high" | "medium" | "low";
  extra: string;
  /** Empty means "every ZIP". ZIP is an independent filter, not a child of borough. */
  zips: string[];
  discovered: "all" | "7" | "14" | "30";
  sort: "score" | "value" | "recent" | "followup";
}

export const DEFAULT_FILTERS: FilterState = {
  q: "",
  borough: "all",
  neighborhood: "all",
  stage: "all",
  band: "all",
  extra: "all",
  zips: [],
  discovered: "all",
  sort: "score",
};

export function matchesBand(score: number, band: FilterState["band"]) {
  switch (band) {
    case "hot":
      return score >= 85;
    case "high":
      return score >= 75;
    case "medium":
      return score >= 60 && score < 75;
    case "low":
      return score < 60;
    default:
      return true;
  }
}

export function FilterBar({
  value,
  onChange,
  extraLabel,
  extraOptions,
  sortOptions,
  resultCount,
  totalCount,
}: {
  value: FilterState;
  onChange: (next: FilterState) => void;
  extraLabel: string;
  extraOptions: string[];
  sortOptions: { value: FilterState["sort"]; label: string }[];
  resultCount: number;
  totalCount: number;
}) {
  const set = <K extends keyof FilterState>(key: K, v: FilterState[K]) =>
    onChange({ ...value, [key]: v });

  const neighborhoods =
    value.borough === "all"
      ? NEIGHBORHOODS
      : NEIGHBORHOODS.filter((n) => n.borough === value.borough);

  const active =
    (value.q ? 1 : 0) +
    (value.borough !== "all" ? 1 : 0) +
    (value.neighborhood !== "all" ? 1 : 0) +
    (value.stage !== "all" ? 1 : 0) +
    (value.band !== "all" ? 1 : 0) +
    (value.extra !== "all" ? 1 : 0) +
    (value.zips.length > 0 ? 1 : 0) +
    (value.discovered !== "all" ? 1 : 0);

  return (
    <div className="card p-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
            <Input
              value={value.q}
              onChange={(e) => set("q", e.target.value)}
              placeholder="Search address, owner, business, neighborhood…"
              className="pl-9"
            />
          </div>
          <div className="w-full sm:w-[210px]">
            <Select
              value={value.sort}
              onChange={(e) => set("sort", e.target.value as FilterState["sort"])}
            >
              {sortOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  Sort: {o.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-7">
          <Select
            value={value.borough}
            onChange={(e) => onChange({ ...value, borough: e.target.value as Borough | "all", neighborhood: "all" })}
          >
            <option value="all">All boroughs</option>
            {BOROUGHS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </Select>

          <Select value={value.neighborhood} onChange={(e) => set("neighborhood", e.target.value)}>
            <option value="all">All neighborhoods</option>
            {neighborhoods.map((n) => (
              <option key={n.name} value={n.name}>
                {n.name}
              </option>
            ))}
          </Select>

          <ZipFilter
            selected={value.zips}
            borough={value.borough}
            onChange={(zips) => set("zips", zips)}
          />

          <Select value={value.extra} onChange={(e) => set("extra", e.target.value)}>
            <option value="all">All {extraLabel.toLowerCase()}</option>
            {extraOptions.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </Select>

          <Select
            value={value.stage}
            onChange={(e) => set("stage", e.target.value as LeadStage | "all")}
          >
            <option value="all">All stages</option>
            {LEAD_STAGES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>

          <Select
            value={value.band}
            onChange={(e) => set("band", e.target.value as FilterState["band"])}
          >
            <option value="all">Any score</option>
            <option value="hot">Hot — 85+</option>
            <option value="high">High — 75+</option>
            <option value="medium">Medium — 60-74</option>
            <option value="low">Low — under 60</option>
          </Select>

          <Select
            value={value.discovered}
            onChange={(e) => set("discovered", e.target.value as FilterState["discovered"])}
          >
            <option value="all">Any discovery date</option>
            <option value="7">Last 7 days</option>
            <option value="14">Last 14 days</option>
            <option value="30">Last 30 days</option>
          </Select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
          <p className="flex items-center gap-2 text-[12.5px] text-muted">
            <SlidersHorizontal className="size-3.5 text-subtle" />
            Showing <strong className="font-semibold text-fg">{resultCount}</strong> of {totalCount}
            {active > 0 && <Badge tone="brand">{active} filter{active === 1 ? "" : "s"} active</Badge>}
          </p>
          {active > 0 && (
            <Button size="sm" variant="ghost" onClick={() => onChange({ ...DEFAULT_FILTERS, zips: [], sort: value.sort })}>
              <X className="size-3.5" /> Clear filters
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}


/**
 * Multi-select ZIP filter.
 *
 * Deliberately independent of the borough/neighborhood selects: NYC ZIPs
 * straddle both, so a ZIP is never presented as belonging to exactly one
 * neighborhood. Choosing a borough narrows the list on offer as a convenience,
 * but an already-selected ZIP is never silently dropped.
 */
function ZipFilter({
  selected,
  borough,
  onChange,
}: {
  selected: string[];
  borough: Borough | "all";
  onChange: (zips: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const available = zipsByBorough(borough === "all" ? undefined : borough);
  // Keep any selected ZIP visible even when it sits outside the chosen borough.
  const options = [...new Set([...available, ...selected])].sort();
  const shown = query ? options.filter((z) => z.startsWith(query.trim())) : options;

  const toggle = (zip: string) =>
    onChange(selected.includes(zip) ? selected.filter((z) => z !== zip) : [...selected, zip]);

  const label =
    selected.length === 0
      ? "All ZIP codes"
      : selected.length === 1
        ? selected[0]
        : `${selected.length} ZIP codes`;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-9.5 w-full items-center gap-1.5 rounded-[10px] border bg-surface px-3 text-left text-sm transition-shadow focus-visible:focus-ring outline-none",
          selected.length > 0 ? "border-brand/50 text-brand" : "border-border text-fg",
        )}
      >
        <MapPin className="size-3.5 shrink-0 opacity-60" />
        <span className="truncate">{label}</span>
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+4px)] z-50 w-[268px] overflow-hidden rounded-xl border border-border bg-surface shadow-xl animate-fade-in">
          <div className="border-b border-border p-2">
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type a ZIP, e.g. 11215"
              inputMode="numeric"
              className="h-8 text-[13px]"
            />
          </div>

          <div className="max-h-[240px] overflow-y-auto p-1">
            {shown.length === 0 && (
              <p className="px-3 py-6 text-center text-[12.5px] text-muted">
                No ZIP in the territory starts with &ldquo;{query}&rdquo;.
              </p>
            )}
            {shown.map((zip) => {
              const on = selected.includes(zip);
              return (
                <button
                  key={zip}
                  type="button"
                  onClick={() => toggle(zip)}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left transition-colors hover:bg-surface-2"
                >
                  <span
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center rounded border",
                      on ? "border-brand bg-brand text-white" : "border-border-strong",
                    )}
                  >
                    {on && <Check className="size-3" />}
                  </span>
                  <span className="font-mono text-[13px] text-fg">{zip}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-border px-2.5 py-2">
            <span className="text-[11.5px] text-subtle">{selected.length} selected</span>
            <button
              type="button"
              onClick={() => onChange([])}
              disabled={selected.length === 0}
              className="text-[12px] font-medium text-brand disabled:opacity-40"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
