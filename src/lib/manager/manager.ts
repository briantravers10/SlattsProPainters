import type { DemoDatabase } from "@/lib/data";
import { generatePropertyLeads } from "@/lib/data/property-leads";
import { discoverBusinessLeads } from "@/lib/data/business-leads";
import type { BusinessLead, Lead, PropertyLead } from "@/lib/types";
import { currency, daysAgo, isDueWithin } from "@/lib/utils";
import { complianceSummary, evaluateChannels } from "@/lib/compliance";
import { AGENT_BY_ID, type AgentId } from "./agents";
import { parseIntent, type ParsedIntent } from "./intents";
import type { AgentStep, ManagerResponse } from "./types";

/**
 * The AI Manager.
 *
 * Responsibilities:
 *  - interpret a natural-language command from the owner
 *  - decide which specialist workers to run
 *  - execute the query against the data layer
 *  - return a clean, human-readable summary
 *
 * The owner never has to address a worker directly. In production the
 * `runManagerCommand` body would dispatch to real agents; the response shape
 * stays identical.
 */

let counter = 0;
/** Keeps generated ids unique across repeated discovery sweeps. */
let discoveryOffset = 500;

/** Hard cap on how many leads a single simulated sweep will produce. */
const MAX_DISCOVERY = 60;

function step(agentId: AgentId, action: string, detail: string, ms: number): AgentStep {
  return { agentId, agentName: AGENT_BY_ID[agentId].name, action, detail, ms };
}

function pipelineValue(leads: Lead[]) {
  return leads.reduce(
    (sum, l) =>
      sum +
      (l.kind === "property"
        ? (l.estimatedValueLow + l.estimatedValueHigh) / 2
        : l.estimatedAnnualOpportunity),
    0,
  );
}

function applyCommonFilters<T extends Lead>(leads: T[], intent: ParsedIntent): T[] {
  let out = leads;
  if (intent.boroughs.length) out = out.filter((l) => intent.boroughs.includes(l.borough));
  if (intent.neighborhoods.length) {
    out = out.filter((l) => intent.neighborhoods.includes(l.neighborhood));
  }
  if (intent.minScore !== undefined) out = out.filter((l) => l.score.score >= intent.minScore!);
  if (intent.timeframe) {
    const window = intent.timeframe === "today" ? 1 : intent.timeframe === "week" ? 7 : 30;
    out = out.filter((l) => (daysAgo(l.dateDiscovered) ?? 999) <= window);
  }
  return out;
}

export function runManagerCommand(raw: string, db: DemoDatabase): ManagerResponse {
  const intent = parseIntent(raw);
  const id = `M-${++counter}-${intent.kind}`;

  switch (intent.kind) {
    case "find-properties":
      return findProperties(id, intent, db);
    case "find-businesses":
      return findBusinesses(id, intent, db);
    case "top-opportunities":
      return topOpportunities(id, intent, db);
    case "follow-ups":
      return followUps(id, intent, db);
    case "reactivate-customers":
      return reactivate(id, intent, db);
    case "pipeline-summary":
      return pipelineSummary(id, intent, db);
    case "borough-summary":
      return boroughSummary(id, intent, db);
    case "compliance-review":
      return complianceReview(id, intent, db);
    default:
      return help(id, intent);
  }
}

/* ------------------------------------------------------------------ */

function scopeLabel(intent: ParsedIntent) {
  if (intent.neighborhoods.length) return intent.neighborhoods.join(", ");
  if (intent.boroughs.length === 1) return intent.boroughs[0];
  if (intent.boroughs.length > 1) return intent.boroughs.join(", ");
  return "all five boroughs";
}

function findProperties(id: string, intent: ParsedIntent, db: DemoDatabase): ManagerResponse {
  let results = applyCommonFilters(db.propertyLeads, intent);

  if (intent.triggers.length) {
    results = results.filter((p) =>
      p.triggers.some((t) => intent.triggers.includes(t.type)),
    );
  }

  // If the owner asked for more than the current dataset holds, run a
  // simulated discovery sweep. This is what "continuously researching the
  // market" looks like from the owner's seat — the Manager goes and finds
  // more rather than reporting an empty result.
  const target = intent.explicitLimit ? intent.limit : results.length < 6 ? 12 : results.length;
  const gap = target - results.length;
  let discovered: PropertyLead[] = [];
  if (gap > 0) {
    discoveryOffset += MAX_DISCOVERY;
    discovered = generatePropertyLeads(
      Math.floor(Math.random() * 1_000_000),
      Math.min(gap, MAX_DISCOVERY),
      {
        boroughs: intent.boroughs.length ? intent.boroughs : undefined,
        triggerTypes: intent.triggers.length ? intent.triggers : undefined,
        minScore: intent.minScore,
        idOffset: discoveryOffset,
        idPrefix: "PD",
        discoveredToday: true,
      },
    );
    results = [...results, ...discovered];
  }

  results = [...results].sort((a, b) => b.score.score - a.score.score);
  const capped = results.slice(0, intent.limit);

  const hot = capped.filter((p) => p.score.score >= 85).length;
  const blocked = capped.filter((p) => complianceSummary(p).blocked > 0).length;
  const value = pipelineValue(capped);

  const steps: AgentStep[] = [
    step("property-research", "Sweeping the property universe", `Scanned ${db.propertyLeads.length} tracked properties across ${scopeLabel(intent)}`, 620),
    ...(discovered.length
      ? [
          step(
            "property-research",
            "Running a new research sweep",
            `Existing coverage was thin — discovered ${discovered.length} additional properties in ${scopeLabel(intent)} and added them to the pipeline`,
            900,
          ),
        ]
      : []),
    step("permit-trigger-research", "Checking timing signals", intent.triggers.length ? `Filtering for: ${intent.triggers.join(", ")}` : "Evaluating sale, permit, listing and turnover triggers", 540),
    step("lead-scoring", "Scoring and ranking", `Ranked ${results.length} matching properties by Painting Opportunity Score`, 460),
    step("compliance", "Gating outreach channels", blocked > 0 ? `${blocked} of ${capped.length} results have at least one blocked channel` : "All results have at least one cleared channel", 380),
  ];

  const shortfall = intent.limit > results.length;

  return {
    id,
    discovered: { properties: discovered, businesses: [] },
    intent,
    headline: `${capped.length} propert${capped.length === 1 ? "y" : "ies"} matched in ${scopeLabel(intent)}`,
    summary: buildPropertySummary(capped, intent, hot, value, shortfall, results.length),
    steps,
    metrics: [
      { label: "Properties returned", value: String(capped.length), sub: discovered.length ? `${discovered.length} newly discovered` : `of ${results.length} matching` },
      { label: "Hot (85+)", value: String(hot) },
      { label: "Avg score", value: capped.length ? String(Math.round(capped.reduce((s, p) => s + p.score.score, 0) / capped.length)) : "—" },
      { label: "Est. pipeline value", value: currency(value, true) },
    ],
    properties: capped,
    businesses: [],
    customers: [],
    recommendations: propertyRecommendations(capped),
    complianceNote:
      blocked > 0
        ? `${blocked} of these leads have at least one blocked channel. Discovering a property record is not permission to call, text or email the owner — open any lead to see exactly which channels the Compliance Agent has cleared.`
        : undefined,
    suggestions: [
      `Show me the highest-value opportunities in ${intent.boroughs[0] ?? "Brooklyn"}.`,
      "Show me every prospect that needs a follow-up today.",
      `Find property managers in ${intent.boroughs[0] ?? "Queens"} that could provide recurring painting work.`,
    ],
    resultLabel: "Property opportunities",
  };
}

function buildPropertySummary(
  results: PropertyLead[],
  intent: ParsedIntent,
  hot: number,
  value: number,
  shortfall: boolean,
  total: number,
): string {
  if (results.length === 0) {
    return `No properties in the demo dataset match that request. Try widening the borough, lowering the score threshold, or removing the trigger filter.`;
  }
  const topBorough = mostCommon(results.map((r) => r.borough));
  const topTrigger = mostCommon(results.flatMap((r) => r.triggers.map((t) => t.type)));
  const channel = mostCommon(results.flatMap((r) => r.recommendedChannels));

  const parts = [
    `Found ${total} matching propert${total === 1 ? "y" : "ies"} in ${scopeLabel(intent)}${
      shortfall ? " — everything currently in the dataset" : ""
    }.`,
    `${hot} score 85 or above and should be worked first. The most common driver is **${topTrigger}**, and the strongest concentration is in **${topBorough}**.`,
    `The recommended lead channel across this set is **${channel}**, with an estimated combined project value of ${currency(value)}.`,
  ];
  return parts.join(" ");
}

function propertyRecommendations(results: PropertyLead[]): string[] {
  if (!results.length) return [];
  const out: string[] = [];
  const newOwners = results.filter((p) => p.triggers.some((t) => t.type === "Recent Purchase"));
  const permits = results.filter((p) => p.permitSignals.length > 0);
  const exterior = results.filter((p) => p.exteriorOpportunity && p.score.score >= 75);
  const portfolio = results.filter((p) => p.ownerType === "Landlord" || p.ownerType === "Management Company");

  if (newOwners.length)
    out.push(`Queue the new-homeowner direct mail piece for ${newOwners.length} recently purchased propert${newOwners.length === 1 ? "y" : "ies"} — this is the highest-converting play in the set.`);
  if (permits.length)
    out.push(`${permits.length} propert${permits.length === 1 ? "y has" : "ies have"} an active permit filing. Approach the contractor of record as a painting subcontractor rather than contacting the owner.`);
  if (exterior.length)
    out.push(`${exterior.length} high-scoring propert${exterior.length === 1 ? "y is" : "ies are"} flagged for exterior work — schedule these while the weather window is open.`);
  if (portfolio.length)
    out.push(`${portfolio.length} are owned by landlords or management companies. Route these to the partnership pipeline instead of one-off outreach.`);
  return out.slice(0, 4);
}

/* ------------------------------------------------------------------ */

function findBusinesses(id: string, intent: ParsedIntent, db: DemoDatabase): ManagerResponse {
  let results = applyCommonFilters(db.businessLeads, intent);
  if (intent.categories.length) {
    results = results.filter((b) => intent.categories.includes(b.category));
  }
  const bizTarget = intent.explicitLimit ? intent.limit : results.length < 5 ? 10 : results.length;
  const gap = bizTarget - results.length;
  let discovered: BusinessLead[] = [];
  if (gap > 0) {
    discoveryOffset += MAX_DISCOVERY;
    discovered = discoverBusinessLeads(
      Math.floor(Math.random() * 1_000_000),
      Math.min(gap, MAX_DISCOVERY),
      {
        boroughs: intent.boroughs.length ? intent.boroughs : undefined,
        categories: intent.categories.length ? intent.categories : undefined,
        idOffset: discoveryOffset,
        discoveredToday: true,
      },
    );
    if (intent.minScore !== undefined) {
      discovered = discovered.filter((b) => b.score.score >= intent.minScore!);
    }
    results = [...results, ...discovered];
  }

  results = [...results].sort((a, b) => b.score.score - a.score.score);
  const capped = results.slice(0, intent.limit);

  const annual = capped.reduce((s, b) => s + b.estimatedAnnualOpportunity, 0);
  const jobs = capped.reduce((s, b) => s + b.potentialJobsPerYear, 0);
  const withContact = capped.filter((b) => b.contactPerson).length;

  const researchAgent: AgentId = intent.categories.some((c) => c.includes("Realtor") || c.includes("Brokerage"))
    ? "realtor-research"
    : intent.categories.some((c) => c.includes("Management") || c === "Landlord" || c === "Building Manager")
      ? "property-manager-research"
      : "business-research";

  const steps: AgentStep[] = [
    step("business-research", "Scanning the partnership universe", `Reviewed ${db.businessLeads.length} organisations across ${scopeLabel(intent)}`, 580),
    ...(discovered.length
      ? [
          step(
            researchAgent,
            "Running a new research sweep",
            `Discovered ${discovered.length} additional organisations in ${scopeLabel(intent)} and added them to the partnership pipeline`,
            880,
          ),
        ]
      : []),
    step(researchAgent, "Sizing the recurring opportunity", `Estimated portfolio size and annual job volume for ${results.length} organisations`, 620),
    step("lead-scoring", "Ranking by Partnership Score", "Weighted for recurring revenue rather than single-project value", 420),
    step("compliance", "Applying B2B contact rules", `${withContact} of ${capped.length} have a publicly listed decision-maker`, 340),
  ];

  return {
    id,
    intent,
    discovered: { properties: [], businesses: discovered },
    headline: `${capped.length} partnership target${capped.length === 1 ? "" : "s"} in ${scopeLabel(intent)}`,
    summary:
      capped.length === 0
        ? "No organisations in the demo dataset match that request. Try a different borough or a broader category."
        : `Found ${results.length} matching organisation${results.length === 1 ? "" : "s"} in ${scopeLabel(intent)}. Together they represent roughly **${jobs} painting jobs a year** and an estimated **${currency(annual)}** of annual recurring opportunity. ${withContact} have a publicly listed decision-maker, which is the shortest path to a first conversation. The top-ranked relationship is **${capped[0].businessName}** (${capped[0].category}, score ${capped[0].score.score}).`,
    steps,
    metrics: [
      { label: "Organisations", value: String(capped.length), sub: `of ${results.length} matching` },
      { label: "Est. jobs / yr", value: String(jobs) },
      { label: "Annual opportunity", value: currency(annual, true) },
      { label: "Named contacts", value: `${withContact}/${capped.length}` },
    ],
    properties: [],
    businesses: capped,
    customers: [],
    recommendations: businessRecommendations(capped),
    complianceNote:
      "These are publicly listed business contact details. B2B outreach rules differ from consumer rules — but commercial email, calling-time and opt-out obligations still apply and should be reviewed before any campaign is enabled.",
    suggestions: [
      "Find general contractors in Manhattan that may need a painting subcontractor.",
      "Show me every prospect that needs a follow-up today.",
      "Break down my pipeline by borough.",
    ],
    resultLabel: "Partnership opportunities",
  };
}

function businessRecommendations(results: BusinessLead[]): string[] {
  if (!results.length) return [];
  const out: string[] = [];
  const top = results.slice(0, 3);
  out.push(`Start with ${top.map((b) => b.businessName).join(", ")} — the highest recurring-revenue potential in this set.`);
  const noContact = results.filter((b) => !b.contactPerson);
  if (noContact.length)
    out.push(`${noContact.length} organisation${noContact.length === 1 ? " has" : "s have"} no named decision-maker yet. The Business Research Agent should identify one before outreach.`);
  const untouched = results.filter((b) => !b.lastContacted);
  if (untouched.length)
    out.push(`${untouched.length} have never been contacted — the fastest available pipeline growth in this list.`);
  const group = mostCommon(results.map((b) => b.group));
  out.push(`Most of this set are ${group}. One signed vendor agreement here typically outperforms dozens of individual homeowner leads.`);
  return out.slice(0, 4);
}

/* ------------------------------------------------------------------ */

function topOpportunities(id: string, intent: ParsedIntent, db: DemoDatabase): ManagerResponse {
  const window = intent.timeframe === "today" ? 1 : intent.timeframe === "month" ? 30 : 7;
  const withinWindow = (l: Lead) => (daysAgo(l.dateDiscovered) ?? 999) <= window;

  let props = db.propertyLeads.filter(withinWindow);
  let biz = db.businessLeads.filter(withinWindow);
  if (intent.boroughs.length) {
    props = props.filter((p) => intent.boroughs.includes(p.borough));
    biz = biz.filter((b) => intent.boroughs.includes(b.borough));
  }

  const topProps = [...props]
    .sort((a, b) => (b.estimatedValueLow + b.estimatedValueHigh) - (a.estimatedValueLow + a.estimatedValueHigh))
    .slice(0, Math.min(intent.limit, 12));
  const topBiz = [...biz]
    .sort((a, b) => b.estimatedAnnualOpportunity - a.estimatedAnnualOpportunity)
    .slice(0, Math.min(intent.limit, 8));

  const propValue = pipelineValue(topProps);
  const bizValue = topBiz.reduce((s, b) => s + b.estimatedAnnualOpportunity, 0);

  return {
    id,
    intent,
    headline: `Highest-value opportunities from the last ${window} day${window === 1 ? "" : "s"}`,
    summary: `Across ${props.length} new propert${props.length === 1 ? "y" : "ies"} and ${biz.length} new partnership target${biz.length === 1 ? "" : "s"} discovered in the last ${window} days, the ${topProps.length} largest property projects carry an estimated ${currency(propValue)} of work, and the ${topBiz.length} largest partnerships represent ${currency(bizValue)} of annual recurring opportunity. Partnerships are ranked on annual value, properties on single-project value — they are not directly comparable, so both lists are shown.`,
    steps: [
      step("property-research", "Pulling recent discoveries", `${props.length} properties added in the window`, 500),
      step("business-research", "Pulling recent partnership targets", `${biz.length} organisations added in the window`, 470),
      step("lead-scoring", "Ranking by estimated value", "Property projects ranked on job value; partnerships on annual recurring value", 430),
    ],
    metrics: [
      { label: "New properties", value: String(props.length) },
      { label: "New partners", value: String(biz.length) },
      { label: "Top project value", value: currency(propValue, true) },
      { label: "Top partner value / yr", value: currency(bizValue, true) },
    ],
    properties: topProps,
    businesses: topBiz,
    customers: [],
    recommendations: [
      topProps.length
        ? `The single largest project is ${topProps[0].address} (${topProps[0].neighborhood}) at up to ${currency(topProps[0].estimatedValueHigh)}.`
        : "No new properties in this window.",
      topBiz.length
        ? `The single largest partnership is ${topBiz[0].businessName} at ${currency(topBiz[0].estimatedAnnualOpportunity)} a year.`
        : "No new partnership targets in this window.",
      "Work the partnership list first — it compounds. Work the property list second — it pays now.",
    ],
    suggestions: [
      "Show me every prospect that needs a follow-up today.",
      "Break down my pipeline by borough.",
      "Which previous customers are worth reactivating?",
    ],
    resultLabel: "Highest-value opportunities",
  };
}

/* ------------------------------------------------------------------ */

function followUps(id: string, intent: ParsedIntent, db: DemoDatabase): ManagerResponse {
  const horizon = intent.timeframe === "week" ? 7 : intent.timeframe === "month" ? 30 : 0;
  const due = (l: Lead) => l.followUpDate && isDueWithin(l.followUpDate, horizon);

  let props = db.propertyLeads.filter(due);
  let biz = db.businessLeads.filter(due);
  if (intent.boroughs.length) {
    props = props.filter((p) => intent.boroughs.includes(p.borough));
    biz = biz.filter((b) => intent.boroughs.includes(b.borough));
  }

  const overdueCount = [...props, ...biz].filter((l) => (daysAgo(l.followUpDate) ?? -1) > 0).length;
  const total = props.length + biz.length;

  return {
    id,
    intent,
    headline: `${total} prospect${total === 1 ? "" : "s"} due for follow-up${horizon ? ` in the next ${horizon} days` : " today or overdue"}`,
    summary:
      total === 0
        ? "Nothing is due right now. The Follow-Up Agent will surface the next batch as dates come around."
        : `${overdueCount} of these are already overdue and should be handled first. The list splits into ${props.length} propert${props.length === 1 ? "y" : "ies"} and ${biz.length} partnership contact${biz.length === 1 ? "" : "s"}. Working this list daily is the single highest-leverage habit in the system — most pipeline is lost to silence rather than rejection.`,
    steps: [
      step("follow-up", "Checking scheduled touches", `${total} prospects due${overdueCount ? `, ${overdueCount} overdue` : ""}`, 420),
      step("compliance", "Re-checking channel permissions", "Permissions are re-evaluated at the moment of contact, not at discovery", 320),
    ],
    metrics: [
      { label: "Due now", value: String(total) },
      { label: "Overdue", value: String(overdueCount) },
      { label: "Properties", value: String(props.length) },
      { label: "Partners", value: String(biz.length) },
    ],
    properties: [...props].sort((a, b) => (a.followUpDate ?? "").localeCompare(b.followUpDate ?? "")),
    businesses: [...biz].sort((a, b) => (a.followUpDate ?? "").localeCompare(b.followUpDate ?? "")),
    customers: [],
    recommendations: [
      overdueCount ? `Clear the ${overdueCount} overdue item${overdueCount === 1 ? "" : "s"} before adding anything new to the pipeline.` : "Nothing is overdue — the pipeline is current.",
      "Partnership follow-ups are worth more per minute than property follow-ups; do those first.",
      "Anything with no response after three touches should be moved to a long-cycle nurture rather than left in the daily list.",
    ],
    suggestions: [
      "Show me the highest-value opportunities discovered this week.",
      "Which previous customers are worth reactivating?",
      "Find recently purchased properties in Staten Island.",
    ],
    resultLabel: "Due for follow-up",
  };
}

/* ------------------------------------------------------------------ */

function reactivate(id: string, intent: ParsedIntent, db: DemoDatabase): ManagerResponse {
  let customers = db.customers.filter((c) => c.reactivationDue);
  if (intent.boroughs.length) customers = customers.filter((c) => intent.boroughs.includes(c.borough));
  customers = [...customers].sort((a, b) => (a.reactivationDue ?? "").localeCompare(b.reactivationDue ?? ""));

  const value = customers.reduce((s, c) => s + c.jobValue, 0);
  const referrals = db.customers.reduce((s, c) => s + c.referralsGenerated, 0);
  const neighbors = db.customers.reduce((s, c) => s + c.neighborLeadsGenerated, 0);

  return {
    id,
    intent,
    headline: `${customers.length} previous customer${customers.length === 1 ? "" : "s"} worth reactivating`,
    summary:
      customers.length === 0
        ? "No customers are inside a reactivation window right now."
        : `These customers have already bought once, already consented to contact, and already know the crew — which makes them the cheapest revenue in the system. Their original jobs totalled ${currency(value)}. Across the whole customer base the flywheel has produced ${referrals} referrals and ${neighbors} neighbor leads from completed work.`,
    steps: [
      step("follow-up", "Scanning completed jobs", `${db.customers.length} customers reviewed for repaint-cycle timing`, 480),
      step("compliance", "Confirming consent is still valid", "Customers hold documented consent from their signed work agreement", 300),
    ],
    metrics: [
      { label: "Reactivation candidates", value: String(customers.length) },
      { label: "Original job value", value: currency(value, true) },
      { label: "Referrals generated", value: String(referrals) },
      { label: "Neighbor leads", value: String(neighbors) },
    ],
    properties: [],
    businesses: [],
    customers,
    recommendations: [
      "Lead with the specific reason for the call — the deferred scope or the repaint cycle — not a generic check-in.",
      "Every reactivation call is also a referral opportunity; ask for one introduction on each.",
      "Pair reactivation with a neighbor drop on the same block to reuse the trip.",
    ],
    suggestions: [
      "Show me every prospect that needs a follow-up today.",
      "Break down my pipeline by borough.",
      "Find me 100 high-potential residential painting opportunities in Brooklyn.",
    ],
    resultLabel: "Reactivation candidates",
  };
}

/* ------------------------------------------------------------------ */

function pipelineSummary(id: string, intent: ParsedIntent, db: DemoDatabase): ManagerResponse {
  const all: Lead[] = [...db.propertyLeads, ...db.businessLeads];
  const hot = all.filter((l) => l.score.score >= 85).length;
  const avg = Math.round(all.reduce((s, l) => s + l.score.score, 0) / all.length);
  const value = pipelineValue(all);
  const won = all.filter((l) => l.stage === "Won").length;
  const active = all.filter((l) => l.stage !== "Won" && l.stage !== "Lost").length;
  const newThisWeek = all.filter((l) => (daysAgo(l.dateDiscovered) ?? 999) <= 7).length;

  return {
    id,
    intent,
    headline: "Pipeline overview",
    summary: `The pipeline currently holds ${all.length} leads — ${db.propertyLeads.length} properties and ${db.businessLeads.length} partnership targets — with an average score of ${avg}. ${hot} are hot (85+), ${active} are active, and ${newThisWeek} were discovered in the last 7 days. Estimated total pipeline value is ${currency(value)}, combining single-project property value with annual partnership value.`,
    steps: [
      step("property-research", "Counting property pipeline", `${db.propertyLeads.length} properties`, 340),
      step("business-research", "Counting partnership pipeline", `${db.businessLeads.length} organisations`, 320),
      step("lead-scoring", "Recomputing aggregate scores", `Average score ${avg}`, 300),
    ],
    metrics: [
      { label: "Total leads", value: String(all.length) },
      { label: "Hot leads", value: String(hot) },
      { label: "Avg score", value: String(avg) },
      { label: "Pipeline value", value: currency(value, true) },
    ],
    properties: [...db.propertyLeads].sort((a, b) => b.score.score - a.score.score).slice(0, 6),
    businesses: [...db.businessLeads].sort((a, b) => b.score.score - a.score.score).slice(0, 6),
    customers: [],
    recommendations: [
      `${won} deals are marked Won in the demo dataset. Each of those should be entering the customer flywheel — photos, review, referral, neighbor campaign.`,
      "Property leads pay once; partnership leads pay repeatedly. Keep both moving in parallel.",
      "Anything sitting in Discovered for more than two weeks should either be researched or dropped.",
    ],
    suggestions: [
      "Break down my pipeline by borough.",
      "Show me the highest-value opportunities discovered this week.",
      "Show me every prospect that needs a follow-up today.",
    ],
    resultLabel: "Top of the pipeline",
  };
}

/* ------------------------------------------------------------------ */

function boroughSummary(id: string, intent: ParsedIntent, db: DemoDatabase): ManagerResponse {
  const all: Lead[] = [...db.propertyLeads, ...db.businessLeads];
  const byBorough = new Map<string, Lead[]>();
  for (const l of all) {
    byBorough.set(l.borough, [...(byBorough.get(l.borough) ?? []), l]);
  }
  const rows = [...byBorough.entries()]
    .map(([borough, leads]) => ({
      borough,
      count: leads.length,
      avg: Math.round(leads.reduce((s, l) => s + l.score.score, 0) / leads.length),
      value: pipelineValue(leads),
      hot: leads.filter((l) => l.score.score >= 85).length,
    }))
    .sort((a, b) => b.value - a.value);

  const best = rows[0];

  return {
    id,
    intent,
    headline: "Pipeline by borough",
    summary: `**${best.borough}** carries the most pipeline value at ${currency(best.value)} across ${best.count} leads (${best.hot} hot, average score ${best.avg}). ${rows
      .slice(1)
      .map((r) => `${r.borough}: ${r.count} leads, ${currency(r.value, true)}`)
      .join(" · ")}. Concentrating crew routes in one or two boroughs reduces travel time and makes neighbor campaigns dramatically more effective.`,
    steps: [
      step("property-research", "Grouping by territory", `${all.length} leads assigned to boroughs`, 380),
      step("lead-scoring", "Computing territory averages", "Weighted by estimated project and partnership value", 320),
    ],
    metrics: rows.slice(0, 4).map((r) => ({
      label: r.borough,
      value: String(r.count),
      sub: `${currency(r.value, true)} · avg ${r.avg}`,
    })),
    properties: db.propertyLeads
      .filter((p) => p.borough === best.borough)
      .sort((a, b) => b.score.score - a.score.score)
      .slice(0, 6),
    businesses: db.businessLeads
      .filter((b) => b.borough === best.borough)
      .sort((a, b) => b.score.score - a.score.score)
      .slice(0, 4),
    customers: [],
    recommendations: [
      `Focus this week's effort on ${best.borough} — it has both the most value and the most hot leads.`,
      `The thinnest territory is ${rows[rows.length - 1].borough} with ${rows[rows.length - 1].count} leads; expand research there if crews have spare capacity.`,
      "Route planning matters more than lead count — five jobs on one block beats fifteen spread across three boroughs.",
    ],
    suggestions: [
      `Find me 100 high-potential residential painting opportunities in ${best.borough}.`,
      "Show me the highest-value opportunities discovered this week.",
      "Which previous customers are worth reactivating?",
    ],
    resultLabel: `Top leads in ${best.borough}`,
  };
}

/* ------------------------------------------------------------------ */

function complianceReview(id: string, intent: ParsedIntent, db: DemoDatabase): ManagerResponse {
  const all: Lead[] = [...db.propertyLeads, ...db.businessLeads];
  const dnc = all.filter((l) => l.permissions.doNotContact);
  const noPhone = all.filter((l) => l.permissions.phone === "Unknown" || l.permissions.phone === "DNC");
  const noSms = all.filter((l) => l.permissions.sms !== "Consented");
  const mailable = all.filter((l) => l.permissions.directMail === "Eligible" && !l.permissions.doNotContact);

  const flagged = [...dnc, ...noPhone.slice(0, 12)];
  const props = flagged.filter((l): l is PropertyLead => l.kind === "property").slice(0, 12);
  const biz = flagged.filter((l): l is BusinessLead => l.kind === "business").slice(0, 8);

  return {
    id,
    intent,
    headline: "Contact permission review",
    summary: `Of ${all.length} leads, **${dnc.length}** are flagged do-not-contact and are blocked from every direct channel. **${noPhone.length}** have no established basis for a phone call, and **${noSms.length}** cannot be texted because no written consent is on file. **${mailable.length}** are currently eligible for direct mail, which is why mail is the default first channel for property-record leads. Finding a property record tells you a property exists — it never tells you that you may call, text or email whoever owns it.`,
    steps: [
      step("compliance", "Evaluating every lead and channel", `${all.length} leads × 11 channels evaluated`, 560),
      step("compliance", "Applying suppression and DNC state", `${dnc.length} leads fully blocked`, 380),
    ],
    metrics: [
      { label: "Do not contact", value: String(dnc.length) },
      { label: "No phone basis", value: String(noPhone.length) },
      { label: "No SMS consent", value: String(noSms.length) },
      { label: "Mail eligible", value: String(mailable.length) },
    ],
    properties: props,
    businesses: biz,
    customers: [],
    recommendations: [
      "Route property-record leads to direct mail and audience advertising by default — neither requires personal contact permission.",
      "Capture consent language, timestamp and page version on every website lead form; that record is what makes phone and SMS defensible later.",
      "Treat B2B and consumer outreach as separate systems with separate rules, not as one list with a filter.",
    ],
    complianceNote:
      "This demo does not provide legal advice. These are configurable safeguards that must be reviewed against applicable federal, New York State and NYC requirements before any real outreach is enabled.",
    suggestions: [
      "Show me every prospect that needs a follow-up today.",
      "Break down my pipeline by borough.",
      "Find property managers in Queens that could provide recurring painting work.",
    ],
    resultLabel: "Leads with contact restrictions",
  };
}

/* ------------------------------------------------------------------ */

function help(id: string, intent: ParsedIntent): ManagerResponse {
  return {
    id,
    intent,
    headline: "What the Manager can do",
    summary:
      "Ask in plain English. The Manager decides which specialist workers to run, executes the search across the demo dataset, and returns a ranked, explained answer. In this demo build nothing is ever sent — the Outreach Agent only prepares and queues campaigns for human approval.",
    steps: [],
    metrics: [],
    properties: [],
    businesses: [],
    customers: [],
    recommendations: [
      "Find me 100 high-potential residential painting opportunities in Brooklyn.",
      "Find property managers in Queens that could provide recurring painting work.",
      "Find recently purchased properties in Staten Island.",
      "Show me the highest-value opportunities discovered this week.",
      "Find general contractors in Manhattan that may need a painting subcontractor.",
      "Show me every prospect that needs a follow-up today.",
    ],
    suggestions: [],
    resultLabel: "",
  };
}

/* ------------------------------------------------------------------ */

function mostCommon<T extends string>(items: T[]): T | "—" {
  if (!items.length) return "—";
  const counts = new Map<T, number>();
  for (const i of items) counts.set(i, (counts.get(i) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

export { evaluateChannels };
export type { ManagerResponse, AgentStep, ManagerMetric } from "./types";
