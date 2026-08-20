import type { ScoreResult } from "@/lib/types";

/**
 * Scoring engine contract.
 *
 * The demo ships a deterministic, rules-based implementation. A production
 * build can register an LLM- or model-backed engine that satisfies the same
 * interface — nothing in the UI depends on how the score is produced, only
 * on the shape of {@link ScoreResult}.
 */
export interface ScoringEngine<TInput> {
  /** Stable identifier surfaced in the UI ("scored by ..."). */
  readonly id: string;
  readonly label: string;
  score(input: TInput): ScoreResult;
}

export interface PropertyScoreInput {
  triggers: import("@/lib/types").Trigger[];
  yearBuilt: number;
  estimatedValue: number;
  neighborhoodMedianValue: number;
  lastSaleDate?: string;
  ownerType: import("@/lib/types").OwnerType;
  unitCount: number;
  exteriorConditionYears: number;
  interiorOpportunity: boolean;
  exteriorOpportunity: boolean;
}

export interface PartnershipScoreInput {
  category: import("@/lib/types").BusinessCategory;
  portfolioSize: number;
  potentialJobsPerYear: number;
  estimatedAnnualOpportunity: number;
  hasNamedContact: boolean;
  boroughDensity: number;
  yearsInBusiness: number;
  repeatWorkLikelihood: number;
}
