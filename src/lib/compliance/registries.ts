import type { OutreachChannel } from "@/lib/types";

/**
 * Suppression / registry screening.
 *
 * Before any lead is considered contactable, it is screened against the
 * suppression lists that govern each channel. Two rules are enforced
 * structurally:
 *
 *  1. **Fail closed.** A registry that has not been checked blocks the channel
 *     exactly like a positive hit does. "We didn't look" is never treated as
 *     "it's fine".
 *  2. **Screening happens at discovery and again before contact.** A list that
 *     was clear six weeks ago is not evidence that it is clear today.
 *
 * IMPORTANT: this demo connects to no real registry. Every result below is
 * simulated. Real screening requires registered or subscribed access to each
 * list, and the rules here are configurable safeguards — not legal advice and
 * not a guarantee of compliance. See COMPLIANCE_DISCLAIMER.
 */

export type RegistryId =
  | "national-dnc"
  | "state-dnc"
  | "internal-dnc"
  | "wireless-identification"
  | "known-litigator"
  | "sms-optout"
  | "email-suppression"
  | "no-solicitation";

export type ScreenResult = "clear" | "listed" | "not-checked";

export type ScreenedChannel = "phone" | "sms" | "email" | "door";

export interface RegistryDef {
  id: RegistryId;
  name: string;
  /** Which outreach channel this list governs. */
  channel: ScreenedChannel;
  authority: string;
  description: string;
  /** How the production system would reach it. */
  access: string;
  connectionStatus: "Not connected (demo)" | "Internal — maintained by you";
  /** How often the list must be re-pulled to stay current. */
  cadence: string;
  /** Whether this list applies to businesses as well as consumers. */
  appliesToBusiness: boolean;
}

export const REGISTRIES: RegistryDef[] = [
  {
    id: "national-dnc",
    name: "National Do Not Call Registry",
    channel: "phone",
    authority: "US Federal Trade Commission",
    description:
      "The federal list of consumer phone numbers that have asked not to receive telemarketing calls. The primary screen before any consumer number is dialed.",
    access:
      "Requires registering as a seller/telemarketer and subscribing to the relevant area codes. Access is account-based — it cannot be scraped or bought second-hand.",
    connectionStatus: "Not connected (demo)",
    cadence: "Re-pull on the schedule your subscription requires; treat stale data as unchecked",
    appliesToBusiness: false,
  },
  {
    id: "state-dnc",
    name: "New York State Do Not Call list",
    channel: "phone",
    authority: "New York State",
    description:
      "State-administered do-not-call list. State rules can differ from the federal rules — including on calling hours and exemptions — so this is screened separately rather than assumed to be covered by the federal list.",
    access: "State registration and subscription.",
    connectionStatus: "Not connected (demo)",
    cadence: "Per state subscription terms",
    appliesToBusiness: false,
  },
  {
    id: "internal-dnc",
    name: "Internal do-not-contact list",
    channel: "phone",
    authority: "Slatts Pro Painters",
    description:
      "Anyone who has asked this company directly to stop contacting them. This list is yours to maintain, it never expires, and it outranks every other signal in the system.",
    access: "Maintained in this application. Add an entry the moment a request is made.",
    connectionStatus: "Internal — maintained by you",
    cadence: "Updated immediately on request",
    appliesToBusiness: true,
  },
  {
    id: "wireless-identification",
    name: "Wireless number identification",
    channel: "phone",
    authority: "Commercial data service",
    description:
      "Identifies which numbers are mobile rather than landline. Matters because autodialed or pre-recorded calls to mobile numbers carry heavier obligations than calls to landlines.",
    access: "Commercial subscription.",
    connectionStatus: "Not connected (demo)",
    cadence: "Per lookup, at time of contact",
    appliesToBusiness: true,
  },
  {
    id: "known-litigator",
    name: "Known-litigator / serial-plaintiff list",
    channel: "phone",
    authority: "Commercial data service",
    description:
      "Flags numbers associated with repeat telemarketing litigation. A cheap screen relative to the cost of a single claim.",
    access: "Commercial subscription.",
    connectionStatus: "Not connected (demo)",
    cadence: "Per lookup, at time of contact",
    appliesToBusiness: true,
  },
  {
    id: "sms-optout",
    name: "SMS opt-out / STOP registry",
    channel: "sms",
    authority: "Messaging provider + internal",
    description:
      "Every number that has replied STOP, plus your own record of who granted written consent to be texted. Texting is consent-first: absence of an opt-out is not permission.",
    access: "Messaging provider API plus this application's consent records.",
    connectionStatus: "Not connected (demo)",
    cadence: "Real time",
    appliesToBusiness: true,
  },
  {
    id: "email-suppression",
    name: "Email suppression list",
    channel: "email",
    authority: "Email provider + internal",
    description:
      "Unsubscribes, spam complaints and hard bounces. Sending to a suppressed address damages deliverability for every other message you send.",
    access: "Email provider API plus this application's records.",
    connectionStatus: "Not connected (demo)",
    cadence: "Real time",
    appliesToBusiness: true,
  },
  {
    id: "no-solicitation",
    name: "No-soliciting / no-knock register",
    channel: "door",
    authority: "Municipal + building-level",
    description:
      "Addresses and buildings that prohibit canvassing — posted notices, building access rules, and any municipal register or permit condition that applies to door-to-door work.",
    access:
      "Municipal registers where they exist, building management, and your own crew's field observations.",
    connectionStatus: "Not connected (demo)",
    cadence: "Re-check before each canvassing route",
    appliesToBusiness: false,
  },
];

export const REGISTRY_BY_ID = Object.fromEntries(
  REGISTRIES.map((r) => [r.id, r]),
) as Record<RegistryId, RegistryDef>;

export interface RegistryCheck {
  registryId: RegistryId;
  name: string;
  channel: ScreenedChannel;
  result: ScreenResult;
  /** ISO date the check ran, when it ran at all. */
  checkedAt?: string;
  detail: string;
}

export interface LeadScreening {
  checks: RegistryCheck[];
  screenedAt: string;
  /** Channels with at least one positive hit. */
  blockedChannels: ScreenedChannel[];
  /** Channels where at least one governing list was never checked. */
  unverifiedChannels: ScreenedChannel[];
}

/** Channels that are gated by registry screening at all. */
export const SCREENED_CHANNEL_FOR: Partial<Record<OutreachChannel, ScreenedChannel>> = {
  Phone: "phone",
  SMS: "sms",
  Email: "email",
  "Door-to-Door": "door",
};

/**
 * Rolls per-registry results up into per-channel verdicts.
 *
 * A channel is blocked if any governing list flagged it, and unverified if any
 * governing list was not checked. Both outcomes stop outreach — the difference
 * is only in what the operator has to do about it.
 */
export function summariseScreening(
  checks: RegistryCheck[],
  screenedAt: string,
): LeadScreening {
  const blocked = new Set<ScreenedChannel>();
  const unverified = new Set<ScreenedChannel>();

  for (const check of checks) {
    if (check.result === "listed") blocked.add(check.channel);
    if (check.result === "not-checked") unverified.add(check.channel);
  }

  return {
    checks,
    screenedAt,
    blockedChannels: [...blocked],
    unverifiedChannels: [...unverified],
  };
}

/** Registries that govern a given lead type. */
export function registriesFor(isBusiness: boolean) {
  return REGISTRIES.filter((r) => (isBusiness ? r.appliesToBusiness : true));
}

export const SCREENING_DISCLAIMER =
  "No real registry is connected in this build — every screening result shown is simulated. In production each list requires its own registered or subscribed access, must be re-pulled on its own schedule, and screening is a safeguard rather than a guarantee of compliance. The configuration here must be reviewed against applicable federal, New York State and NYC requirements with qualified counsel before any outreach is enabled.";
