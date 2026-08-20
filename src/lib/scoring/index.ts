import { rulesPropertyScorer } from "./property-scoring";
import { rulesPartnershipScorer } from "./partnership-scoring";
import type {
  PartnershipScoreInput,
  PropertyScoreInput,
  ScoringEngine,
} from "./types";

/**
 * Engine registry.
 *
 * Swapping the demo's deterministic scoring for a real model is a one-line
 * change here — register an engine implementing the same interface and
 * point the active binding at it.
 */
const propertyEngines: Record<string, ScoringEngine<PropertyScoreInput>> = {
  "rules-v1": rulesPropertyScorer,
};

const partnershipEngines: Record<string, ScoringEngine<PartnershipScoreInput>> = {
  "partnership-rules-v1": rulesPartnershipScorer,
};

export const activePropertyEngine = propertyEngines["rules-v1"];
export const activePartnershipEngine = partnershipEngines["partnership-rules-v1"];

export function scoreProperty(input: PropertyScoreInput) {
  return activePropertyEngine.score(input);
}

export function scorePartnership(input: PartnershipScoreInput) {
  return activePartnershipEngine.score(input);
}

export { recommendChannels } from "./property-scoring";
export { pitchFor } from "./partnership-scoring";
export type { PropertyScoreInput, PartnershipScoreInput, ScoringEngine } from "./types";
