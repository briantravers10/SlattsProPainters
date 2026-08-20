/**
 * Specialist worker registry.
 *
 * The owner talks to the Manager. The Manager decides which specialist
 * workers to run. In the demo the workers are simulated — each one is a
 * named step in the execution trace with a description of what it would do
 * in production. The registry is the seam where real agent implementations
 * would be attached.
 */

export type AgentId =
  | "property-research"
  | "business-research"
  | "realtor-research"
  | "property-manager-research"
  | "permit-trigger-research"
  | "lead-scoring"
  | "compliance"
  | "outreach"
  | "follow-up";

export interface WorkerAgent {
  id: AgentId;
  name: string;
  role: string;
  description: string;
  /** What this worker would connect to in production. */
  productionInputs: string[];
  /** Simulated in the demo — no real side effects. */
  simulated: boolean;
  status: "Active (simulated)" | "Standby" | "Disabled in demo";
}

export const WORKER_AGENTS: WorkerAgent[] = [
  {
    id: "property-research",
    name: "Property Research Agent",
    role: "Builds and maintains the property universe",
    description:
      "Continuously sweeps property records across the five boroughs, normalises addresses, and maintains the working set of properties in the service territory.",
    productionInputs: ["NYC public property records", "Property transaction data", "Internal CRM"],
    simulated: true,
    status: "Active (simulated)",
  },
  {
    id: "permit-trigger-research",
    name: "Permit / Trigger Research Agent",
    role: "Detects timing signals",
    description:
      "Watches permit filings, sales, listings and turnover events, and attaches dated triggers to properties. This is what turns a static address list into a timing-aware pipeline.",
    productionInputs: ["NYC DOB permit data", "Deed and transaction records", "Listing feeds"],
    simulated: true,
    status: "Active (simulated)",
  },
  {
    id: "business-research",
    name: "Business Research Agent",
    role: "Finds B2B partnership targets",
    description:
      "Identifies organisations in the territory that could generate recurring painting work, and estimates the size of the opportunity behind each one.",
    productionInputs: ["Public business listings", "Google Business information", "Permit contractor-of-record data"],
    simulated: true,
    status: "Active (simulated)",
  },
  {
    id: "realtor-research",
    name: "Realtor Research Agent",
    role: "Specialises in agents and brokerages",
    description:
      "Ranks agents and brokerages by listing volume and turnover, and identifies who is most likely to need a fast pre-listing refresh partner.",
    productionInputs: ["Licensed listing data", "Public brokerage information"],
    simulated: true,
    status: "Active (simulated)",
  },
  {
    id: "property-manager-research",
    name: "Property Manager Research Agent",
    role: "Specialises in managed portfolios",
    description:
      "Maps management companies to the buildings they manage and estimates unit-turnover cadence to size the recurring repaint opportunity.",
    productionInputs: ["Public building registration data", "Company websites", "Internal CRM"],
    simulated: true,
    status: "Active (simulated)",
  },
  {
    id: "lead-scoring",
    name: "Lead Scoring Agent",
    role: "Scores and explains every opportunity",
    description:
      "Converts triggers, property characteristics and portfolio data into a 0–100 score with an itemised, human-readable explanation of every point awarded.",
    productionInputs: ["Trigger data", "Property attributes", "Historical win/loss outcomes"],
    simulated: true,
    status: "Active (simulated)",
  },
  {
    id: "compliance",
    name: "Compliance Agent",
    role: "Gates every channel before outreach",
    description:
      "Evaluates contact permissions per lead and per channel, and blocks any channel without an established basis for contact. Finding information is never treated as permission to use it.",
    productionInputs: ["Consent records", "Suppression and do-not-call lists", "Data-source licence terms"],
    simulated: true,
    status: "Active (simulated)",
  },
  {
    id: "outreach",
    name: "Outreach Agent",
    role: "Prepares campaigns — never sends in demo",
    description:
      "Assembles the recommended channel mix, drafts message content and queues campaigns for human approval. All sending is disabled in this build.",
    productionInputs: ["Approved templates", "Channel providers", "Compliance Agent clearances"],
    simulated: true,
    status: "Disabled in demo",
  },
  {
    id: "follow-up",
    name: "Follow-Up Agent",
    role: "Keeps the pipeline moving",
    description:
      "Tracks response state, schedules the next touch and surfaces anything overdue on the daily list so nothing quietly dies in the pipeline.",
    productionInputs: ["Pipeline state", "Response tracking", "Calendar"],
    simulated: true,
    status: "Active (simulated)",
  },
];

export const AGENT_BY_ID = Object.fromEntries(
  WORKER_AGENTS.map((a) => [a.id, a]),
) as Record<AgentId, WorkerAgent>;
