"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Handshake, Repeat, Users, Briefcase } from "lucide-react";
import { Badge, Card, CardHeader, PageHeader } from "@/components/ui";
import { StatTile } from "@/components/leads/StatCard";
import { BusinessTable } from "@/components/leads/LeadTables";
import { DEFAULT_FILTERS, FilterBar, matchesBand, type FilterState } from "@/components/leads/Filters";
import { useData } from "@/lib/store/DataProvider";
import { BUSINESS_CATEGORIES } from "@/lib/types";
import type { PartnerGroup } from "@/lib/types";
import { currency, daysAgo, cn } from "@/lib/utils";

const GROUPS: (PartnerGroup | "All")[] = [
  "All",
  "Property Managers",
  "Realtors",
  "Contractors",
  "Other Partners",
];

function PartnershipLeadsInner() {
  const { businessLeads } = useData();
  const params = useSearchParams();
  const [group, setGroup] = useState<PartnerGroup | "All">(
    (params.get("group") as PartnerGroup) ?? "All",
  );
  const [filters, setFilters] = useState<FilterState>({ ...DEFAULT_FILTERS });

  const filtered = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    const rows = businessLeads.filter((b) => {
      if (group !== "All" && b.group !== group) return false;
      if (q && ![b.businessName, b.category, b.neighborhood, b.borough, b.contactPerson ?? ""]
        .join(" ").toLowerCase().includes(q)) return false;
      if (filters.borough !== "all" && b.borough !== filters.borough) return false;
      if (filters.neighborhood !== "all" && b.neighborhood !== filters.neighborhood) return false;
      if (filters.zips.length > 0 && !filters.zips.includes(b.zip)) return false;
      if (filters.stage !== "all" && b.stage !== filters.stage) return false;
      if (!matchesBand(b.score.score, filters.band)) return false;
      if (filters.extra !== "all" && b.category !== filters.extra) return false;
      if (filters.discovered !== "all") {
        const d = daysAgo(b.dateDiscovered) ?? 999;
        if (d > Number(filters.discovered)) return false;
      }
      return true;
    });

    return rows.sort((a, b) => {
      switch (filters.sort) {
        case "value":
          return b.estimatedAnnualOpportunity - a.estimatedAnnualOpportunity;
        case "recent":
          return b.dateDiscovered.localeCompare(a.dateDiscovered);
        case "followup":
          return (a.followUpDate ?? "9999").localeCompare(b.followUpDate ?? "9999");
        default:
          return b.score.score - a.score.score;
      }
    });
  }, [businessLeads, filters, group]);

  const annual = filtered.reduce((s, b) => s + b.estimatedAnnualOpportunity, 0);
  const jobs = filtered.reduce((s, b) => s + b.potentialJobsPerYear, 0);
  const named = filtered.filter((b) => b.contactPerson).length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Partnership leads"
        title="Relationships that produce recurring work"
        description="This is a completely separate pipeline from property leads. One signed vendor agreement with a management company or a busy general contractor can outperform dozens of individual homeowner leads — so these are scored on recurring revenue, not single-project value."
        actions={<Badge tone="warning" dot>Synthetic demo records</Badge>}
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile label="Organisations shown" value={String(filtered.length)} sub={`of ${businessLeads.length} tracked`} />
        <StatTile label="Annual opportunity" value={currency(annual, true)} sub="Estimated recurring value" />
        <StatTile label="Jobs per year" value={String(jobs)} sub="Combined potential volume" />
        <StatTile label="Named contacts" value={`${named}/${filtered.length}`} sub="Publicly listed decision-makers" />
      </div>

      {/* Group tabs */}
      <div className="flex gap-1 overflow-x-auto no-scrollbar rounded-xl border border-border bg-surface p-1">
        {GROUPS.map((g) => {
          const count = g === "All" ? businessLeads.length : businessLeads.filter((b) => b.group === g).length;
          return (
            <button
              key={g}
              onClick={() => setGroup(g)}
              className={cn(
                "flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
                group === g ? "bg-brand-soft text-brand" : "text-muted hover:bg-surface-2 hover:text-fg",
              )}
            >
              {g}
              <span className="ml-1.5 text-[11.5px] text-subtle">{count}</span>
            </button>
          );
        })}
      </div>

      <FilterBar
        value={filters}
        onChange={setFilters}
        extraLabel="Categories"
        extraOptions={BUSINESS_CATEGORIES}
        resultCount={filtered.length}
        totalCount={businessLeads.length}
        sortOptions={[
          { value: "score", label: "Partnership score" },
          { value: "value", label: "Annual opportunity" },
          { value: "recent", label: "Recently discovered" },
          { value: "followup", label: "Follow-up date" },
        ]}
      />

      <Card className="overflow-hidden">
        <CardHeader
          title="Partnership opportunities"
          subtitle="Ranked by recurring-revenue potential"
          icon={<Handshake className="size-4.5" />}
        />
        <BusinessTable leads={filtered} />
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <InfoTile
          icon={<Repeat className="size-4" />}
          title="Why B2B compounds"
          body="A homeowner repaints every 5–8 years. A management company turns units every month. The economics of one relationship dwarf the economics of one job."
        />
        <InfoTile
          icon={<Users className="size-4" />}
          title="Different compliance rules"
          body="Business contact details published by a company for business purposes sit in a different position from a private homeowner's number. The system keeps the two pipelines and their rules apart."
        />
        <InfoTile
          icon={<Briefcase className="size-4" />}
          title="Get on the approved list"
          body="For contractors and managing agents the real goal isn't one job — it's being added to the approved-vendor list, which pays out over years."
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

export default function PartnershipLeadsPage() {
  return (
    <Suspense fallback={null}>
      <PartnershipLeadsInner />
    </Suspense>
  );
}
