import { createRng, type Rng } from "@/lib/rng";
import { NEIGHBORHOODS, type NeighborhoodDef } from "@/lib/geo/nyc";
import { recommendChannels, scoreProperty } from "@/lib/scoring";
import type { PropertyScoreInput } from "@/lib/scoring";
import { defaultPropertyRecordPermissions } from "@/lib/compliance";
import { screenLead } from "@/lib/compliance/screening";
import type {
  ActivityEvent,
  Borough,
  ContactPermissions,
  LeadStage,
  OwnerType,
  PropertyLead,
  PropertyType,
  Trigger,
  TriggerType,
} from "@/lib/types";
import { daysFromToday } from "@/lib/utils";
import { demoToday } from "@/lib/config";
import {
  DEMO_FIRST_NAMES,
  DEMO_STREETS,
  DEMO_SURNAMES,
  LLC_PREFIXES,
  LLC_SUFFIXES,
  NOTE_SNIPPETS,
  PM_NAMES,
} from "./names";

const PROPERTY_TYPES_BY_STOCK: Record<NeighborhoodDef["stock"], PropertyType[]> = {
  brownstone: ["Brownstone", "Townhouse", "Two-Family", "Small Multifamily"],
  detached: ["Single-Family", "Two-Family", "Townhouse"],
  highrise: ["Condo", "Co-op", "Mixed-Use", "Commercial"],
  mixed: ["Condo", "Two-Family", "Small Multifamily", "Mixed-Use"],
  rowhouse: ["Townhouse", "Two-Family", "Small Multifamily", "Single-Family"],
};

const SOURCE_INTEGRATIONS = [
  "NYC Public Property Records (demo feed)",
  "NYC DOB Permit Data (demo feed)",
  "Property Transaction Data (demo feed)",
  "Listing Data — licensed feed (demo)",
  "Referral — existing customer (demo)",
  "Website Lead Form (demo)",
];

const PERMIT_DESCRIPTIONS = [
  "DOB Alt-2 filing — interior partition and finish work",
  "DOB Alt-1 filing — change of occupancy, full gut renovation",
  "Plumbing permit — bathroom reconfiguration",
  "Facade repair filing under local law inspection cycle",
  "Boiler replacement permit with associated interior work",
  "Electrical permit — full unit rewire",
  "Sidewalk shed permit — exterior work in progress",
  "Roof replacement permit filed",
];

/** Build a synthetic address that is clearly not a real NYC address. */
function makeAddress(rng: Rng, unitLikely: boolean) {
  const num = rng.int(12, 1480);
  const street = rng.pick(DEMO_STREETS);
  const unit = unitLikely && rng.bool(0.5) ? `, Unit ${rng.int(1, 12)}${rng.pick(["A", "B", "C", "D", "R", "F"])}` : "";
  return `${num} ${street}${unit}`;
}

function makeOwner(rng: Rng, ownerType: OwnerType) {
  switch (ownerType) {
    case "Individual":
      return `${rng.pick(DEMO_FIRST_NAMES)} ${rng.pick(DEMO_SURNAMES)} (synthetic)`;
    case "LLC":
      return `${rng.pick(LLC_PREFIXES)} ${rng.pick(LLC_SUFFIXES)}`;
    case "Landlord":
      return `${rng.pick(DEMO_SURNAMES)} Family Holdings`;
    case "Management Company":
      return rng.pick(PM_NAMES);
  }
}

interface TriggerPlan {
  types: TriggerType[];
  bias: "hot" | "warm" | "cool";
}

/** Distribution of trigger combinations across the demo dataset. */
const TRIGGER_PLANS: TriggerPlan[] = [
  { types: ["Recent Purchase", "New Ownership", "Higher-Value Property"], bias: "hot" },
  { types: ["Recent Purchase", "Renovation Activity", "Building Permit"], bias: "hot" },
  { types: ["Renovation Activity", "Building Permit", "Exterior Condition"], bias: "hot" },
  { types: ["Recently Listed", "Older Property", "Exterior Condition"], bias: "hot" },
  { types: ["Rental Turnover", "Multi-Property Landlord"], bias: "warm" },
  { types: ["Recent Sale", "New Ownership"], bias: "warm" },
  { types: ["Multi-Property Landlord", "Older Property", "Exterior Condition"], bias: "warm" },
  { types: ["Recently Renovated", "Higher-Value Property"], bias: "warm" },
  { types: ["Older Property", "Exterior Condition"], bias: "warm" },
  { types: ["Building Permit"], bias: "warm" },
  { types: ["Older Property"], bias: "cool" },
  { types: ["Higher-Value Property"], bias: "cool" },
  { types: ["Recently Renovated"], bias: "cool" },
];

function buildTriggers(rng: Rng, plan: TriggerPlan, ctx: {
  yearBuilt: number;
  lastSaleDaysAgo?: number;
  unitCount: number;
  exteriorConditionYears: number;
  estimatedValue: number;
}): Trigger[] {
  const strengthFor = () =>
    plan.bias === "hot" ? rng.float(0.78, 1) : plan.bias === "warm" ? rng.float(0.5, 0.8) : rng.float(0.25, 0.5);

  return plan.types.map((type): Trigger => {
    const strength = strengthFor();
    switch (type) {
      case "Recent Purchase":
        return {
          type,
          detail: `Purchased ${ctx.lastSaleDaysAgo ?? 30} days ago — new owners typically repaint within the first 90 days`,
          daysAgo: ctx.lastSaleDaysAgo,
          strength: Math.max(strength, ctx.lastSaleDaysAgo && ctx.lastSaleDaysAgo < 45 ? 0.95 : 0.6),
        };
      case "New Ownership":
        return { type, detail: "Ownership record changed in the last two quarters", daysAgo: ctx.lastSaleDaysAgo, strength };
      case "Recent Sale":
        return { type, detail: `Deed recorded ${ctx.lastSaleDaysAgo ?? 90} days ago`, daysAgo: ctx.lastSaleDaysAgo, strength };
      case "Recently Listed":
        return { type, detail: `Listed for sale ${rng.int(4, 40)} days ago — sellers frequently refresh before showings`, strength };
      case "Older Property":
        return { type, detail: `Built in ${ctx.yearBuilt} — original plaster, trim and exterior surfaces`, strength };
      case "Renovation Activity":
        return { type, detail: rng.pick(PERMIT_DESCRIPTIONS), daysAgo: rng.int(5, 120), strength };
      case "Building Permit":
        return { type, detail: rng.pick(PERMIT_DESCRIPTIONS), daysAgo: rng.int(3, 180), strength };
      case "Rental Turnover":
        return { type, detail: `${rng.int(2, Math.max(2, ctx.unitCount))} unit turnovers recorded in the last 12 months`, strength };
      case "Multi-Property Landlord":
        return { type, detail: `Owner entity is associated with ${rng.int(3, 22)} properties across the borough`, strength };
      case "Higher-Value Property":
        return { type, detail: `Estimated value of $${ctx.estimatedValue.toLocaleString()} supports a larger project budget`, strength };
      case "Recently Renovated":
        return { type, detail: "Renovation completed recently — finish work often follows", daysAgo: rng.int(30, 260), strength };
      case "Exterior Condition":
        return {
          type,
          detail: `No exterior painting work appears in permit history for ~${ctx.exteriorConditionYears} years`,
          strength,
        };
    }
  });
}

function stageForScore(rng: Rng, score: number): LeadStage {
  if (score >= 88) {
    return rng.weighted<LeadStage>([
      ["Ready for Outreach", 4], ["Contacted", 3], ["Qualified", 3],
      ["Estimate Requested", 2], ["Estimate Sent", 2], ["Follow-Up", 2], ["Won", 1],
    ]);
  }
  if (score >= 75) {
    return rng.weighted<LeadStage>([
      ["Qualified", 4], ["Researching", 3], ["Ready for Outreach", 3],
      ["Contacted", 2], ["Follow-Up", 2], ["Estimate Sent", 1], ["Won", 1],
    ]);
  }
  if (score >= 60) {
    return rng.weighted<LeadStage>([
      ["Discovered", 4], ["Researching", 4], ["Qualified", 2], ["Contacted", 1], ["Lost", 1],
    ]);
  }
  return rng.weighted<LeadStage>([["Discovered", 6], ["Researching", 2], ["Lost", 2]]);
}

function permissionsFor(rng: Rng, ownerType: OwnerType, sourceIntegration: string): ContactPermissions {
  const base = defaultPropertyRecordPermissions();

  if (sourceIntegration.startsWith("Website Lead Form")) {
    return {
      ...base,
      source: "Lead Form",
      phone: "Consented",
      sms: rng.bool(0.6) ? "Consented" : "Not Consented",
      email: "Eligible",
      door: "Eligible",
      consentDate: daysFromToday(-rng.int(2, 60)),
      consentSource: "Website estimate request form (demo)",
    };
  }
  if (sourceIntegration.startsWith("Referral")) {
    return {
      ...base,
      source: "Referral",
      phone: "Cleared",
      email: "Eligible",
      door: "Eligible",
      consentDate: daysFromToday(-rng.int(3, 90)),
      consentSource: "Referred by prior customer (demo)",
    };
  }
  if (ownerType === "Management Company" || ownerType === "LLC") {
    return {
      ...base,
      source: "Public Business Information",
      email: "Eligible",
      phone: rng.bool(0.5) ? "Cleared" : "Unknown",
      door: "Eligible",
    };
  }

  // Pure property-record leads: discovery is not consent.
  return propertyRecordPermissions(rng);
}

function propertyRecordPermissions(rng: Rng): ContactPermissions {
  const base = defaultPropertyRecordPermissions();
  const phone = rng.weighted<ContactPermissions["phone"]>([
    ["Unknown", 6], ["Cleared", 2], ["DNC", 2],
  ]);
  return {
    ...base,
    phone,
    email: rng.weighted<ContactPermissions["email"]>([["Unknown", 7], ["Eligible", 2], ["Suppressed", 1]]),
    door: rng.weighted<ContactPermissions["door"]>([["Unknown", 5], ["Eligible", 4], ["Restricted", 2]]),
    directMail: rng.bool(0.94) ? "Eligible" : "Restricted",
    doNotContact: rng.bool(0.05),
  };
}

function buildTimeline(rng: Rng, lead: Omit<PropertyLead, "timeline">): ActivityEvent[] {
  const events: ActivityEvent[] = [
    {
      id: `${lead.id}-t1`,
      date: lead.dateDiscovered,
      kind: "discovered",
      title: "Property surfaced by the Property Research Agent",
      detail: `Source: ${lead.sourceIntegration}`,
      actor: "Property Research Agent",
    },
    {
      id: `${lead.id}-t2`,
      date: lead.dateDiscovered,
      kind: "research",
      title: `${lead.triggers.length} trigger${lead.triggers.length === 1 ? "" : "s"} detected`,
      detail: lead.triggers.map((t) => t.type).join(" · "),
      actor: "Permit / Trigger Research Agent",
    },
    {
      id: `${lead.id}-t3`,
      date: lead.dateDiscovered,
      kind: "score",
      title: `Painting Opportunity Score: ${lead.score.score}/100`,
      detail: lead.score.band,
      actor: lead.score.engine,
    },
    {
      id: `${lead.id}-t4`,
      date: lead.dateDiscovered,
      kind: "compliance",
      title: "Contact permissions evaluated",
      detail: lead.permissions.doNotContact
        ? "Flagged DO NOT CONTACT — all direct outreach blocked"
        : `Source: ${lead.permissions.source} · phone ${lead.permissions.phone} · email ${lead.permissions.email}`,
      actor: "Compliance Agent",
    },
  ];

  const stageIndex = [
    "Discovered", "Researching", "Qualified", "Ready for Outreach", "Contacted",
    "Follow-Up", "Estimate Requested", "Estimate Sent", "Won", "Lost",
  ].indexOf(lead.stage);

  if (stageIndex >= 2) {
    events.push({
      id: `${lead.id}-t5`,
      date: daysFromToday(-rng.int(1, 12)),
      kind: "stage",
      title: `Moved to ${lead.stage}`,
      detail: "Stage advanced during weekly pipeline review",
      actor: "Demo User",
    });
  }
  if (stageIndex >= 4 && stageIndex <= 7) {
    events.push({
      id: `${lead.id}-t6`,
      date: daysFromToday(-rng.int(1, 10)),
      kind: "outreach",
      title: `Simulated outreach queued — ${lead.recommendedChannels[0]}`,
      detail: "DEMO MODE: nothing was actually sent.",
      actor: "Outreach Agent (simulated)",
    });
  }
  return events.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export interface PropertyGenerationOptions {
  /** Restrict discovery to these boroughs. */
  boroughs?: Borough[];
  /** Restrict discovery to these ZIP codes. */
  zips?: string[];
  /** Only produce leads carrying at least one of these triggers. */
  triggerTypes?: TriggerType[];
  /** Only keep leads scoring at or above this threshold. */
  minScore?: number;
  /** Offset applied to generated ids so discovered leads never collide. */
  idOffset?: number;
  /** Prefix applied to generated ids. */
  idPrefix?: string;
  /** Label recorded on the discovery timeline entry. */
  discoveredToday?: boolean;
}

export function generatePropertyLeads(
  seed: number,
  count = 40,
  options: PropertyGenerationOptions = {},
): PropertyLead[] {
  const rng = createRng(seed);
  const leads: PropertyLead[] = [];
  const thisYear = demoToday().getFullYear();

  let pool = options.boroughs?.length
    ? NEIGHBORHOODS.filter((n) => options.boroughs!.includes(n.borough))
    : NEIGHBORHOODS;
  if (options.zips?.length) {
    pool = pool.filter((n) => n.zips.some((z) => options.zips!.includes(z)));
  }
  const neighborhoodPool = pool.length ? pool : NEIGHBORHOODS;

  const planPool = options.triggerTypes?.length
    ? TRIGGER_PLANS.filter((p) => p.types.some((t) => options.triggerTypes!.includes(t)))
    : TRIGGER_PLANS;
  const plans = planPool.length ? planPool : TRIGGER_PLANS;

  const idOffset = options.idOffset ?? 0;
  const idPrefix = options.idPrefix ?? "P";
  const maxAttempts = count * 12;

  for (let attempt = 0, i = 0; i < count && attempt < maxAttempts; attempt++) {
    // Spread evenly across boroughs, then across neighbourhoods.
    const nb = neighborhoodPool[(attempt * 7 + Math.floor(attempt / 5)) % neighborhoodPool.length];
    const plan = plans[attempt % plans.length];

    const propertyType = rng.pick(PROPERTY_TYPES_BY_STOCK[nb.stock]);
    const unitCount =
      propertyType === "Single-Family" ? 1
      : propertyType === "Two-Family" ? 2
      : propertyType === "Small Multifamily" ? rng.int(3, 8)
      : propertyType === "Mixed-Use" ? rng.int(4, 14)
      : propertyType === "Commercial" ? rng.int(1, 6)
      : 1;

    const ownerType: OwnerType =
      unitCount >= 6
        ? rng.weighted<OwnerType>([["LLC", 4], ["Management Company", 4], ["Landlord", 2]])
        : unitCount >= 3
          ? rng.weighted<OwnerType>([["Landlord", 4], ["LLC", 3], ["Individual", 3]])
          : rng.weighted<OwnerType>([["Individual", 7], ["LLC", 2], ["Landlord", 1]]);

    const yearBuilt =
      plan.types.includes("Older Property")
        ? rng.int(1899, 1962)
        : rng.int(1925, 2016);

    const squareFeet =
      propertyType === "Condo" || propertyType === "Co-op"
        ? rng.int(650, 2200)
        : unitCount > 2
          ? rng.int(2400, 9500)
          : rng.int(1100, 4200);

    const baseValue = 420_000 * nb.valueTier;
    const estimatedValue = Math.round(
      (baseValue + squareFeet * rng.float(180, 520) * nb.valueTier * 0.6) / 5000,
    ) * 5000;

    const hasSale = plan.types.some((t) =>
      ["Recent Purchase", "New Ownership", "Recent Sale"].includes(t),
    );
    const lastSaleDaysAgo = hasSale
      ? plan.bias === "hot" ? rng.int(6, 62) : rng.int(70, 320)
      : rng.int(700, 5200);
    const lastSaleDate = daysFromToday(-lastSaleDaysAgo);
    const lastSalePrice = Math.round((estimatedValue * rng.float(0.86, 1.02)) / 5000) * 5000;

    const exteriorConditionYears = rng.int(3, 22);
    const interiorOpportunity =
      propertyType === "Condo" || propertyType === "Co-op" ? true : rng.bool(0.85);
    const exteriorOpportunity =
      propertyType === "Condo" || propertyType === "Co-op" ? rng.bool(0.15) : rng.bool(0.8);

    const triggers = buildTriggers(rng, plan, {
      yearBuilt,
      lastSaleDaysAgo: hasSale ? lastSaleDaysAgo : undefined,
      unitCount,
      exteriorConditionYears,
      estimatedValue,
    });

    // Compare like with like: the "median" is a same-shape property in the same
    // neighborhood, not an average across every building type.
    const typicalSquareFeet =
      propertyType === "Condo" || propertyType === "Co-op"
        ? 1_200
        : unitCount > 2
          ? 5_000
          : 2_400;
    const neighborhoodMedianValue = Math.round(
      420_000 * nb.valueTier + typicalSquareFeet * 350 * nb.valueTier * 0.6,
    );

    const scoreInput: PropertyScoreInput = {
      triggers,
      yearBuilt,
      estimatedValue,
      neighborhoodMedianValue,
      lastSaleDate: hasSale ? lastSaleDate : undefined,
      ownerType,
      unitCount,
      exteriorConditionYears,
      interiorOpportunity,
      exteriorOpportunity,
    };

    const score = scoreProperty(scoreInput);
    const channels = recommendChannels(scoreInput, score.score);

    // Attribute the lead to the feed that produced its *leading* trigger, so
    // the stated source always matches the stated reason on the detail page.
    const primaryTrigger = triggers[0]?.type;
    const sourceIntegration =
      primaryTrigger === "Recent Purchase" ||
      primaryTrigger === "Recent Sale" ||
      primaryTrigger === "New Ownership"
        ? "Property Transaction Data (demo feed)"
        : primaryTrigger === "Building Permit" ||
            primaryTrigger === "Renovation Activity" ||
            primaryTrigger === "Recently Renovated"
          ? "NYC DOB Permit Data (demo feed)"
          : primaryTrigger === "Recently Listed"
            ? "Listing Data — licensed feed (demo)"
            : triggers.some((t) => t.type === "Building Permit" || t.type === "Renovation Activity")
              ? "NYC DOB Permit Data (demo feed)"
              : hasSale
                ? "Property Transaction Data (demo feed)"
                : rng.pick(SOURCE_INTEGRATIONS);

    const permissions =
      sourceIntegration.startsWith("Website Lead Form") || sourceIntegration.startsWith("Referral")
        ? permissionsFor(rng, ownerType, sourceIntegration)
        : ownerType === "Individual"
          ? propertyRecordPermissions(rng)
          : permissionsFor(rng, ownerType, sourceIntegration);

    const stage = stageForScore(rng, score.score);
    const dateDiscovered = options.discoveredToday
      ? daysFromToday(0)
      : daysFromToday(-rng.int(0, 46));

    const scopeParts: string[] = [];
    if (interiorOpportunity) scopeParts.push(unitCount > 2 ? "Interior common areas + unit turnovers" : "Full interior repaint");
    if (exteriorOpportunity) scopeParts.push(propertyType === "Brownstone" ? "Exterior trim, cornice and entry" : "Full exterior repaint");
    const estimatedProjectType = scopeParts.join(" + ") || "Interior refresh";

    const perUnitLow = 3_200 + squareFeet * 1.1;
    const scopeMult = (interiorOpportunity ? 1 : 0) + (exteriorOpportunity ? 0.85 : 0);
    const estimatedValueLow = Math.round((perUnitLow * Math.max(scopeMult, 0.6) * nb.valueTier * 0.85) / 100) * 100;
    const estimatedValueHigh = Math.round((estimatedValueLow * rng.float(1.6, 2.4)) / 100) * 100;

    const needsFollowUp = ["Contacted", "Follow-Up", "Estimate Sent", "Estimate Requested", "Qualified", "Ready for Outreach"].includes(stage);
    const followUpDate = needsFollowUp ? daysFromToday(rng.int(-6, 21)) : undefined;

    const base: Omit<PropertyLead, "timeline"> = {
      id: `${idPrefix}-${String(1000 + idOffset + i)}`,
      kind: "property",
      address: makeAddress(rng, propertyType === "Condo" || propertyType === "Co-op"),
      borough: nb.borough,
      neighborhood: nb.name,
      zip: rng.pick(
        options.zips?.length
          ? (nb.zips.filter((z) => options.zips!.includes(z)) ?? nb.zips)
          : nb.zips,
      ),
      lat: nb.lat + rng.float(-0.011, 0.011),
      lng: nb.lng + rng.float(-0.013, 0.013),
      propertyType,
      ownerType,
      ownerLabel: makeOwner(rng, ownerType),
      estimatedValue,
      lastSaleDate: hasSale || lastSaleDaysAgo < 4000 ? lastSaleDate : undefined,
      lastSalePrice: hasSale || lastSaleDaysAgo < 4000 ? lastSalePrice : undefined,
      yearBuilt,
      unitCount,
      squareFeet,
      permitSignals: triggers
        .filter((t) => t.type === "Building Permit" || t.type === "Renovation Activity")
        .map((t) => t.detail),
      interiorOpportunity,
      exteriorOpportunity,
      identifiedReason: identifiedReason(triggers, thisYear - yearBuilt),
      triggers,
      score,
      recommendedChannels: channels,
      estimatedProjectType,
      estimatedValueLow,
      estimatedValueHigh,
      stage,
      dateDiscovered,
      followUpDate,
      permissions,
      screening: screenLead(
        `${idPrefix}-${1000 + idOffset + i}`,
        false,
        permissions.source === "Lead Form" || permissions.source === "Referral",
      ),
      sourceIntegration,
      notes: rng.pick(NOTE_SNIPPETS),
    };

    if (options.minScore !== undefined && score.score < options.minScore) continue;

    leads.push({ ...base, timeline: buildTimeline(rng, base) });
    i++;
  }

  return leads;
}

function identifiedReason(triggers: Trigger[], age: number): string {
  const t = triggers[0];
  switch (t.type) {
    case "Recent Purchase":
      return `Recently purchased property — new ownership recorded ${t.daysAgo} days ago.`;
    case "Recently Listed":
      return "Property is actively listed for sale — pre-listing refresh window.";
    case "Renovation Activity":
    case "Building Permit":
      return "Active permit filing indicates renovation work is underway.";
    case "Rental Turnover":
      return "Repeated rental turnover indicates a recurring unit-repaint need.";
    case "Multi-Property Landlord":
      return "Owner entity controls multiple properties — portfolio-level opportunity.";
    case "Older Property":
      return `Aging building stock (${age} years) with no recent painting activity detected.`;
    case "Higher-Value Property":
      return "Higher-value property in a strong neighborhood — larger project budgets.";
    case "Recently Renovated":
      return "Renovation recently completed — finish and repaint work commonly follows.";
    case "Exterior Condition":
      return "No exterior painting activity detected in available records.";
    default:
      return "Property record change detected in the demo feed.";
  }
}

/** Ensures every borough is represented; used by tests/sanity checks. */
export const PROPERTY_SOURCE_INTEGRATIONS = SOURCE_INTEGRATIONS;
