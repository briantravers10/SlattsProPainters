import type { LeadSource } from "@/lib/types";

/**
 * Catalogue of data sources the production system could draw on.
 *
 * Nothing here is connected in the demo. Every entry is classified so the
 * business owner can see, at a glance, what is freely available, what would
 * need to be licensed and paid for, and what requires a compliance review
 * before it can be used for outreach.
 */
export const LEAD_SOURCES: LeadSource[] = [
  {
    id: "nyc-property-records",
    name: "NYC Public Property Records",
    description:
      "Publicly published property, ownership and tax-lot records for the five boroughs. Provides the base property universe: address, lot, building class, year built and recorded owner entity.",
    sourceClass: "Available Public Data",
    status: "Connected (Demo)",
    feeds: ["Property Leads"],
    exampleFields: ["Address", "Borough", "Building class", "Year built", "Recorded owner", "Lot / unit count"],
    notes:
      "Public record data describes property, not people. It does not carry any permission to contact an owner.",
  },
  {
    id: "nyc-permits",
    name: "NYC Building & Permit Data",
    description:
      "Filed and issued construction permits. The strongest single timing signal in the system — renovation and facade work reliably precede painting work.",
    sourceClass: "Available Public Data",
    status: "Connected (Demo)",
    feeds: ["Property Leads", "Partnership Leads"],
    exampleFields: ["Permit type", "Filing date", "Work description", "Contractor of record", "Job status"],
    notes:
      "Also the best source of general-contractor partnership leads — the contractor of record is named on the filing.",
  },
  {
    id: "transactions",
    name: "Property Transaction Data",
    description:
      "Recorded sales and deed transfers. Drives the recent-purchase and new-ownership triggers that produce the highest-converting direct mail.",
    sourceClass: "Available Public Data",
    status: "Connected (Demo)",
    feeds: ["Property Leads"],
    exampleFields: ["Sale date", "Sale price", "Grantor / grantee entity", "Document type"],
    notes: "Recording lag varies; the demo assumes a 2–6 week delay behind closing.",
  },
  {
    id: "business-web",
    name: "Public Business Websites",
    description:
      "Publicly published company information used to build the partnership pipeline: services offered, coverage area, office locations and listed contact details.",
    sourceClass: "Available Public Data",
    status: "Connected (Demo)",
    feeds: ["Partnership Leads"],
    exampleFields: ["Business name", "Category", "Service area", "Listed office phone", "Listed office email"],
    notes:
      "Collection must respect each site's terms of use and robots directives. The production system should use permitted APIs and licensed directories rather than circumventing any access restriction.",
  },
  {
    id: "google-business",
    name: "Google Business Information",
    description:
      "Business profile data — category, location, hours, public contact details and review volume — used to size and prioritise partnership targets.",
    sourceClass: "Available Public Data",
    status: "Available",
    feeds: ["Partnership Leads"],
    exampleFields: ["Business category", "Location", "Public phone", "Website", "Review count"],
    notes: "Use the official Places API under its terms rather than scraping result pages.",
    estimatedCost: "Usage-based API pricing",
  },
  {
    id: "listings",
    name: "Realtor / Listing Information",
    description:
      "Active and recently sold listings, used for the pre-listing refresh play and for identifying agents with consistent listing volume.",
    sourceClass: "Licensed / Paid Data",
    status: "Requires Review",
    feeds: ["Property Leads", "Partnership Leads"],
    exampleFields: ["List date", "List price", "Listing agent", "Brokerage", "Days on market", "Photos"],
    notes:
      "Listing data is generally governed by MLS or aggregator licensing. Access, redistribution and display rules differ by feed and must be agreed in writing before use.",
    estimatedCost: "Licence + per-seat or per-feed fee",
  },
  {
    id: "property-data-vendor",
    name: "Commercial Property Data Vendor",
    description:
      "Enriched property, valuation and ownership-linkage data — the practical way to identify multi-property landlords behind separate LLCs.",
    sourceClass: "Licensed / Paid Data",
    status: "Not Connected",
    feeds: ["Property Leads"],
    exampleFields: ["Estimated value", "Owner portfolio linkage", "Mortgage / lien records", "Building characteristics"],
    notes:
      "Contract terms usually restrict permitted use, including whether records may be used for marketing. Review before purchase.",
    estimatedCost: "Subscription, typically per record or per market",
  },
  {
    id: "consumer-contact",
    name: "Consumer Contact Append (phone / email)",
    description:
      "Third-party services that attach personal phone numbers or email addresses to a property record.",
    sourceClass: "Requires Permission / Compliance Review",
    status: "Requires Review",
    feeds: ["Property Leads"],
    exampleFields: ["Personal phone", "Personal email", "Match confidence"],
    notes:
      "NOT enabled in this demo, and deliberately not part of the recommended default configuration. Appended consumer contact data carries significant telemarketing, do-not-call and consent obligations, and appending a number is never the same as having permission to call or text it. Review with counsel before considering.",
    estimatedCost: "Per-match pricing",
  },
  {
    id: "crm",
    name: "Internal CRM / Job History",
    description:
      "The company's own record of estimates, jobs, colours, contacts and outcomes. The highest-quality source in the system and the engine behind reactivation.",
    sourceClass: "Customer-Provided Data",
    status: "Connected (Demo)",
    feeds: ["Customers", "Property Leads"],
    exampleFields: ["Past jobs", "Quoted vs. won", "Colour specs", "Contact history", "Consent records"],
    notes: "Existing customers carry real, documented consent — treat this as the top of the priority list.",
  },
  {
    id: "lead-forms",
    name: "Website Lead Forms",
    description:
      "Inbound estimate requests from the company website and landing pages. Highest intent and the cleanest permission position in the whole system.",
    sourceClass: "Customer-Provided Data",
    status: "Connected (Demo)",
    feeds: ["Property Leads"],
    exampleFields: ["Name", "Address", "Project description", "Consent checkbox state", "Timestamp"],
    notes:
      "Capture and store the consent language, timestamp and page version with every submission — that record is what makes phone and SMS outreach defensible.",
  },
  {
    id: "referrals",
    name: "Customer Referrals",
    description:
      "Introductions from past customers, captured through the flywheel. Converts at a far higher rate than any cold channel.",
    sourceClass: "Customer-Provided Data",
    status: "Connected (Demo)",
    feeds: ["Property Leads", "Partnership Leads"],
    exampleFields: ["Referring customer", "Referred contact", "Relationship", "Permission to mention referrer"],
    notes: "Confirm the referrer is comfortable being named before using their name in the approach.",
  },
  {
    id: "ads",
    name: "Advertising Lead Sources (Google / Meta)",
    description:
      "Paid search and social campaigns targeted by borough, neighborhood and homeowner signals, feeding directly into the same pipeline.",
    sourceClass: "Customer-Provided Data",
    status: "Available",
    feeds: ["Property Leads"],
    exampleFields: ["Campaign", "Ad set", "Form fields", "Consent state", "Cost per lead"],
    notes:
      "Audience-level targeting requires no personal data from the property pipeline, which makes it the lowest-compliance-friction paid channel.",
    estimatedCost: "Ad spend + management",
  },
];

export const SOURCE_CLASS_ORDER = [
  "Available Public Data",
  "Licensed / Paid Data",
  "Customer-Provided Data",
  "Requires Permission / Compliance Review",
] as const;
