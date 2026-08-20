"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, Building2, Home, MapPin } from "lucide-react";
import type { BusinessLead, PropertyLead } from "@/lib/types";
import { ScorePill } from "@/components/ui/ScoreIndicators";
import { StageBadge } from "@/components/ui/StageBadge";
import { Badge, EmptyState } from "@/components/ui";
import { complianceSummary } from "@/lib/compliance";
import { currency, formatDate, isOverdue, relativeDate, cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Property table                                                      */
/* ------------------------------------------------------------------ */

export function PropertyTable({ leads }: { leads: PropertyLead[] }) {
  if (!leads.length) {
    return (
      <EmptyState
        icon={<Home className="size-5" />}
        title="No property leads match these filters"
        description="Try clearing a filter, or ask the AI Manager to run a new research sweep for this territory."
      />
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[820px] border-collapse text-left">
          <thead>
            <tr className="border-b border-border">
              {["Property", "Type & owner", "Trigger", "Est. project", "Score", "Stage", "Follow-up"].map(
                (h) => (
                  <th
                    key={h}
                    className="whitespace-nowrap px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.07em] text-subtle"
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => {
              const comp = complianceSummary(lead);
              return (
                <tr
                  key={lead.id}
                  className="group border-b border-border/70 transition-colors last:border-0 hover:bg-surface-2"
                >
                  <td className="px-4 py-3">
                    <Link href={`/property-leads/${lead.id}`} className="block">
                      <span className="flex items-center gap-1.5 text-[13.5px] font-medium text-fg group-hover:text-brand">
                        {lead.address}
                        {comp.doNotContact && (
                          <AlertTriangle className="size-3.5 shrink-0 text-rose-500" />
                        )}
                      </span>
                      <span className="mt-0.5 flex items-center gap-1 text-[12px] text-subtle">
                        <MapPin className="size-3" />
                        {lead.neighborhood}, {lead.borough}
                        <span className="font-mono">{lead.zip}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-[13px] text-fg">{lead.propertyType}</p>
                    <p className="mt-0.5 text-[12px] text-subtle">{lead.ownerType}</p>
                  </td>
                  <td className="max-w-[210px] px-4 py-3">
                    <Badge tone="brand">{lead.triggers[0]?.type ?? "—"}</Badge>
                    {lead.triggers.length > 1 && (
                      <span className="ml-1.5 text-[11.5px] text-subtle">
                        +{lead.triggers.length - 1}
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-[13px] tabular-nums text-fg">
                    {currency(lead.estimatedValueLow, true)}–{currency(lead.estimatedValueHigh, true)}
                  </td>
                  <td className="px-4 py-3">
                    <ScorePill score={lead.score.score} />
                  </td>
                  <td className="px-4 py-3">
                    <StageBadge stage={lead.stage} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span
                      className={cn(
                        "text-[12.5px]",
                        isOverdue(lead.followUpDate) ? "font-medium text-rose-600 dark:text-rose-400" : "text-muted",
                      )}
                    >
                      {lead.followUpDate ? relativeDate(lead.followUpDate) : "—"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="divide-y divide-border md:hidden">
        {leads.map((lead) => (
          <Link key={lead.id} href={`/property-leads/${lead.id}`} className="block p-4 active:bg-surface-2">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-[14px] font-medium text-fg">{lead.address}</p>
                <p className="mt-0.5 text-[12.5px] text-subtle">
                  {lead.neighborhood}, {lead.borough}
                </p>
              </div>
              <ScorePill score={lead.score.score} />
            </div>
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <StageBadge stage={lead.stage} />
              <Badge tone="brand">{lead.triggers[0]?.type ?? "—"}</Badge>
              <span className="text-[12px] tabular-nums text-muted">
                {currency(lead.estimatedValueLow, true)}–{currency(lead.estimatedValueHigh, true)}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Business table                                                      */
/* ------------------------------------------------------------------ */

export function BusinessTable({ leads }: { leads: BusinessLead[] }) {
  if (!leads.length) {
    return (
      <EmptyState
        icon={<Building2 className="size-5" />}
        title="No partnership leads match these filters"
        description="Try a different borough or category, or ask the AI Manager to research new organisations in this territory."
      />
    );
  }

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[850px] border-collapse text-left">
          <thead>
            <tr className="border-b border-border">
              {["Organisation", "Category", "Portfolio", "Annual opportunity", "Score", "Stage", "Next action"].map(
                (h) => (
                  <th
                    key={h}
                    className="whitespace-nowrap px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.07em] text-subtle"
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr
                key={lead.id}
                className="group border-b border-border/70 transition-colors last:border-0 hover:bg-surface-2"
              >
                <td className="px-4 py-3">
                  <Link href={`/partnership-leads/${lead.id}`} className="block">
                    <span className="text-[13.5px] font-medium text-fg group-hover:text-brand">
                      {lead.businessName}
                    </span>
                    <span className="mt-0.5 flex items-center gap-1 text-[12px] text-subtle">
                      <MapPin className="size-3" />
                      {lead.neighborhood}, {lead.borough}
                      <span className="font-mono">{lead.zip}</span>
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Badge tone="neutral">{lead.category}</Badge>
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <p className="text-[13px] tabular-nums text-fg">{lead.portfolioSize.toLocaleString()}</p>
                  <p className="mt-0.5 text-[11.5px] text-subtle">{lead.portfolioUnit}</p>
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <p className="text-[13px] font-medium tabular-nums text-fg">
                    {currency(lead.estimatedAnnualOpportunity, true)}
                  </p>
                  <p className="mt-0.5 text-[11.5px] text-subtle">~{lead.potentialJobsPerYear} jobs/yr</p>
                </td>
                <td className="px-4 py-3">
                  <ScorePill score={lead.score.score} />
                </td>
                <td className="px-4 py-3">
                  <StageBadge stage={lead.stage} />
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span
                    className={cn(
                      "text-[12.5px]",
                      isOverdue(lead.followUpDate) ? "font-medium text-rose-600 dark:text-rose-400" : "text-muted",
                    )}
                  >
                    {lead.followUpDate ? relativeDate(lead.followUpDate) : "—"}
                  </span>
                  {lead.lastContacted && (
                    <span className="mt-0.5 block text-[11.5px] text-subtle">
                      Last: {formatDate(lead.lastContacted)}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-border md:hidden">
        {leads.map((lead) => (
          <Link
            key={lead.id}
            href={`/partnership-leads/${lead.id}`}
            className="block p-4 active:bg-surface-2"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-[14px] font-medium text-fg">{lead.businessName}</p>
                <p className="mt-0.5 text-[12.5px] text-subtle">
                  {lead.category} · {lead.borough}
                </p>
              </div>
              <ScorePill score={lead.score.score} />
            </div>
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <StageBadge stage={lead.stage} />
              <span className="text-[12px] tabular-nums text-muted">
                {currency(lead.estimatedAnnualOpportunity, true)} / yr · ~{lead.potentialJobsPerYear} jobs
              </span>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}

/** Compact "top leads" list used on the dashboard and manager results. */
export function LeadMiniList({
  properties = [],
  businesses = [],
}: {
  properties?: PropertyLead[];
  businesses?: BusinessLead[];
}) {
  const rows = [
    ...properties.map((p) => ({
      id: p.id,
      href: `/property-leads/${p.id}`,
      title: p.address,
      sub: `${p.neighborhood}, ${p.borough} · ${p.triggers[0]?.type ?? ""}`,
      score: p.score.score,
      value: `${currency(p.estimatedValueLow, true)}–${currency(p.estimatedValueHigh, true)}`,
      icon: Home,
    })),
    ...businesses.map((b) => ({
      id: b.id,
      href: `/partnership-leads/${b.id}`,
      title: b.businessName,
      sub: `${b.category} · ${b.borough}`,
      score: b.score.score,
      value: `${currency(b.estimatedAnnualOpportunity, true)} / yr`,
      icon: Building2,
    })),
  ];

  if (!rows.length) {
    return <EmptyState title="Nothing to show yet" description="Results will appear here." />;
  }

  return (
    <ul className="divide-y divide-border">
      {rows.map((r) => {
        const Icon = r.icon;
        return (
          <li key={r.id}>
            <Link
              href={r.href}
              className="group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-surface-2"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-subtle">
                <Icon className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13.5px] font-medium text-fg group-hover:text-brand">
                  {r.title}
                </span>
                <span className="block truncate text-[12px] text-subtle">{r.sub}</span>
              </span>
              <span className="hidden whitespace-nowrap text-[12.5px] tabular-nums text-muted sm:block">
                {r.value}
              </span>
              <ScorePill score={r.score} />
              <ArrowRight className="size-3.5 shrink-0 text-subtle opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
