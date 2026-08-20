import type { ContactPermissions, Lead, OutreachChannel } from "@/lib/types";
import { REGISTRY_BY_ID, SCREENED_CHANNEL_FOR, type ScreenedChannel } from "./registries";

/**
 * Compliance layer.
 *
 * Two principles are enforced structurally rather than by convention:
 *
 *  1. Discovering a person's information is NEVER treated as permission to
 *     contact them. Permission is a separate, explicit field.
 *  2. Consumer (residential) outreach and B2B outreach are gated by
 *     different default rules.
 *  3. Suppression screening FAILS CLOSED. A registry that has not been checked
 *     blocks the channel exactly as a positive hit does — "we didn't look" is
 *     never treated as "it's fine". Screening therefore outranks permission:
 *     consent does not survive a do-not-call match.
 *
 * This is a configurable safeguard, not legal advice. The rules below must be
 * reviewed against applicable federal, New York State and New York City
 * requirements — and against the rules of each channel and data provider —
 * before any production use.
 */

export const COMPLIANCE_DISCLAIMER =
  "This demo does not provide legal advice or legal conclusions. The rules shown here are configurable safeguards only, and must be reviewed against applicable federal, New York State and New York City requirements — including telemarketing, do-not-call, SMS consent, email, and data-licensing obligations — before any real outreach is enabled.";

export type GateStatus = "allowed" | "review" | "blocked";

export interface ChannelGate {
  channel: OutreachChannel;
  status: GateStatus;
  reason: string;
  /** What would need to be true to move this to "allowed". */
  requirement?: string;
}

/** Default permission profile for a lead sourced only from a property record. */
export function defaultPropertyRecordPermissions(): ContactPermissions {
  return {
    phone: "Unknown",
    sms: "Not Consented",
    email: "Unknown",
    directMail: "Eligible",
    door: "Unknown",
    source: "Property Record",
    doNotContact: false,
  };
}

/** Default permission profile for a publicly listed business. */
export function defaultBusinessPermissions(): ContactPermissions {
  return {
    phone: "Unknown",
    sms: "Not Consented",
    email: "Eligible",
    directMail: "Eligible",
    door: "Eligible",
    source: "Public Business Information",
    doNotContact: false,
  };
}

const CONSUMER_ONLY_CHANNELS: OutreachChannel[] = [
  "Direct Mail",
  "Phone",
  "Email",
  "SMS",
  "Door-to-Door",
];

/**
 * Evaluate every channel for a lead and return an explicit allow/review/block
 * decision with a human-readable reason.
 */
export function evaluateChannels(lead: Lead): ChannelGate[] {
  const p = lead.permissions;
  const isConsumer = lead.kind === "property" && lead.ownerType === "Individual";

  const gates: ChannelGate[] = [];

  const add = (
    channel: OutreachChannel,
    status: GateStatus,
    reason: string,
    requirement?: string,
  ) => gates.push({ channel, status, reason, requirement });

  if (p.doNotContact) {
    return CONSUMER_ONLY_CHANNELS.concat([
      "Referral",
      "Realtor Partnership",
      "Property Manager Partnership",
      "Contractor Partnership",
      "Google Ads",
      "Meta Ads",
    ]).map((channel) => ({
      channel,
      status: "blocked" as GateStatus,
      reason: "Lead is flagged DO NOT CONTACT. All direct outreach is blocked.",
    }));
  }

  // Phone
  if (p.phone === "DNC") {
    add("Phone", "blocked", "Number is on a do-not-call list.");
  } else if (p.phone === "Consented") {
    add("Phone", "allowed", "Prior express consent recorded.", undefined);
  } else if (p.phone === "Cleared") {
    add("Phone", "review", "Number was screened but no consent is on file.", "Confirm calling-time rules and internal DNC before dialing.");
  } else {
    add("Phone", "blocked", "No phone permission established. Discovery is not consent.", "Obtain the number from a permitted source and screen it against DNC lists.");
  }

  // SMS
  if (p.sms === "Consented") {
    add("SMS", "allowed", "Written consent to text is recorded.");
  } else {
    add("SMS", "blocked", "SMS requires prior express written consent, which is not on file.", "Capture opt-in through a lead form or customer agreement.");
  }

  // Email
  if (p.email === "Suppressed") {
    add("Email", "blocked", "Address is suppressed (unsubscribe or bounce).");
  } else if (p.email === "Eligible") {
    add(
      "Email",
      isConsumer ? "review" : "allowed",
      isConsumer
        ? "Consumer address — commercial email rules and opt-out handling apply."
        : "Publicly listed business address with working opt-out.",
      isConsumer ? "Confirm the address came from a permitted source." : undefined,
    );
  } else {
    add("Email", "blocked", "No verified, permitted email address on file.", "Collect via lead form, referral, or public business listing.");
  }

  // Direct mail
  if (p.directMail === "Restricted") {
    add("Direct Mail", "blocked", "Address is flagged as restricted for mail.");
  } else {
    add("Direct Mail", "allowed", "Physical mail to a property address is the lowest-friction channel for property-record leads.");
  }

  // Door
  if (p.door === "Restricted") {
    add("Door-to-Door", "blocked", "Address is flagged no-soliciting or restricted-access.");
  } else if (p.door === "Eligible") {
    add("Door-to-Door", "review", "Canvassing may require a permit and must respect posted no-soliciting notices.", "Verify local canvassing rules and building access before a route is scheduled.");
  } else {
    add("Door-to-Door", "review", "Door eligibility has not been checked for this address.", "Compliance Agent must verify building type and posted notices.");
  }

  // Non-direct channels
  add("Google Ads", "allowed", "Audience-level advertising — no personal contact required.");
  add("Meta Ads", "allowed", "Audience-level advertising — no personal contact required.");
  add("Referral", "allowed", "Warm introduction through an existing relationship.");
  add("Realtor Partnership", "allowed", "B2B relationship channel — the agent, not the resident, is contacted.");
  add("Property Manager Partnership", "allowed", "B2B relationship channel.");
  add("Contractor Partnership", "allowed", "B2B relationship channel.");

  // Suppression screening is applied last and can only ever downgrade a gate.
  // A channel that permission would allow is still blocked by a registry hit
  // or by never having been screened.
  return gates.map((gate) => {
    const verdict = registryVerdict(lead, gate.channel);
    if (!verdict) return gate;
    if (gate.status === "blocked") return gate; // already blocked for another reason
    return {
      channel: gate.channel,
      status: verdict.status,
      reason: verdict.reason,
      requirement: verdict.requirement,
    };
  });
}

/**
 * Registry verdict for one channel.
 *
 * Returns null when no suppression list governs the channel (advertising and
 * partnership channels reach no individual, so nothing to screen).
 */
function registryVerdict(
  lead: Lead,
  channel: OutreachChannel,
): { status: GateStatus; reason: string; requirement?: string } | null {
  const screened: ScreenedChannel | undefined = SCREENED_CHANNEL_FOR[channel];
  if (!screened) return null;

  const relevant = lead.screening.checks.filter((c) => c.channel === screened);
  if (relevant.length === 0) return null;

  const hit = relevant.find((c) => c.result === "listed");
  if (hit) {
    return {
      status: "blocked",
      reason: `Suppressed — this lead matched ${hit.name}.`,
      requirement: `Remove ${channel.toLowerCase()} from the plan for this lead. A match is not something to work around.`,
    };
  }

  const unchecked = relevant.filter((c) => c.result === "not-checked");
  if (unchecked.length > 0) {
    const names = unchecked.map((c) => REGISTRY_BY_ID[c.registryId].name).join(", ");
    return {
      status: "blocked",
      reason: `Not screened against ${names}. Unscreened is treated as blocked, not as permitted.`,
      requirement: `Connect and run ${names}, then re-screen this lead.`,
    };
  }

  return null;
}

export function channelStatus(lead: Lead, channel: OutreachChannel): GateStatus {
  return evaluateChannels(lead).find((g) => g.channel === channel)?.status ?? "review";
}

/** Compact summary used on list rows and cards. */
export function complianceSummary(lead: Lead) {
  const gates = evaluateChannels(lead);
  const allowed = gates.filter((g) => g.status === "allowed").length;
  const blocked = gates.filter((g) => g.status === "blocked").length;
  const review = gates.filter((g) => g.status === "review").length;
  return {
    allowed,
    blocked,
    review,
    doNotContact: lead.permissions.doNotContact,
    /** Highest-friction warning to surface inline. */
    headline: lead.permissions.doNotContact
      ? "DO NOT CONTACT"
      : blocked > 0
        ? `${blocked} channel${blocked === 1 ? "" : "s"} blocked`
        : `${allowed} channels cleared`,
  };
}

export const PERMISSION_FIELD_LABELS: {
  key: keyof ContactPermissions;
  label: string;
  options: string[];
}[] = [
  { key: "phone", label: "Phone", options: ["Unknown", "Cleared", "DNC", "Consented"] },
  { key: "sms", label: "SMS", options: ["Not Consented", "Consented"] },
  { key: "email", label: "Email", options: ["Unknown", "Eligible", "Suppressed"] },
  { key: "directMail", label: "Direct Mail", options: ["Eligible", "Restricted"] },
  { key: "door", label: "Door", options: ["Unknown", "Eligible", "Restricted"] },
  {
    key: "source",
    label: "Source",
    options: [
      "Property Record",
      "Lead Form",
      "Referral",
      "Customer",
      "Public Business Information",
    ],
  },
];

/** Values that should be rendered as a warning rather than a neutral chip. */
export const NEGATIVE_PERMISSION_VALUES = new Set([
  "DNC",
  "Suppressed",
  "Restricted",
  "Not Consented",
]);

export const NEUTRAL_PERMISSION_VALUES = new Set(["Unknown"]);
