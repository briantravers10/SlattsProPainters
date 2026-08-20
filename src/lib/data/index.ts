import { DEMO_SEED } from "@/lib/config";
import { generatePropertyLeads } from "./property-leads";
import { generateBusinessLeads } from "./business-leads";
import { generateCustomers } from "./customers";
import type { BusinessLead, Customer, PropertyLead } from "@/lib/types";

/**
 * The demo "database".
 *
 * This module is the single seam between the application and its data. In a
 * production build it would be replaced by a real data-access layer
 * (Postgres, Supabase, an API) exposing the same shapes — no UI code reads
 * from the generators directly.
 */
export interface DemoDatabase {
  propertyLeads: PropertyLead[];
  businessLeads: BusinessLead[];
  customers: Customer[];
}

let cached: DemoDatabase | null = null;

export function loadDemoDatabase(): DemoDatabase {
  if (cached) return cached;
  cached = {
    propertyLeads: generatePropertyLeads(DEMO_SEED, 40),
    businessLeads: generateBusinessLeads(DEMO_SEED + 101),
    customers: generateCustomers(DEMO_SEED + 202, 12),
  };
  return cached;
}

export { LEAD_SOURCES, SOURCE_CLASS_ORDER } from "./sources";
export { FLYWHEEL_STEPS } from "./customers";
export { CATEGORY_GROUP } from "./business-leads";
