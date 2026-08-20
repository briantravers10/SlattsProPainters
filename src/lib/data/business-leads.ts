import { createRng, type Rng } from "@/lib/rng";
import { NEIGHBORHOODS } from "@/lib/geo/nyc";
import { pitchFor, scorePartnership } from "@/lib/scoring";
import type { PartnershipScoreInput } from "@/lib/scoring";
import { defaultBusinessPermissions } from "@/lib/compliance";
import { screenLead } from "@/lib/compliance/screening";
import type {
  ActivityEvent,
  Borough,
  BusinessCategory,
  BusinessLead,
  LeadStage,
  OutreachChannel,
  PartnerGroup,
} from "@/lib/types";
import { daysFromToday } from "@/lib/utils";
import {
  LLC_PREFIXES,
  DEMO_CONTACT_FIRST,
  DEMO_SURNAMES,
  GC_NAMES,
  NOTE_SNIPPETS,
  OTHER_PARTNER_NAMES,
  PM_NAMES,
  REALTY_NAMES,
} from "./names";

export const CATEGORY_GROUP: Record<BusinessCategory, PartnerGroup> = {
  "Property Management": "Property Managers",
  "Condo / Co-op Management": "Property Managers",
  "Building Manager": "Property Managers",
  Landlord: "Property Managers",
  Realtor: "Realtors",
  "Real Estate Brokerage": "Realtors",
  "General Contractor": "Contractors",
  "Drywall Contractor": "Contractors",
  "Flooring Company": "Other Partners",
  "Interior Designer": "Other Partners",
  Architect: "Other Partners",
  "Restoration Company": "Other Partners",
  "Building Maintenance": "Other Partners",
};

const TITLES: Record<PartnerGroup, string[]> = {
  "Property Managers": ["Director of Operations", "Portfolio Manager", "VP, Property Services", "Facilities Director"],
  Realtors: ["Managing Broker", "Associate Broker", "Team Lead", "Director of Sales"],
  Contractors: ["Project Executive", "Owner / Principal", "Director of Preconstruction", "Senior Project Manager"],
  "Other Partners": ["Principal", "Studio Director", "Operations Manager", "Business Development Lead"],
};

const PORTFOLIO_UNIT: Record<PartnerGroup, string> = {
  "Property Managers": "units under management",
  Realtors: "active listings / yr",
  Contractors: "active projects / yr",
  "Other Partners": "projects / yr",
};

function domainFor(name: string) {
  const slugged = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 22);
  return `${slugged}.demo`;
}

/** Public-style business contact details — synthetic, non-routable demo values. */
function contactDetails(rng: Rng, name: string) {
  const domain = domainFor(name);
  return {
    website: `www.${domain}`,
    phone: `(212) 555-${String(rng.int(1000, 9999))}`,
    email: `${rng.pick(["info", "office", "contact", "operations", "hello"])}@${domain}`,
  };
}

function stageFor(rng: Rng, score: number): LeadStage {
  if (score >= 85) {
    return rng.weighted<LeadStage>([
      ["Qualified", 3], ["Ready for Outreach", 3], ["Contacted", 3],
      ["Follow-Up", 2], ["Estimate Sent", 1], ["Won", 2],
    ]);
  }
  if (score >= 70) {
    return rng.weighted<LeadStage>([
      ["Researching", 3], ["Qualified", 3], ["Ready for Outreach", 2],
      ["Contacted", 2], ["Follow-Up", 2], ["Won", 1],
    ]);
  }
  return rng.weighted<LeadStage>([
    ["Discovered", 4], ["Researching", 3], ["Qualified", 1], ["Lost", 2],
  ]);
}

function channelsFor(group: PartnerGroup, hasContact: boolean): OutreachChannel[] {
  const out: OutreachChannel[] = ["Email"];
  if (hasContact) out.push("Phone");
  switch (group) {
    case "Property Managers":
      out.push("Property Manager Partnership", "Direct Mail");
      break;
    case "Realtors":
      out.push("Realtor Partnership", "Referral");
      break;
    case "Contractors":
      out.push("Contractor Partnership", "Referral");
      break;
    default:
      out.push("Referral", "Direct Mail");
  }
  return [...new Set(out)].slice(0, 4);
}

function whyValuable(
  rng: Rng,
  category: BusinessCategory,
  portfolio: number,
  jobs: number,
): string[] {
  const generic = [
    `Approximately ${portfolio.toLocaleString()} ${PORTFOLIO_UNIT[CATEGORY_GROUP[category]]} in the territory`,
    `Estimated ${jobs} painting jobs per year could route through this relationship`,
    "One signed vendor agreement replaces dozens of cold consumer leads",
  ];
  const specific: Record<PartnerGroup, string[]> = {
    "Property Managers": [
      "Unit turnovers create a predictable, recurring repaint cadence",
      "Common areas, hallways and lobbies repaint on a fixed schedule",
      "Single point of contact covers many buildings at once",
    ],
    Realtors: [
      "Pre-listing refresh work is fast, high-margin and repeatable",
      "Agents introduce the crew to both sellers and incoming buyers",
      "Referrals arrive pre-qualified with a clear deadline",
    ],
    Contractors: [
      "Painting is almost always subcontracted on renovation projects",
      "Steady overflow work smooths seasonal demand",
      "Being on the approved-sub list compounds over multiple projects",
    ],
    "Other Partners": [
      "Adjacent trade with naturally reciprocal referral flow",
      "Their project schedule creates a predictable handoff point for paint",
      "Specification influence on higher-end finish work",
    ],
  };
  return [...generic.slice(0, 2), ...rng.sample(specific[CATEGORY_GROUP[category]], 2)];
}

interface Spec {
  category: BusinessCategory;
  names: string[];
}

const SPECS: Spec[] = [
  { category: "Property Management", names: PM_NAMES.slice(0, 9) },
  { category: "Condo / Co-op Management", names: [...(OTHER_PARTNER_NAMES["Condo / Co-op Management"] ?? []), PM_NAMES[9], PM_NAMES[10]] },
  { category: "Building Manager", names: OTHER_PARTNER_NAMES["Building Manager"] ?? [] },
  { category: "Landlord", names: OTHER_PARTNER_NAMES["Landlord"] ?? [] },
  { category: "Real Estate Brokerage", names: REALTY_NAMES.slice(0, 8) },
  { category: "Realtor", names: REALTY_NAMES.slice(8, 15) },
  { category: "General Contractor", names: GC_NAMES },
  { category: "Interior Designer", names: OTHER_PARTNER_NAMES["Interior Designer"] ?? [] },
  { category: "Architect", names: OTHER_PARTNER_NAMES["Architect"] ?? [] },
  { category: "Flooring Company", names: OTHER_PARTNER_NAMES["Flooring Company"] ?? [] },
  { category: "Drywall Contractor", names: OTHER_PARTNER_NAMES["Drywall Contractor"] ?? [] },
  { category: "Restoration Company", names: OTHER_PARTNER_NAMES["Restoration Company"] ?? [] },
  { category: "Building Maintenance", names: OTHER_PARTNER_NAMES["Building Maintenance"] ?? [] },
];

export interface BusinessGenerationOptions {
  boroughs?: Borough[];
  zips?: string[];
  categories?: BusinessCategory[];
  idOffset?: number;
  discoveredToday?: boolean;
}

export function generateBusinessLeads(seed: number): BusinessLead[] {
  const rng = createRng(seed);
  const leads: BusinessLead[] = [];
  let i = 0;

  for (const spec of SPECS) {
    for (const businessName of spec.names) {
      leads.push(makeBusinessLead(rng, i, spec.category, businessName, NEIGHBORHOODS[(i * 11 + 3) % NEIGHBORHOODS.length]));
      i++;
    }
  }

  return leads;
}

/**
 * Discovery pass used by the AI Manager when the owner asks for more
 * organisations than the current dataset contains. Simulates the Business
 * Research Agent finding fresh targets in a specific scope.
 */
export function discoverBusinessLeads(
  seed: number,
  count: number,
  options: BusinessGenerationOptions = {},
): BusinessLead[] {
  const rng = createRng(seed);
  const categories =
    options.categories?.length ? options.categories : (Object.keys(CATEGORY_GROUP) as BusinessCategory[]);
  let pool = options.boroughs?.length
    ? NEIGHBORHOODS.filter((n) => options.boroughs!.includes(n.borough))
    : NEIGHBORHOODS;
  if (options.zips?.length) {
    pool = pool.filter((n) => n.zips.some((z) => options.zips!.includes(z)));
  }
  const neighborhoods = pool.length ? pool : NEIGHBORHOODS;
  const offset = options.idOffset ?? 0;

  return Array.from({ length: count }, (_, k) => {
    const category = categories[k % categories.length];
    const nb = neighborhoods[rng.int(0, neighborhoods.length - 1)];
    return makeBusinessLead(
      rng,
      offset + k,
      category,
      makeDiscoveredName(rng, category),
      nb,
      options.discoveredToday,
      options.zips,
    );
  });
}

const DISCOVERED_SUFFIX: Partial<Record<BusinessCategory, string[]>> = {
  "Property Management": ["Property Management", "Residential Management", "Management Group"],
  "Condo / Co-op Management": ["Co-op Advisors", "Board Management", "Condo Services"],
  "Building Manager": ["Building Management", "Tower Management"],
  Landlord: ["Rentals", "Holdings", "Property Holdings"],
  Realtor: ["Realty", "Home Group", "Realty Team"],
  "Real Estate Brokerage": ["Real Estate", "Brokerage Group", "Property Advisors"],
  "General Contractor": ["Construction Group", "Builders", "General Contracting"],
  "Drywall Contractor": ["Drywall Systems", "Wall Partners"],
  "Flooring Company": ["Flooring Co.", "Floor Works"],
  "Interior Designer": ["Interiors", "Design Studio"],
  Architect: ["Architecture Studio", "Architects"],
  "Restoration Company": ["Restoration Group", "Restoration Services"],
  "Building Maintenance": ["Facility Services", "Building Maintenance"],
};

function makeDiscoveredName(rng: Rng, category: BusinessCategory): string {
  const prefix = rng.pick(LLC_PREFIXES);
  const suffix = rng.pick(DISCOVERED_SUFFIX[category] ?? ["Partners"]);
  return `${prefix} ${suffix}`;
}

function makeBusinessLead(
  rng: Rng,
  i: number,
  category: BusinessCategory,
  businessName: string,
  nb: (typeof NEIGHBORHOODS)[number],
  discoveredToday = false,
  restrictZips?: string[],
): BusinessLead {
  {
    {
      const spec = { category };
      const group = CATEGORY_GROUP[spec.category];

      const portfolioSize =
        group === "Property Managers" ? rng.int(120, 3400)
        : group === "Realtors" ? rng.int(18, 260)
        : group === "Contractors" ? rng.int(8, 70)
        : rng.int(6, 90);

      const potentialJobsPerYear =
        group === "Property Managers" ? rng.int(14, 90)
        : group === "Realtors" ? rng.int(6, 38)
        : group === "Contractors" ? rng.int(5, 30)
        : rng.int(3, 22);

      const avgJob =
        group === "Property Managers" ? rng.int(2600, 7200)
        : group === "Realtors" ? rng.int(3200, 9000)
        : rng.int(6000, 22000);

      const estimatedAnnualOpportunity = Math.round((potentialJobsPerYear * avgJob) / 1000) * 1000;
      const hasNamedContact = rng.bool(0.72);
      const yearsInBusiness = rng.int(3, 34);

      const scoreInput: PartnershipScoreInput = {
        category: spec.category,
        portfolioSize,
        potentialJobsPerYear,
        estimatedAnnualOpportunity,
        hasNamedContact,
        boroughDensity: rng.float(0.3, 1),
        yearsInBusiness,
        repeatWorkLikelihood: rng.float(0.35, 1),
      };

      const score = scorePartnership(scoreInput);
      const stage = stageFor(rng, score.score);
      const details = contactDetails(rng, businessName);
      const dateDiscovered = discoveredToday ? daysFromToday(0) : daysFromToday(-rng.int(0, 52));

      const contactedStages: LeadStage[] = [
        "Contacted", "Follow-Up", "Estimate Requested", "Estimate Sent", "Won", "Lost",
      ];
      const lastContacted = contactedStages.includes(stage)
        ? daysFromToday(-rng.int(1, 30))
        : undefined;
      const followUpDate =
        stage === "Won" || stage === "Lost" ? undefined : daysFromToday(rng.int(-5, 24));

      const permissions = {
        ...defaultBusinessPermissions(),
        phone: rng.weighted<"Unknown" | "Cleared" | "DNC" | "Consented">([
          ["Cleared", 6], ["Unknown", 3], ["Consented", 1],
        ]),
        sms: rng.bool(0.15) ? ("Consented" as const) : ("Not Consented" as const),
        email: rng.bool(0.93) ? ("Eligible" as const) : ("Suppressed" as const),
        doNotContact: rng.bool(0.03),
      };

      const base: Omit<BusinessLead, "timeline"> = {
        id: `B-${String(2000 + i)}`,
        kind: "business",
        businessName,
        category: spec.category,
        group,
        borough: nb.borough,
        neighborhood: nb.name,
        zip: rng.pick(
          restrictZips?.length ? (nb.zips.filter((z) => restrictZips.includes(z)) ?? nb.zips) : nb.zips,
        ),
        lat: nb.lat + rng.float(-0.009, 0.009),
        lng: nb.lng + rng.float(-0.011, 0.011),
        ...details,
        contactPerson: hasNamedContact
          ? `${rng.pick(DEMO_CONTACT_FIRST)} ${rng.pick(DEMO_SURNAMES)}`
          : undefined,
        contactTitle: hasNamedContact ? rng.pick(TITLES[group]) : undefined,
        portfolioSize,
        portfolioUnit: PORTFOLIO_UNIT[group],
        estimatedAnnualOpportunity,
        potentialJobsPerYear,
        score,
        whyValuable: whyValuable(rng, spec.category, portfolioSize, potentialJobsPerYear),
        recommendedPitch: pitchFor(spec.category),
        recommendedChannels: channelsFor(group, hasNamedContact),
        stage,
        dateDiscovered,
        lastContacted,
        followUpDate,
        permissions,
        screening: screenLead(`B-${2000 + i}`, true, true),
        sourceIntegration: rng.pick([
          "Public Business Directory (demo feed)",
          "Google Business Information (demo feed)",
          "Public Business Website (demo feed)",
          "Industry Association Listing (demo feed)",
        ]),
        notes: rng.pick(NOTE_SNIPPETS),
      };

      return { ...base, timeline: buildBusinessTimeline(rng, base) };
    }
  }
}

function buildBusinessTimeline(
  rng: Rng,
  lead: Omit<BusinessLead, "timeline">,
): ActivityEvent[] {
  const events: ActivityEvent[] = [
    {
      id: `${lead.id}-t1`,
      date: lead.dateDiscovered,
      kind: "discovered",
      title: "Business identified by the Business Research Agent",
      detail: `Source: ${lead.sourceIntegration}`,
      actor: "Business Research Agent",
    },
    {
      id: `${lead.id}-t2`,
      date: lead.dateDiscovered,
      kind: "research",
      title: "Portfolio and recurring-work potential estimated",
      detail: `~${lead.portfolioSize.toLocaleString()} ${lead.portfolioUnit} · ~${lead.potentialJobsPerYear} jobs/yr`,
      actor:
        lead.group === "Property Managers"
          ? "Property Manager Research Agent"
          : lead.group === "Realtors"
            ? "Realtor Research Agent"
            : "Business Research Agent",
    },
    {
      id: `${lead.id}-t3`,
      date: lead.dateDiscovered,
      kind: "score",
      title: `Partnership Score: ${lead.score.score}/100`,
      detail: lead.score.band,
      actor: lead.score.engine,
    },
    {
      id: `${lead.id}-t4`,
      date: lead.dateDiscovered,
      kind: "compliance",
      title: "B2B contact permissions evaluated",
      detail: lead.permissions.doNotContact
        ? "Flagged DO NOT CONTACT"
        : "Publicly listed business contact details · commercial outreach rules apply",
      actor: "Compliance Agent",
    },
  ];

  if (lead.lastContacted) {
    events.push({
      id: `${lead.id}-t5`,
      date: lead.lastContacted,
      kind: "outreach",
      title: `Simulated ${lead.recommendedChannels[0].toLowerCase()} outreach logged`,
      detail: "DEMO MODE: nothing was actually sent.",
      actor: "Outreach Agent (simulated)",
    });
    events.push({
      id: `${lead.id}-t6`,
      date: lead.lastContacted,
      kind: "note",
      title: "Response captured",
      detail: rng.pick([
        "Asked for a rate card covering unit turnovers.",
        "Requested certificate of insurance before adding to the vendor list.",
        "Wants to revisit at the start of next quarter.",
        "Referred the crew to a colleague managing a nearby portfolio.",
        "No response yet — second touch scheduled.",
      ]),
      actor: "Follow-Up Agent",
    });
  }

  return events.sort((a, b) => (a.date < b.date ? 1 : -1));
}
