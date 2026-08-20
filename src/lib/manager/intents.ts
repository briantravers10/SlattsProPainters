import { BOROUGHS, BUSINESS_CATEGORIES } from "@/lib/types";
import { ALL_ZIPS } from "@/lib/geo/nyc";
import type { Borough, BusinessCategory, TriggerType } from "@/lib/types";

/**
 * Intent parsing for the AI Manager.
 *
 * The demo uses deterministic keyword/pattern matching so that the same
 * command always produces the same, explainable result. In production this
 * module is the natural place to call a language model and have it emit the
 * same {@link ParsedIntent} structure — nothing downstream changes.
 */

export type IntentKind =
  | "find-properties"
  | "find-businesses"
  | "top-opportunities"
  | "follow-ups"
  | "reactivate-customers"
  | "pipeline-summary"
  | "borough-summary"
  | "compliance-review"
  | "help";

export interface ParsedIntent {
  kind: IntentKind;
  boroughs: Borough[];
  neighborhoods: string[];
  categories: BusinessCategory[];
  triggers: TriggerType[];
  /** ZIP codes named in the command, e.g. "in 11215 and 11238". */
  zips: string[];
  minScore?: number;
  limit: number;
  /** True when the owner named a specific number in the command. */
  explicitLimit: boolean;
  timeframe?: "today" | "week" | "month";
  /** Words the parser recognised — shown back to the user for transparency. */
  matched: string[];
  raw: string;
}

const BOROUGH_ALIASES: [RegExp, Borough][] = [
  [/\bmanhattan\b|\bnyc downtown\b|\buptown\b/i, "Manhattan"],
  [/\bbrooklyn\b|\bbklyn\b|\bbk\b/i, "Brooklyn"],
  [/\bqueens\b/i, "Queens"],
  [/\bbronx\b/i, "The Bronx"],
  [/\bstaten island\b|\bstaten\b|\bsi\b/i, "Staten Island"],
];

const CATEGORY_ALIASES: [RegExp, BusinessCategory][] = [
  [/\bproperty manager|property management|managing agent|management compan/i, "Property Management"],
  [/\bco-?op|condo board|board manage/i, "Condo / Co-op Management"],
  [/\bbuilding manager|super(intendent)?s?\b/i, "Building Manager"],
  [/\blandlord/i, "Landlord"],
  [/\brealtor|real estate agent|listing agent/i, "Realtor"],
  [/\bbrokerage|broker\b|real estate (firm|compan)/i, "Real Estate Brokerage"],
  [/\bgeneral contractor|\bgc\b|construction compan|builder/i, "General Contractor"],
  [/\bdrywall|sheetrock/i, "Drywall Contractor"],
  [/\bflooring|floor compan/i, "Flooring Company"],
  [/\binterior design/i, "Interior Designer"],
  [/\barchitect/i, "Architect"],
  [/\brestoration|water damage|fire damage/i, "Restoration Company"],
  [/\bbuilding maintenance|facility|facilities/i, "Building Maintenance"],
];

const TRIGGER_ALIASES: [RegExp, TriggerType][] = [
  [/\brecently (purchased|bought)|new (home)?owner|just (bought|purchased)|recent purchase/i, "Recent Purchase"],
  [/\brecently listed|for sale|on the market|listing/i, "Recently Listed"],
  [/\bold(er)? (propert|home|building|house)|aging|pre-?war/i, "Older Property"],
  [/\brenovat/i, "Renovation Activity"],
  [/\bpermit/i, "Building Permit"],
  [/\bturnover|tenant turn|vacan/i, "Rental Turnover"],
  [/\bmulti-?property|portfolio (owner|landlord)|multiple properties/i, "Multi-Property Landlord"],
  [/\bhigh(er)?[- ]value|expensive|luxury|high[- ]end/i, "Higher-Value Property"],
  [/\bexterior condition|needs? paint|peeling|faded/i, "Exterior Condition"],
  [/\brecent sale|sold recently|recently sold/i, "Recent Sale"],
];

const NEIGHBORHOOD_HINTS = [
  "Upper East Side", "Upper West Side", "Harlem", "Chelsea", "Tribeca",
  "East Village", "Washington Heights", "Murray Hill", "Inwood",
  "Financial District", "Park Slope", "Williamsburg", "Bay Ridge", "Bushwick",
  "Crown Heights", "Bedford-Stuyvesant", "Greenpoint", "Sunset Park",
  "Flatbush", "Canarsie", "Brooklyn Heights", "Dyker Heights", "Astoria",
  "Long Island City", "Forest Hills", "Flushing", "Jackson Heights",
  "Ridgewood", "Bayside", "Jamaica", "Sunnyside", "Whitestone", "Woodside",
  "Rockaway Park", "Riverdale", "Throgs Neck", "Pelham Bay", "Fordham",
  "Mott Haven", "Morris Park", "Country Club", "Kingsbridge", "City Island",
  "St. George", "Tottenville", "Great Kills", "New Dorp", "Todt Hill",
  "West Brighton", "Annadale", "Bulls Head",
];

export function parseIntent(raw: string): ParsedIntent {
  const text = raw.trim();
  const lower = text.toLowerCase();
  const matched: string[] = [];

  const boroughs: Borough[] = [];
  for (const [re, b] of BOROUGH_ALIASES) {
    if (re.test(text)) {
      boroughs.push(b);
      matched.push(b);
    }
  }
  if (/\ball (five )?boroughs|citywide|city-wide|entire city|all of nyc/i.test(text)) {
    boroughs.push(...BOROUGHS.filter((b) => !boroughs.includes(b)));
    matched.push("all five boroughs");
  }

  const neighborhoods = NEIGHBORHOOD_HINTS.filter((n) =>
    lower.includes(n.toLowerCase()),
  );
  matched.push(...neighborhoods);

  const categories: BusinessCategory[] = [];
  for (const [re, c] of CATEGORY_ALIASES) {
    if (re.test(text) && !categories.includes(c)) {
      categories.push(c);
      matched.push(c);
    }
  }

  const triggers: TriggerType[] = [];
  for (const [re, t] of TRIGGER_ALIASES) {
    if (re.test(text) && !triggers.includes(t)) {
      triggers.push(t);
      matched.push(t);
    }
  }

  // ZIP codes: any bare five-digit number in the NYC range. Parsed before the
  // limit so "100 leads in 11215" reads the 100 as a count and the 11215 as a
  // ZIP rather than the other way round.
  const zips = [...new Set(text.match(/\b1\d{4}\b/g) ?? [])].filter((z) =>
    ALL_ZIPS.includes(z),
  );
  if (zips.length) matched.push(...zips.map((z) => `ZIP ${z}`));

  // Numeric limit: "find me 100 ..." — never a five-digit ZIP.
  const withoutZips = zips.reduce((acc, z) => acc.replaceAll(z, " "), lower);
  const numMatch = withoutZips.match(/\b(\d{1,4})\b/);
  const limit = numMatch ? Math.min(500, Math.max(1, parseInt(numMatch[1], 10))) : 25;
  if (numMatch) matched.push(`limit ${limit}`);

  // Score qualifiers.
  let minScore: number | undefined;
  if (/\bhighest|best|top\b/i.test(text)) minScore = 85;
  if (/\bhigh[- ]?(potential|opportunity|scoring|value)|\bhot\b|\bextremely high\b/i.test(text)) {
    minScore = Math.max(minScore ?? 0, 75);
  }
  if (/\bmedium\b/i.test(text)) minScore = 60;
  const explicitScore = lower.match(/(?:score|scoring)\s*(?:above|over|of at least|>=?|greater than)\s*(\d{1,3})/);
  if (explicitScore) minScore = parseInt(explicitScore[1], 10);
  if (minScore) matched.push(`score ≥ ${minScore}`);

  let timeframe: ParsedIntent["timeframe"];
  if (/\btoday\b/i.test(text)) timeframe = "today";
  else if (/\bthis week\b|\bpast week\b|\blast 7 days\b|\bweekly\b/i.test(text)) timeframe = "week";
  else if (/\bthis month\b|\blast 30 days\b/i.test(text)) timeframe = "month";
  if (timeframe) matched.push(timeframe);

  const kind = classify(text, { categories, triggers, zips, timeframe });

  return {
    kind,
    boroughs,
    neighborhoods,
    categories,
    triggers,
    zips,
    minScore,
    limit,
    explicitLimit: Boolean(numMatch),
    timeframe,
    matched: [...new Set(matched)],
    raw: text,
  };
}

function classify(
  text: string,
  ctx: {
    categories: BusinessCategory[];
    triggers: TriggerType[];
    zips: string[];
    timeframe?: string;
  },
): IntentKind {
  if (!text.trim()) return "help";
  if (/\bhelp\b|what can you do|how does this work|examples?\b/i.test(text)) return "help";

  if (/\bfollow[- ]?ups?\b|\bdue\b|\bchase\b|\bneeds? (a )?follow/i.test(text)) {
    return "follow-ups";
  }
  if (/\breactivat|previous customers?|past customers?|repeat business|win back/i.test(text)) {
    return "reactivate-customers";
  }
  if (
    /\bcompliance|permission|consent|do not contact|dnc\b|can (i|we) (call|text|email)|(not )?allowed to (call|text|email|contact)|suppressed|opt[- ]?out/i.test(text)
  ) {
    return "compliance-review";
  }
  if (/\bby borough\b|break ?down.*borough|compare boroughs|which borough|per borough|across (the )?boroughs/i.test(text)) {
    return "borough-summary";
  }
  if (/\bpipeline\b|\bsummary\b|\bhow (am i|are we) doing\b|\bstatus\b|\boverview\b/i.test(text)) {
    return "pipeline-summary";
  }
  if (ctx.categories.length > 0) return "find-businesses";
  if (
    /\bhighest[- ]value|biggest|largest|most valuable|top opportunit/i.test(text) &&
    !/propert(y|ies)\b/i.test(text)
  ) {
    return "top-opportunities";
  }
  if (
    /\bpropert|home ?owner|house|building|address|residential/i.test(text) ||
    ctx.triggers.length > 0 ||
    ctx.zips.length > 0
  ) {
    return "find-properties";
  }
  if (/\bpartner|b2b|business|recurring/i.test(text)) return "find-businesses";
  if (/\bhighest|top|best\b/i.test(text)) return "top-opportunities";
  return "find-properties";
}

export const EXAMPLE_COMMANDS: { text: string; hint: string }[] = [
  { text: "Find me 100 high-potential residential painting opportunities in Brooklyn.", hint: "Property search" },
  { text: "Find property managers in Queens that could provide recurring painting work.", hint: "Partnership search" },
  { text: "Find recently purchased properties in Staten Island.", hint: "Trigger search" },
  { text: "Show me the highest-value opportunities discovered this week.", hint: "Prioritisation" },
  { text: "Find general contractors in Manhattan that may need a painting subcontractor.", hint: "Subcontractor pitch" },
  { text: "Show me every prospect that needs a follow-up today.", hint: "Daily list" },
  { text: "Which previous customers are worth reactivating?", hint: "Flywheel" },
  { text: "Break down my pipeline by borough.", hint: "Territory analysis" },
  { text: "Which leads am I not allowed to call?", hint: "Compliance" },
  { text: "Find high-potential properties in 11215 and 11238.", hint: "ZIP targeting" },
  { text: "Find older properties in the Bronx with exterior painting opportunities.", hint: "Exterior work" },
];

export { BUSINESS_CATEGORIES };
