import type { ScoreFactor, BusinessCategory } from "@/lib/types";
import { scoreBand } from "@/lib/utils";
import type { PartnershipScoreInput, ScoringEngine } from "./types";
import { softCeiling } from "./curve";

/** How reliably each category tends to produce *recurring* painting work. */
const CATEGORY_RECURRENCE: Record<BusinessCategory, number> = {
  "Property Management": 1.0,
  "Condo / Co-op Management": 0.95,
  "Building Manager": 0.85,
  Landlord: 0.8,
  "Building Maintenance": 0.8,
  "General Contractor": 0.78,
  "Restoration Company": 0.72,
  "Real Estate Brokerage": 0.65,
  Realtor: 0.55,
  "Drywall Contractor": 0.7,
  "Flooring Company": 0.6,
  "Interior Designer": 0.58,
  Architect: 0.45,
};

export const rulesPartnershipScorer: ScoringEngine<PartnershipScoreInput> = {
  id: "partnership-rules-v1",
  label: "Lead Scoring Agent · partnership-rules-v1",

  score(input) {
    const factors: ScoreFactor[] = [];
    let raw = 14;
    factors.push({
      label: "Baseline partnership value",
      points: 14,
      detail: "Qualified B2B relationship in the service territory",
    });

    const recurrence = CATEGORY_RECURRENCE[input.category] ?? 0.5;
    const recurrencePts = Math.round(recurrence * 24 - 4);
    raw += recurrencePts;
    factors.push({
      label: "Recurring-work potential of category",
      points: recurrencePts,
      detail: `${input.category} relationships convert to repeat work at a ${Math.round(recurrence * 100)}% relative rate`,
    });

    // Portfolio scale.
    const portfolioPts = Math.round(Math.min(17, Math.log10(Math.max(input.portfolioSize, 1)) * 7));
    raw += portfolioPts;
    factors.push({
      label: "Portfolio scale",
      points: portfolioPts,
      detail: `Controls or influences roughly ${input.portfolioSize} properties/units`,
    });

    // Job volume.
    const jobPts = Math.round(Math.min(16, input.potentialJobsPerYear * 0.42));
    raw += jobPts;
    factors.push({
      label: "Estimated annual job volume",
      points: jobPts,
      detail: `~${input.potentialJobsPerYear} painting jobs per year could route through this relationship`,
    });

    // Revenue.
    const revPts = Math.round(Math.min(13, input.estimatedAnnualOpportunity / 32000));
    raw += revPts;
    factors.push({
      label: "Revenue opportunity",
      points: revPts,
      detail: `Estimated annual opportunity of $${input.estimatedAnnualOpportunity.toLocaleString()}`,
    });

    if (input.hasNamedContact) {
      raw += 5;
      factors.push({
        label: "Named decision-maker identified",
        points: 5,
        detail: "A publicly listed contact person is available — shorter path to a conversation",
      });
    } else {
      raw -= 5;
      factors.push({
        label: "No named contact yet",
        points: -5,
        detail: "Business Research Agent needs to identify a decision-maker",
      });
    }

    const densityPts = Math.round(input.boroughDensity * 6);
    raw += densityPts;
    factors.push({
      label: "Territory density",
      points: densityPts,
      detail: "Portfolio is concentrated near existing crew routes",
    });

    if (input.yearsInBusiness >= 10) {
      raw += 4;
      factors.push({
        label: "Established operator",
        points: 4,
        detail: `${input.yearsInBusiness} years in business — stable, lower churn risk`,
      });
    }

    const repeatPts = Math.round(input.repeatWorkLikelihood * 8);
    raw += repeatPts;
    factors.push({
      label: "Repeat-work likelihood",
      points: repeatPts,
      detail: "Based on turnover cadence and maintenance schedule patterns",
    });

    const score = Math.max(10, Math.min(100, Math.round(softCeiling(raw, 85, 100, 22))));
    const band = scoreBand(score);

    return {
      score,
      band,
      factors,
      explanation: `Scored ${score}/100 (${band}). This is a ${input.category.toLowerCase()} relationship estimated to carry ${input.potentialJobsPerYear} painting jobs a year across roughly ${input.portfolioSize} properties. Partnership scoring weights recurring revenue far more heavily than a single project — one signed vendor agreement here can outperform dozens of individual homeowner leads.`,
      recommendedAction: pitchFor(input.category),
      engine: rulesPartnershipScorer.label,
    };
  },
};

export function pitchFor(category: BusinessCategory): string {
  const pitches: Record<BusinessCategory, string> = {
    "Property Management":
      "Lead with a standing turnover-repaint rate card, guaranteed 48-hour turnaround windows and a single point of contact for all buildings.",
    "Condo / Co-op Management":
      "Pitch a multi-year common-area maintenance schedule with fixed pricing, board-ready proposals and evening/weekend work to minimise resident disruption.",
    "Building Manager":
      "Offer to be the on-call painter for punch-list and unit-turn work with a same-week response commitment.",
    Landlord:
      "Offer volume pricing across the portfolio plus a fast unit-turn package timed to lease expirations.",
    "Building Maintenance":
      "Position as the painting arm of their service offering — white-label capable, insured, and able to take overflow work.",
    "General Contractor":
      "Pitch as a reliable painting subcontractor: fully insured, schedule-adherent, and able to staff multiple jobs concurrently.",
    "Restoration Company":
      "Pitch post-remediation repaint capability with rapid mobilisation for insurance-driven timelines.",
    "Real Estate Brokerage":
      "Offer a pre-listing refresh package with fast turnaround and photo-ready results that help listings show better.",
    Realtor:
      "Offer a referral arrangement plus a pre-listing paint refresh package priced for sellers preparing to go to market.",
    "Drywall Contractor":
      "Propose reciprocal referrals — they finish the board, the crew handles prime and finish coats.",
    "Flooring Company":
      "Propose bundled scheduling: paint before floors, referral flow in both directions.",
    "Interior Designer":
      "Emphasise finish quality, specialty coatings, colour-matching and clean site conduct for high-end clients.",
    Architect:
      "Position for specification: offer finish schedules, sample boards and reliable execution on design-led projects.",
  };
  return pitches[category];
}
