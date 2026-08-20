import type { AgentId } from "./agents";
import type { BusinessLead, Customer, PropertyLead } from "@/lib/types";
import type { ParsedIntent } from "./intents";

export interface AgentStep {
  agentId: AgentId;
  agentName: string;
  action: string;
  detail: string;
  /** Simulated duration, purely for the streaming effect in the UI. */
  ms: number;
}

export interface ManagerMetric {
  label: string;
  value: string;
  sub?: string;
}

export interface ManagerResponse {
  id: string;
  intent: ParsedIntent;
  headline: string;
  summary: string;
  steps: AgentStep[];
  metrics: ManagerMetric[];
  properties: PropertyLead[];
  businesses: BusinessLead[];
  customers: Customer[];
  /** Bulleted recommendations shown under the results. */
  recommendations: string[];
  /** Compliance notes surfaced with the result set. */
  complianceNote?: string;
  /** Follow-on commands the owner can click. */
  suggestions: string[];
  resultLabel: string;
  /**
   * Leads the Manager created during this run by dispatching a research
   * sweep. The store merges these into the live pipeline.
   */
  discovered?: { properties: PropertyLead[]; businesses: BusinessLead[] };
}
