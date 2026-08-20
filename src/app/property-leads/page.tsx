"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Home, Download, Flame, PaintBucket, Building } from "lucide-react";
import { Card, CardHeader, PageHeader, Badge } from "@/components/ui";
import { StatTile } from "@/components/leads/StatCard";
import { PropertyTable } from "@/components/leads/LeadTables";
import { DEFAULT_FILTERS, FilterBar, matchesBand, type FilterState } from "@/components/leads/Filters";
import { useData } from "@/lib/store/DataProvider";
import { currency, daysAgo } from "@/lib/utils";

const PROPERTY_TYPES = [
  "Single-Family", "Two-Family", "Townhouse", "Brownstone", "Condo", "Co-op",
  "Small Multifamily", "Mixed-Use", "Commercial",
];

function PropertyLeadsInner() {
  const { propertyLeads } = useData();
  const params = useSearchParams();
  const [filters, setFilters] = useState<FilterState>({
    ...DEFAULT_FILTERS,
    band: params.get("score") === "hot" ? "hot" : "all",
    borough: (params.get("borough") as FilterState["borough"]) ?? "all",
  });

  const filtered = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    const rows = propertyLeads.filter((p) => {
      if (q && ![p.address, p.neighborhood, p.borough, p.ownerLabel, p.propertyType, p.identifiedReason]
        .join(" ").toLowerCase().includes(q)) return false;
      if (filters.borough !== "all" && p.borough !== filters.borough) return false;
      if (filters.neighborhood !== "all" && p.neighborhood !== filters.neighborhood) return false;
      if (filters.stage !== "all" && p.stage !== filters.stage) return false;
      if (!matchesBand(p.score.score, filters.band)) return false;
      if (filters.extra !== "all" && p.propertyType !== filters.extra) return false;
      if (filters.discovered !== "all") {
        const d = daysAgo(p.dateDiscovered) ?? 999;
        if (d > Number(filters.discovered)) return false;
      }
      return true;
    });

    return rows.sort((a, b) => {
      switch (filters.sort) {
        case "value":
          return b.estimatedValueHigh - a.estimatedValueHigh;
        case "recent":
          return b.dateDiscovered.localeCompare(a.dateDiscovered);
        case "followup":
          return (a.followUpDate ?? "9999").localeCompare(b.followUpDate ?? "9999");
        default:
          return b.score.score - a.score.score;
      }
    });
  }, [propertyLeads, filters]);

  const hot = filtered.filter((p) => p.score.score >= 85).length;
  const value = filtered.reduce((s, p) => s + (p.estimatedValueLow + p.estimatedValueHigh) / 2, 0);
  const exterior = filtered.filter((p) => p.exteriorOpportunity).length;
  const portfolio = filtered.filter(
    (p) => p.ownerType === "Landlord" || p.ownerType === "Management Company",
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Property leads"
        title="Painting opportunities across the five boroughs"
        description="Every property here surfaced because of a detected timing signal — a sale, a permit, a listing, a turnover or an aging exterior. Each is scored 0–100 and comes with the reasoning behind the score."
        actions={
          <Badge tone="warning" dot>
            Synthetic demo records
          </Badge>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile label="Properties shown" value={String(filtered.length)} sub={`of ${propertyLeads.length} tracked`} />
        <StatTile label="Hot opportunities" value={String(hot)} sub="Scoring 85 or above" />
        <StatTile label="Est. project value" value={currency(value, true)} sub="Midpoint of estimate ranges" />
        <StatTile label="Portfolio owners" value={String(portfolio)} sub="Landlords & management companies" />
      </div>

      <FilterBar
        value={filters}
        onChange={setFilters}
        extraLabel="Property types"
        extraOptions={PROPERTY_TYPES}
        resultCount={filtered.length}
        totalCount={propertyLeads.length}
        sortOptions={[
          { value: "score", label: "Opportunity score" },
          { value: "value", label: "Estimated value" },
          { value: "recent", label: "Recently discovered" },
          { value: "followup", label: "Follow-up date" },
        ]}
      />

      <Card className="overflow-hidden">
        <CardHeader
          title="Property opportunities"
          subtitle={`${exterior} of these carry an exterior scope`}
          icon={<Home className="size-4.5" />}
          action={
            <span className="hidden items-center gap-1.5 text-[12px] text-subtle sm:inline-flex">
              <Download className="size-3.5" /> Export disabled in demo
            </span>
          }
        />
        <PropertyTable leads={filtered} />
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <InfoTile
          icon={<Flame className="size-4" />}
          title="What makes a property hot"
          body="A recent purchase inside 60 days, an open renovation permit, or a listing about to go live. All three mean somebody is actively deciding about paint right now."
        />
        <InfoTile
          icon={<PaintBucket className="size-4" />}
          title="Interior vs exterior"
          body="Interior work runs year-round and turns fast. Exterior work is seasonal and larger — the system flags exterior scopes so they can be booked while the weather window is open."
        />
        <InfoTile
          icon={<Building className="size-4" />}
          title="Owner type matters"
          body="An individual owner is one job. An LLC or management company behind several buildings is a relationship — those leads are routed to the partnership pipeline instead."
        />
      </div>
    </div>
  );
}

function InfoTile({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="card p-4">
      <span className="flex size-8 items-center justify-center rounded-lg bg-brand-soft text-brand">
        {icon}
      </span>
      <p className="mt-3 text-[13.5px] font-semibold text-fg">{title}</p>
      <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">{body}</p>
    </div>
  );
}

export default function PropertyLeadsPage() {
  return (
    <Suspense fallback={null}>
      <PropertyLeadsInner />
    </Suspense>
  );
}
