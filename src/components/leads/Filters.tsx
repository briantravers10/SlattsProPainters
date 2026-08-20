"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { Badge, Button, Input, Select } from "@/components/ui";
import { BOROUGHS, LEAD_STAGES } from "@/lib/types";
import type { Borough, LeadStage } from "@/lib/types";
import { NEIGHBORHOODS } from "@/lib/geo/nyc";

export interface FilterState {
  q: string;
  borough: Borough | "all";
  neighborhood: string;
  stage: LeadStage | "all";
  band: "all" | "hot" | "high" | "medium" | "low";
  extra: string;
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

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
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
            <Button size="sm" variant="ghost" onClick={() => onChange({ ...DEFAULT_FILTERS, sort: value.sort })}>
              <X className="size-3.5" /> Clear filters
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
