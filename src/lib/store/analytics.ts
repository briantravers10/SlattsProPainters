import type {
  BusinessLead,
  Customer,
  Lead,
  LeadStage,
  PropertyLead,
} from "@/lib/types";
import { BOROUGHS, LEAD_STAGES } from "@/lib/types";
import { daysAgo, isDueWithin } from "@/lib/utils";

/** Derived metrics used by the dashboard. Pure functions over the data layer. */

export function pipelineValueOf(leads: Lead[]) {
  return leads.reduce(
    (sum, l) =>
      sum +
      (l.kind === "property"
        ? (l.estimatedValueLow + l.estimatedValueHigh) / 2
        : l.estimatedAnnualOpportunity),
    0,
  );
}

export interface DashboardStats {
  totalLeads: number;
  avgScore: number;
  hotLeads: number;
  newThisWeek: number;
  pipelineValue: number;
  hotProperties: number;
  newPropertyManagers: number;
  realtorOpportunities: number;
  contractorOpportunities: number;
  dueFollowUps: number;
  reactivationCandidates: number;
  byBorough: { borough: string; properties: number; businesses: number; value: number }[];
  bySource: { source: string; count: number }[];
  byCategory: { category: string; count: number; value: number }[];
  byStage: { stage: LeadStage; count: number }[];
  byScoreBand: { band: string; count: number }[];
  weeklyDiscovery: { day: string; properties: number; businesses: number }[];
}

export function computeDashboard(
  propertyLeads: PropertyLead[],
  businessLeads: BusinessLead[],
  customers: Customer[],
): DashboardStats {
  const all: Lead[] = [...propertyLeads, ...businessLeads];

  const byBorough = BOROUGHS.map((borough) => {
    const props = propertyLeads.filter((p) => p.borough === borough);
    const biz = businessLeads.filter((b) => b.borough === borough);
    return {
      borough,
      properties: props.length,
      businesses: biz.length,
      value: pipelineValueOf([...props, ...biz]),
    };
  });

  const sourceCounts = new Map<string, number>();
  for (const l of all) {
    const key = l.sourceIntegration.replace(/\s*\(demo feed\)|\s*\(demo\)/i, "");
    sourceCounts.set(key, (sourceCounts.get(key) ?? 0) + 1);
  }

  const categoryCounts = new Map<string, { count: number; value: number }>();
  for (const b of businessLeads) {
    const cur = categoryCounts.get(b.category) ?? { count: 0, value: 0 };
    categoryCounts.set(b.category, {
      count: cur.count + 1,
      value: cur.value + b.estimatedAnnualOpportunity,
    });
  }

  const bands = ["Extremely High Opportunity", "High Opportunity", "Medium Opportunity", "Low Priority"];

  const weekDays = Array.from({ length: 7 }, (_, i) => 6 - i);
  const weeklyDiscovery = weekDays.map((offset) => {
    const label = new Date(Date.now() - offset * 86_400_000).toLocaleDateString("en-US", {
      weekday: "short",
    });
    return {
      day: label,
      properties: propertyLeads.filter((p) => daysAgo(p.dateDiscovered) === offset).length,
      businesses: businessLeads.filter((b) => daysAgo(b.dateDiscovered) === offset).length,
    };
  });

  return {
    totalLeads: all.length,
    avgScore: all.length ? Math.round(all.reduce((s, l) => s + l.score.score, 0) / all.length) : 0,
    hotLeads: all.filter((l) => l.score.score >= 85).length,
    newThisWeek: all.filter((l) => (daysAgo(l.dateDiscovered) ?? 999) <= 7).length,
    pipelineValue: pipelineValueOf(all),
    hotProperties: propertyLeads.filter((p) => p.score.score >= 85).length,
    newPropertyManagers: businessLeads.filter(
      (b) => b.group === "Property Managers" && (daysAgo(b.dateDiscovered) ?? 999) <= 14,
    ).length,
    realtorOpportunities: businessLeads.filter((b) => b.group === "Realtors").length,
    contractorOpportunities: businessLeads.filter((b) => b.group === "Contractors").length,
    dueFollowUps: all.filter((l) => l.followUpDate && isDueWithin(l.followUpDate, 0)).length,
    reactivationCandidates: customers.filter((c) => c.reactivationDue).length,
    byBorough,
    bySource: [...sourceCounts.entries()]
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count),
    byCategory: [...categoryCounts.entries()]
      .map(([category, v]) => ({ category, ...v }))
      .sort((a, b) => b.count - a.count),
    byStage: LEAD_STAGES.map((stage) => ({
      stage,
      count: all.filter((l) => l.stage === stage).length,
    })),
    byScoreBand: bands.map((band) => ({
      band,
      count: all.filter((l) => l.score.band === band).length,
    })),
    weeklyDiscovery,
  };
}
