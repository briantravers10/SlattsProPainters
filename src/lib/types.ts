import type { LeadScreening } from "./compliance/registries";

/** Core domain types shared across the application. */

export type { LeadScreening };

export type Borough =
  | "Manhattan"
  | "Brooklyn"
  | "Queens"
  | "The Bronx"
  | "Staten Island";

export const BOROUGHS: Borough[] = [
  "Manhattan",
  "Brooklyn",
  "Queens",
  "The Bronx",
  "Staten Island",
];

export type PropertyType =
  | "Single-Family"
  | "Two-Family"
  | "Townhouse"
  | "Brownstone"
  | "Condo"
  | "Co-op"
  | "Small Multifamily"
  | "Mixed-Use"
  | "Commercial";

export type OwnerType =
  | "Individual"
  | "LLC"
  | "Landlord"
  | "Management Company";

/** A detected signal that suggests painting work may be needed soon. */
export type TriggerType =
  | "Recent Purchase"
  | "Recently Listed"
  | "Older Property"
  | "Renovation Activity"
  | "Building Permit"
  | "Rental Turnover"
  | "Multi-Property Landlord"
  | "Higher-Value Property"
  | "Recently Renovated"
  | "Exterior Condition"
  | "Recent Sale"
  | "New Ownership";

export interface Trigger {
  type: TriggerType;
  detail: string;
  /** Recency in days, where meaningful. */
  daysAgo?: number;
  /** 0-1 weighting used by the scoring engine. */
  strength: number;
}

export type LeadStage =
  | "Discovered"
  | "Researching"
  | "Qualified"
  | "Ready for Outreach"
  | "Contacted"
  | "Follow-Up"
  | "Estimate Requested"
  | "Estimate Sent"
  | "Won"
  | "Lost";

export const LEAD_STAGES: LeadStage[] = [
  "Discovered",
  "Researching",
  "Qualified",
  "Ready for Outreach",
  "Contacted",
  "Follow-Up",
  "Estimate Requested",
  "Estimate Sent",
  "Won",
  "Lost",
];

export type OutreachChannel =
  | "Direct Mail"
  | "Phone"
  | "Email"
  | "SMS"
  | "Door-to-Door"
  | "Google Ads"
  | "Meta Ads"
  | "Referral"
  | "Realtor Partnership"
  | "Property Manager Partnership"
  | "Contractor Partnership";

export const OUTREACH_CHANNELS: OutreachChannel[] = [
  "Direct Mail",
  "Phone",
  "Email",
  "SMS",
  "Door-to-Door",
  "Google Ads",
  "Meta Ads",
  "Referral",
  "Realtor Partnership",
  "Property Manager Partnership",
  "Contractor Partnership",
];

/* ------------------------------------------------------------------ */
/* Compliance                                                          */
/* ------------------------------------------------------------------ */

export type PhonePermission = "Unknown" | "Cleared" | "DNC" | "Consented";
export type SmsPermission = "Not Consented" | "Consented";
export type EmailPermission = "Unknown" | "Eligible" | "Suppressed";
export type MailPermission = "Eligible" | "Restricted";
export type DoorPermission = "Unknown" | "Eligible" | "Restricted";

export type ContactSource =
  | "Property Record"
  | "Lead Form"
  | "Referral"
  | "Customer"
  | "Public Business Information";

export interface ContactPermissions {
  phone: PhonePermission;
  sms: SmsPermission;
  email: EmailPermission;
  directMail: MailPermission;
  door: DoorPermission;
  source: ContactSource;
  doNotContact: boolean;
  consentDate?: string;
  consentSource?: string;
}

/* ------------------------------------------------------------------ */
/* Scoring                                                             */
/* ------------------------------------------------------------------ */

export interface ScoreFactor {
  label: string;
  /** Points contributed (may be negative). */
  points: number;
  detail: string;
}

export interface ScoreResult {
  score: number;
  band: ScoreBand;
  factors: ScoreFactor[];
  /** Natural-language explanation shown in the UI. */
  explanation: string;
  recommendedAction: string;
  /** Which engine produced the score — swappable for a real model. */
  engine: string;
}

export type ScoreBand =
  | "Extremely High Opportunity"
  | "High Opportunity"
  | "Medium Opportunity"
  | "Low Priority";

/* ------------------------------------------------------------------ */
/* Timeline                                                            */
/* ------------------------------------------------------------------ */

export type ActivityKind =
  | "discovered"
  | "research"
  | "score"
  | "stage"
  | "note"
  | "outreach"
  | "compliance";

export interface ActivityEvent {
  id: string;
  date: string;
  kind: ActivityKind;
  title: string;
  detail?: string;
  actor: string;
}

/* ------------------------------------------------------------------ */
/* Property lead                                                       */
/* ------------------------------------------------------------------ */

export interface PropertyLead {
  id: string;
  kind: "property";
  address: string;
  borough: Borough;
  neighborhood: string;
  zip: string;
  lat: number;
  lng: number;
  propertyType: PropertyType;
  ownerType: OwnerType;
  ownerLabel: string;
  estimatedValue: number;
  lastSaleDate?: string;
  lastSalePrice?: number;
  yearBuilt: number;
  unitCount: number;
  squareFeet: number;
  permitSignals: string[];
  interiorOpportunity: boolean;
  exteriorOpportunity: boolean;
  /** Human-readable reason this property surfaced. */
  identifiedReason: string;
  triggers: Trigger[];
  score: ScoreResult;
  recommendedChannels: OutreachChannel[];
  estimatedProjectType: string;
  estimatedValueLow: number;
  estimatedValueHigh: number;
  stage: LeadStage;
  dateDiscovered: string;
  followUpDate?: string;
  permissions: ContactPermissions;
  /** Suppression-list results, refreshed at discovery and before contact. */
  screening: LeadScreening;
  sourceIntegration: string;
  notes: string;
  timeline: ActivityEvent[];
}

/* ------------------------------------------------------------------ */
/* Business / partnership lead                                         */
/* ------------------------------------------------------------------ */

export type BusinessCategory =
  | "Property Management"
  | "Building Manager"
  | "Realtor"
  | "Real Estate Brokerage"
  | "General Contractor"
  | "Interior Designer"
  | "Architect"
  | "Flooring Company"
  | "Drywall Contractor"
  | "Restoration Company"
  | "Landlord"
  | "Condo / Co-op Management"
  | "Building Maintenance";

export const BUSINESS_CATEGORIES: BusinessCategory[] = [
  "Property Management",
  "Building Manager",
  "Realtor",
  "Real Estate Brokerage",
  "General Contractor",
  "Interior Designer",
  "Architect",
  "Flooring Company",
  "Drywall Contractor",
  "Restoration Company",
  "Landlord",
  "Condo / Co-op Management",
  "Building Maintenance",
];

/** Coarse grouping used by dashboard cards and map filters. */
export type PartnerGroup =
  | "Property Managers"
  | "Realtors"
  | "Contractors"
  | "Other Partners";

export interface BusinessLead {
  id: string;
  kind: "business";
  businessName: string;
  category: BusinessCategory;
  group: PartnerGroup;
  borough: Borough;
  neighborhood: string;
  zip: string;
  lat: number;
  lng: number;
  website: string;
  phone: string;
  email: string;
  contactPerson?: string;
  contactTitle?: string;
  portfolioSize: number;
  portfolioUnit: string;
  estimatedAnnualOpportunity: number;
  potentialJobsPerYear: number;
  score: ScoreResult;
  whyValuable: string[];
  recommendedPitch: string;
  recommendedChannels: OutreachChannel[];
  stage: LeadStage;
  dateDiscovered: string;
  lastContacted?: string;
  followUpDate?: string;
  permissions: ContactPermissions;
  screening: LeadScreening;
  sourceIntegration: string;
  notes: string;
  timeline: ActivityEvent[];
}

export type Lead = PropertyLead | BusinessLead;

export function isProperty(lead: Lead): lead is PropertyLead {
  return lead.kind === "property";
}

/* ------------------------------------------------------------------ */
/* Customers & flywheel                                                */
/* ------------------------------------------------------------------ */

export type FlywheelStepId =
  | "job-completed"
  | "photos"
  | "review"
  | "referral"
  | "neighbor-campaign"
  | "crm"
  | "reactivation";

export interface FlywheelState {
  step: FlywheelStepId;
  status: "complete" | "in-progress" | "pending";
  date?: string;
  detail?: string;
}

export interface Customer {
  id: string;
  name: string;
  address: string;
  borough: Borough;
  neighborhood: string;
  zip: string;
  lat: number;
  lng: number;
  jobType: string;
  jobValue: number;
  completedDate: string;
  reviewLeft: boolean;
  reviewStars?: number;
  referralsGenerated: number;
  neighborLeadsGenerated: number;
  photosCaptured: number;
  reactivationDue?: string;
  reactivationReason?: string;
  flywheel: FlywheelState[];
  permissions: ContactPermissions;
  notes: string;
}

/* ------------------------------------------------------------------ */
/* Lead sources                                                        */
/* ------------------------------------------------------------------ */

export type SourceClass =
  | "Available Public Data"
  | "Licensed / Paid Data"
  | "Customer-Provided Data"
  | "Requires Permission / Compliance Review";

export interface LeadSource {
  id: string;
  name: string;
  description: string;
  sourceClass: SourceClass;
  status: "Connected (Demo)" | "Available" | "Requires Review" | "Not Connected";
  feeds: ("Property Leads" | "Partnership Leads" | "Customers")[];
  exampleFields: string[];
  notes: string;
  estimatedCost?: string;
}
