import { createRng } from "@/lib/rng";
import { daysFromToday } from "@/lib/utils";
import {
  REGISTRIES,
  registriesFor,
  summariseScreening,
  type LeadScreening,
  type RegistryCheck,
  type ScreenResult,
} from "./registries";

/**
 * Screening engine.
 *
 * The demo simulates results deterministically from the lead id so the same
 * lead always screens the same way. A production build replaces this one
 * function with real calls to each subscribed list — nothing downstream
 * changes, because everything consumes {@link LeadScreening}.
 */
export interface ScreeningEngine {
  readonly id: string;
  readonly label: string;
  screen(input: { leadId: string; isBusiness: boolean; hasConsent: boolean }): LeadScreening;
}

const NOT_CHECKED_DETAIL: Record<string, string> = {
  "national-dnc": "Not screened — no registry subscription is connected in this build",
  "state-dnc": "Not screened — no state subscription is connected in this build",
  "wireless-identification": "Line type unknown — treat as mobile until identified",
  "known-litigator": "Not screened — no litigator service is connected in this build",
  "no-solicitation": "Building and posted-notice status not yet verified in the field",
};

export const simulatedScreeningEngine: ScreeningEngine = {
  id: "simulated-v1",
  label: "Compliance Agent · simulated screening",

  screen({ leadId, isBusiness, hasConsent }) {
    // Deterministic per lead so results are stable across reloads.
    const seed = [...leadId].reduce((acc, ch) => acc + ch.charCodeAt(0) * 31, 7);
    const rng = createRng(seed);
    const applicable = registriesFor(isBusiness);

    const checks: RegistryCheck[] = REGISTRIES.map((registry): RegistryCheck => {
      const governs = applicable.some((r) => r.id === registry.id);

      // Lists the company maintains itself are always current — that is the
      // point of holding them internally.
      const internal = registry.connectionStatus === "Internal — maintained by you";

      let result: ScreenResult;
      if (!governs) {
        result = "clear";
      } else if (internal) {
        result = rng.bool(0.04) ? "listed" : "clear";
      } else if (registry.id === "sms-optout") {
        // Texting is consent-first: without recorded consent there is nothing
        // authorising a message, regardless of opt-out state.
        result = hasConsent ? (rng.bool(0.08) ? "listed" : "clear") : "not-checked";
      } else if (registry.id === "email-suppression") {
        result = rng.bool(0.07) ? "listed" : "clear";
      } else if (hasConsent) {
        // A lead that came through a form or referral has been screened as
        // part of intake.
        result = rng.bool(0.06) ? "listed" : "clear";
      } else {
        // The honest default for a lead built from a property record: nobody
        // has checked anything yet.
        result = rng.bool(0.18) ? "listed" : "not-checked";
      }

      const checkedAt = result === "not-checked" ? undefined : daysFromToday(-rng.int(0, 5));

      return {
        registryId: registry.id,
        name: registry.name,
        channel: registry.channel,
        result,
        checkedAt,
        detail:
          result === "listed"
            ? `Match found — this lead appears on ${registry.name}. ${registry.channel === "door" ? "Canvassing" : registry.channel === "sms" ? "Texting" : registry.channel === "email" ? "Emailing" : "Calling"} is blocked.`
            : result === "clear"
              ? `No match on ${registry.name} at the time of screening.`
              : (NOT_CHECKED_DETAIL[registry.id] ??
                `Not screened against ${registry.name} in this build`),
      };
    });

    return summariseScreening(checks, daysFromToday(-rng.int(0, 3)));
  },
};

/** Active engine — swap for a real implementation in production. */
export const activeScreeningEngine = simulatedScreeningEngine;

export function screenLead(leadId: string, isBusiness: boolean, hasConsent: boolean) {
  return activeScreeningEngine.screen({ leadId, isBusiness, hasConsent });
}
