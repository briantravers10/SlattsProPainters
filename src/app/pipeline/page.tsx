"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, GripVertical, KanbanSquare, List, Home, Building2 } from "lucide-react";
import { Badge, Card, CardHeader, PageHeader } from "@/components/ui";
import { STAGE_ACCENT } from "@/components/ui/StageBadge";
import { ScorePill } from "@/components/ui/ScoreIndicators";
import { DEFAULT_FILTERS, FilterBar, matchesBand, type FilterState } from "@/components/leads/Filters";
import { PropertyTable, BusinessTable } from "@/components/leads/LeadTables";
import { useData } from "@/lib/store/DataProvider";
import { LEAD_STAGES } from "@/lib/types";
import type { Lead, LeadStage } from "@/lib/types";
import { currency, daysAgo, cn, isOverdue, relativeDate } from "@/lib/utils";

export default function PipelinePage() {
  const { propertyLeads, businessLeads, moveStage } = useData();
  const [filters, setFilters] = useState<FilterState>({ ...DEFAULT_FILTERS });
  const [type, setType] = useState<"all" | "property" | "business">("all");
  const [view, setView] = useState<"board" | "list">("board");
  const [dragId, setDragId] = useState<string | null>(null);

  const all: Lead[] = useMemo(() => {
    const base: Lead[] =
      type === "property" ? propertyLeads : type === "business" ? businessLeads : [...propertyLeads, ...businessLeads];
    const q = filters.q.trim().toLowerCase();

    return base.filter((l) => {
      const haystack =
        l.kind === "property"
          ? `${l.address} ${l.neighborhood} ${l.borough} ${l.ownerLabel}`
          : `${l.businessName} ${l.category} ${l.neighborhood} ${l.borough}`;
      if (q && !haystack.toLowerCase().includes(q)) return false;
      if (filters.borough !== "all" && l.borough !== filters.borough) return false;
      if (filters.neighborhood !== "all" && l.neighborhood !== filters.neighborhood) return false;
      if (filters.zips.length > 0 && !filters.zips.includes(l.zip)) return false;
      if (filters.stage !== "all" && l.stage !== filters.stage) return false;
      if (!matchesBand(l.score.score, filters.band)) return false;
      if (filters.extra !== "all") {
        const opp = l.kind === "property"
          ? [l.interiorOpportunity ? "Interior" : null, l.exteriorOpportunity ? "Exterior" : null].filter(Boolean)
          : [l.group];
        if (!opp.includes(filters.extra)) return false;
      }
      if (filters.discovered !== "all") {
        const d = daysAgo(l.dateDiscovered) ?? 999;
        if (d > Number(filters.discovered)) return false;
      }
      return true;
    });
  }, [propertyLeads, businessLeads, filters, type]);

  const byStage = useMemo(() => {
    const map = new Map<LeadStage, Lead[]>();
    for (const s of LEAD_STAGES) map.set(s, []);
    for (const l of all) map.get(l.stage)?.push(l);
    for (const [, arr] of map) arr.sort((a, b) => b.score.score - a.score.score);
    return map;
  }, [all]);

  const value = (leads: Lead[]) =>
    leads.reduce(
      (s, l) => s + (l.kind === "property" ? (l.estimatedValueLow + l.estimatedValueHigh) / 2 : l.estimatedAnnualOpportunity),
      0,
    );

  const move = (lead: Lead, dir: -1 | 1) => {
    const idx = LEAD_STAGES.indexOf(lead.stage);
    const next = LEAD_STAGES[idx + dir];
    if (next) moveStage(lead.id, next);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Lead pipeline"
        title="Every opportunity, end to end"
        description="Both pipelines in one place. Drag a card between stages, or use the arrows — the change is recorded on the lead's timeline exactly as it would be in production."
        actions={
          <div className="flex rounded-[10px] border border-border bg-surface p-0.5">
            <button
              onClick={() => setView("board")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors",
                view === "board" ? "bg-brand-soft text-brand" : "text-muted hover:text-fg",
              )}
            >
              <KanbanSquare className="size-4" /> Board
            </button>
            <button
              onClick={() => setView("list")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors",
                view === "list" ? "bg-brand-soft text-brand" : "text-muted hover:text-fg",
              )}
            >
              <List className="size-4" /> List
            </button>
          </div>
        }
      />

      <div className="flex gap-1 overflow-x-auto no-scrollbar rounded-xl border border-border bg-surface p-1">
        {([
          { id: "all", label: "All leads", count: propertyLeads.length + businessLeads.length },
          { id: "property", label: "Property", count: propertyLeads.length },
          { id: "business", label: "Partnership", count: businessLeads.length },
        ] as const).map((t) => (
          <button
            key={t.id}
            onClick={() => setType(t.id)}
            className={cn(
              "flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
              type === t.id ? "bg-brand-soft text-brand" : "text-muted hover:bg-surface-2 hover:text-fg",
            )}
          >
            {t.label}
            <span className="ml-1.5 text-[11.5px] text-subtle">{t.count}</span>
          </button>
        ))}
      </div>

      <FilterBar
        value={filters}
        onChange={setFilters}
        extraLabel="Opportunity types"
        extraOptions={
          type === "business"
            ? ["Property Managers", "Realtors", "Contractors", "Other Partners"]
            : ["Interior", "Exterior"]
        }
        resultCount={all.length}
        totalCount={propertyLeads.length + businessLeads.length}
        sortOptions={[{ value: "score", label: "Opportunity score" }]}
      />

      {view === "board" ? (
        <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="flex min-w-max gap-3">
            {LEAD_STAGES.map((stage) => {
              const leads = byStage.get(stage) ?? [];
              return (
                <div
                  key={stage}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (dragId) moveStage(dragId, stage);
                    setDragId(null);
                  }}
                  className="flex w-[268px] shrink-0 flex-col rounded-2xl border border-border bg-surface-2/50"
                >
                  <div className="flex items-center gap-2 border-b border-border px-3.5 py-3">
                    <span className="size-2 rounded-full" style={{ background: STAGE_ACCENT[stage] }} />
                    <p className="flex-1 truncate text-[13px] font-semibold text-fg">{stage}</p>
                    <Badge tone="muted">{leads.length}</Badge>
                  </div>
                  <div className="border-b border-border px-3.5 py-2">
                    <p className="text-[11.5px] tabular-nums text-subtle">
                      {currency(value(leads), true)} pipeline value
                    </p>
                  </div>
                  <div className="flex max-h-[560px] flex-1 flex-col gap-2 overflow-y-auto p-2.5">
                    {leads.length === 0 && (
                      <p className="px-2 py-6 text-center text-[12px] text-subtle">No leads</p>
                    )}
                    {leads.map((lead) => (
                      <PipelineCard
                        key={lead.id}
                        lead={lead}
                        onDragStart={() => setDragId(lead.id)}
                        onMove={(d) => move(lead, d)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {type !== "business" && (
            <Card className="overflow-hidden">
              <CardHeader title="Property leads" subtitle={`${all.filter((l) => l.kind === "property").length} shown`} />
              <PropertyTable leads={all.filter((l) => l.kind === "property") as never} />
            </Card>
          )}
          {type !== "property" && (
            <Card className="overflow-hidden">
              <CardHeader title="Partnership leads" subtitle={`${all.filter((l) => l.kind === "business").length} shown`} />
              <BusinessTable leads={all.filter((l) => l.kind === "business") as never} />
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function PipelineCard({
  lead,
  onDragStart,
  onMove,
}: {
  lead: Lead;
  onDragStart: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const href = lead.kind === "property" ? `/property-leads/${lead.id}` : `/partnership-leads/${lead.id}`;
  const title = lead.kind === "property" ? lead.address : lead.businessName;
  const sub =
    lead.kind === "property"
      ? `${lead.neighborhood}, ${lead.borough}`
      : `${lead.category} · ${lead.borough}`;
  const val =
    lead.kind === "property"
      ? `${currency(lead.estimatedValueLow, true)}–${currency(lead.estimatedValueHigh, true)}`
      : `${currency(lead.estimatedAnnualOpportunity, true)}/yr`;

  const idx = LEAD_STAGES.indexOf(lead.stage);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="group card cursor-grab p-3 transition-shadow hover:shadow-md active:cursor-grabbing"
    >
      <div className="flex items-start gap-2">
        <GripVertical className="mt-0.5 size-3.5 shrink-0 text-subtle opacity-0 transition-opacity group-hover:opacity-100" />
        <Link href={href} className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium text-fg hover:text-brand">{title}</p>
          <p className="mt-0.5 truncate text-[11.5px] text-subtle">{sub}</p>
        </Link>
        <ScorePill score={lead.score.score} />
      </div>
      <div className="mt-2.5 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[11.5px] tabular-nums text-muted">
          {lead.kind === "property" ? <Home className="size-3" /> : <Building2 className="size-3" />}
          {val}
        </span>
        <div className="flex gap-0.5">
          <button
            onClick={() => onMove(-1)}
            disabled={idx === 0}
            className="flex size-6 items-center justify-center rounded-md text-subtle transition-colors hover:bg-surface-2 hover:text-fg disabled:opacity-30"
            aria-label="Move back a stage"
          >
            <ChevronLeft className="size-3.5" />
          </button>
          <button
            onClick={() => onMove(1)}
            disabled={idx === LEAD_STAGES.length - 1}
            className="flex size-6 items-center justify-center rounded-md text-subtle transition-colors hover:bg-surface-2 hover:text-fg disabled:opacity-30"
            aria-label="Move forward a stage"
          >
            <ChevronRight className="size-3.5" />
          </button>
        </div>
      </div>
      {lead.followUpDate && (
        <p
          className={cn(
            "mt-2 border-t border-border pt-2 text-[11.5px]",
            isOverdue(lead.followUpDate) ? "font-medium text-rose-600 dark:text-rose-400" : "text-subtle",
          )}
        >
          Follow-up {relativeDate(lead.followUpDate)}
        </p>
      )}
    </div>
  );
}
