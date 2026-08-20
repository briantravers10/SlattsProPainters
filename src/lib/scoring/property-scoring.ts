import type { ScoreFactor, OutreachChannel } from "@/lib/types";
import { scoreBand } from "@/lib/utils";
import type { PropertyScoreInput, ScoringEngine } from "./types";
import { softCeiling } from "./curve";

/** Points contributed by each trigger type at full strength. */
const TRIGGER_WEIGHTS: Record<string, number> = {
  "Recent Purchase": 26,
  "New Ownership": 18,
  "Recent Sale": 16,
  "Recently Listed": 20,
  "Renovation Activity": 22,
  "Building Permit": 19,
  "Recently Renovated": 14,
  "Rental Turnover": 17,
  "Multi-Property Landlord": 15,
  "Higher-Value Property": 12,
  "Older Property": 11,
  "Exterior Condition": 18,
};

/**
 * Deterministic, explainable property scoring.
 *
 * Every point awarded is attached to a named factor so the UI can show the
 * owner exactly *why* a property surfaced — the same contract a real model
 * would need to satisfy.
 */
export const rulesPropertyScorer: ScoringEngine<PropertyScoreInput> = {
  id: "rules-v1",
  label: "Lead Scoring Agent · rules-v1",

  score(input) {
    const factors: ScoreFactor[] = [];
    let raw = 29; // baseline: any identified NYC property has some latent value

    factors.push({
      label: "Baseline market opportunity",
      points: 29,
      detail: "Active NYC residential/commercial painting market",
    });

    for (const t of input.triggers) {
      const weight = TRIGGER_WEIGHTS[t.type] ?? 10;
      const points = Math.round(weight * t.strength);
      if (points === 0) continue;
      raw += points;
      factors.push({ label: t.type, points, detail: t.detail });
    }

    // Value relative to the neighbourhood — higher budgets, larger scopes.
    const valueRatio = input.estimatedValue / Math.max(input.neighborhoodMedianValue, 1);
    if (valueRatio >= 1.35) {
      const pts = 9;
      raw += pts;
      factors.push({
        label: "Above-median property value",
        points: pts,
        detail: `Est. value is ${Math.round((valueRatio - 1) * 100)}% above the neighborhood median`,
      });
    } else if (valueRatio <= 0.7) {
      raw -= 4;
      factors.push({
        label: "Below-median property value",
        points: -4,
        detail: "Smaller likely project budget",
      });
    }

    // Building age.
    const age = new Date().getFullYear() - input.yearBuilt;
    if (age >= 60) {
      raw += 8;
      factors.push({
        label: "Aging building stock",
        points: 8,
        detail: `Built in ${input.yearBuilt} (${age} years old) — plaster, trim and exterior wear`,
      });
    } else if (age >= 25) {
      raw += 5;
      factors.push({
        label: "Repaint-cycle age",
        points: 5,
        detail: `Built in ${input.yearBuilt} — typically inside a repaint cycle`,
      });
    }

    // Time since the exterior was likely last painted.
    if (input.exteriorOpportunity && input.exteriorConditionYears >= 8) {
      const pts = Math.min(12, 4 + input.exteriorConditionYears - 8);
      raw += pts;
      factors.push({
        label: "No recent exterior painting detected",
        points: pts,
        detail: `~${input.exteriorConditionYears} years since any exterior work appears in permit history`,
      });
    }

    // Portfolio owners are worth more than a single unit.
    if (input.ownerType === "Landlord" || input.ownerType === "Management Company") {
      raw += 7;
      factors.push({
        label: "Portfolio owner",
        points: 7,
        detail: "Owner controls multiple units — repeat work potential",
      });
    }
    if (input.unitCount >= 4) {
      const pts = Math.min(10, 3 + input.unitCount / 2);
      raw += Math.round(pts);
      factors.push({
        label: "Multi-unit building",
        points: Math.round(pts),
        detail: `${input.unitCount} units — common areas plus turnover repaints`,
      });
    }

    if (input.interiorOpportunity && input.exteriorOpportunity) {
      raw += 6;
      factors.push({
        label: "Interior + exterior scope",
        points: 6,
        detail: "Both interior and exterior opportunities detected",
      });
    }

    const score = Math.max(8, Math.min(100, Math.round(softCeiling(raw))));
    const band = scoreBand(score);

    return {
      score,
      band,
      factors,
      explanation: buildExplanation(score, band, factors),
      recommendedAction: recommendAction(input, score),
      engine: rulesPropertyScorer.label,
    };
  },
};

function buildExplanation(
  score: number,
  band: string,
  factors: ScoreFactor[],
): string {
  const top = [...factors]
    .filter((f) => f.points > 0 && f.label !== "Baseline market opportunity")
    .sort((a, b) => b.points - a.points)
    .slice(0, 3)
    .map((f) => f.label.toLowerCase());

  if (top.length === 0) {
    return `Scored ${score}/100 (${band}). No strong timing signals were detected — this property is worth keeping in the territory list but is not a priority for active outreach this week.`;
  }

  return `Scored ${score}/100 (${band}). The score is driven primarily by ${listPhrase(top)}. Together these indicate a property where painting work is plausibly being considered right now rather than at some undefined future point.`;
}

function listPhrase(items: string[]) {
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function recommendAction(input: PropertyScoreInput, score: number): string {
  const recentPurchase = input.triggers.find(
    (t) => t.type === "Recent Purchase" || t.type === "New Ownership",
  );
  const permit = input.triggers.find(
    (t) => t.type === "Building Permit" || t.type === "Renovation Activity",
  );
  const listed = input.triggers.find((t) => t.type === "Recently Listed");
  const turnover = input.triggers.find((t) => t.type === "Rental Turnover");

  if (recentPurchase && score >= 75) {
    return "Send the targeted new-homeowner direct mail offer, then follow with a door-hanger pass on the same block within 10 days.";
  }
  if (listed) {
    return "Route to the realtor partnership track — approach the listing agent with a pre-sale refresh package rather than contacting the owner directly.";
  }
  if (permit) {
    return "Time outreach to the permit stage: introduce the crew to the general contractor of record as a painting subcontractor.";
  }
  if (turnover) {
    return "Pitch a standing turnover-repaint rate card to the owner or managing agent.";
  }
  if (score >= 60) {
    return "Add to the next direct mail drop for this neighborhood and review again after the seasonal exterior window opens.";
  }
  return "Hold in the territory list. Re-score automatically if a new permit, sale or listing signal appears.";
}

/** Channel recommendation is deliberately separate from scoring. */
export function recommendChannels(
  input: PropertyScoreInput,
  score: number,
): OutreachChannel[] {
  const out = new Set<OutreachChannel>();
  const has = (t: string) => input.triggers.some((x) => x.type === t);

  if (has("Recent Purchase") || has("New Ownership") || has("Recent Sale")) {
    out.add("Direct Mail");
  }
  if (has("Recently Listed")) out.add("Realtor Partnership");
  if (has("Building Permit") || has("Renovation Activity")) {
    out.add("Contractor Partnership");
  }
  if (has("Multi-Property Landlord") || has("Rental Turnover")) {
    out.add("Property Manager Partnership");
  }
  if (has("Exterior Condition") && score >= 70) out.add("Door-to-Door");
  if (input.ownerType === "LLC" || input.ownerType === "Management Company") {
    out.add("Email");
  }
  if (score >= 85) out.add("Meta Ads");
  if (out.size === 0) out.add("Direct Mail");
  return [...out].slice(0, 4);
}
