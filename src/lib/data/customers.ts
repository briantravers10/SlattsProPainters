import { createRng } from "@/lib/rng";
import { NEIGHBORHOODS } from "@/lib/geo/nyc";
import type { Customer, FlywheelState, FlywheelStepId } from "@/lib/types";
import { daysFromToday } from "@/lib/utils";
import { CUSTOMER_NAMES } from "./names";

export const FLYWHEEL_STEPS: { id: FlywheelStepId; label: string; description: string; icon: string }[] = [
  { id: "job-completed", label: "Job Completed", description: "Work signed off and invoiced.", icon: "check" },
  { id: "photos", label: "Before / After Photos", description: "Portfolio and ad creative captured on site.", icon: "camera" },
  { id: "review", label: "Google Review Request", description: "Review ask sent while satisfaction is highest.", icon: "star" },
  { id: "referral", label: "Referral Request", description: "Customer asked for one introduction.", icon: "users" },
  { id: "neighbor-campaign", label: "Neighbor Campaign", description: "Nearby addresses targeted with proof-of-work.", icon: "map" },
  { id: "crm", label: "Stored in CRM", description: "Full job record retained for future work.", icon: "database" },
  { id: "reactivation", label: "Future Reactivation", description: "Scheduled re-contact at the next repaint cycle.", icon: "refresh" },
];

const JOB_TYPES = [
  "Full interior repaint — 3BR",
  "Exterior trim, cornice and entry",
  "Hallway and lobby common areas",
  "Unit turnover repaint (4 units)",
  "Kitchen and bath refinish",
  "Full exterior — two-family",
  "Brownstone parlour floor",
  "Storefront and signage repaint",
];

const REACTIVATION_REASONS = [
  "Interior repaint cycle reaches 4 years next quarter",
  "Exterior scope was deferred at the time of the original job",
  "Customer mentioned a basement finish planned for next spring",
  "Landlord portfolio has two more units approaching turnover",
  "Original quote included an optional trim package never scheduled",
];

export function generateCustomers(seed: number, count = 12): Customer[] {
  const rng = createRng(seed);

  return Array.from({ length: count }, (_, i) => {
    const nb = NEIGHBORHOODS[(i * 5 + 2) % NEIGHBORHOODS.length];
    const completedDaysAgo = rng.int(8, 520);
    const completedDate = daysFromToday(-completedDaysAgo);
    const jobValue = Math.round(rng.int(3400, 46000) / 100) * 100;

    // How far around the flywheel this customer has travelled.
    const progress = rng.int(2, 7);
    const reviewLeft = progress >= 3 && rng.bool(0.72);
    const referralsGenerated = progress >= 4 ? rng.int(0, 3) : 0;
    const neighborLeadsGenerated = progress >= 5 ? rng.int(0, 6) : 0;
    const photosCaptured = progress >= 2 ? rng.int(6, 34) : 0;

    const flywheel: FlywheelState[] = FLYWHEEL_STEPS.map((step, idx): FlywheelState => {
      if (idx < progress - 1) {
        return {
          step: step.id,
          status: "complete",
          date: daysFromToday(-completedDaysAgo + idx * rng.int(2, 9)),
          detail: flywheelDetail(step.id, {
            reviewLeft,
            referralsGenerated,
            neighborLeadsGenerated,
            photosCaptured,
          }),
        };
      }
      if (idx === progress - 1) {
        return { step: step.id, status: "in-progress", detail: "Currently in progress" };
      }
      return { step: step.id, status: "pending" };
    });

    const reactivationDue = completedDaysAgo > 200 ? daysFromToday(rng.int(-20, 90)) : undefined;

    return {
      id: `C-${3000 + i}`,
      name: CUSTOMER_NAMES[i % CUSTOMER_NAMES.length],
      address: `${rng.int(20, 980)} ${nb.name} area (demo)`,
      borough: nb.borough,
      neighborhood: nb.name,
      lat: nb.lat + rng.float(-0.008, 0.008),
      lng: nb.lng + rng.float(-0.01, 0.01),
      jobType: rng.pick(JOB_TYPES),
      jobValue,
      completedDate,
      reviewLeft,
      reviewStars: reviewLeft ? rng.weighted([[5, 7], [4, 3]]) : undefined,
      referralsGenerated,
      neighborLeadsGenerated,
      photosCaptured,
      reactivationDue,
      reactivationReason: reactivationDue ? rng.pick(REACTIVATION_REASONS) : undefined,
      flywheel,
      permissions: {
        phone: "Consented",
        sms: rng.bool(0.6) ? "Consented" : "Not Consented",
        email: "Eligible",
        directMail: "Eligible",
        door: "Eligible",
        source: "Customer",
        doNotContact: false,
        consentDate: completedDate,
        consentSource: "Signed work agreement (demo)",
      },
      notes: rng.pick([
        "Repeat customer — second job at the same address.",
        "Strong candidate for the neighbor campaign; corner property with high visibility.",
        "Requested a reminder before the next exterior season.",
        "Referred one neighbor already; ask again after the review lands.",
        "Photos from this job are the best exterior set in the portfolio.",
      ]),
    };
  });
}

function flywheelDetail(
  step: FlywheelStepId,
  stats: {
    reviewLeft: boolean;
    referralsGenerated: number;
    neighborLeadsGenerated: number;
    photosCaptured: number;
  },
): string {
  switch (step) {
    case "job-completed":
      return "Signed off and invoiced";
    case "photos":
      return `${stats.photosCaptured} before/after photos captured`;
    case "review":
      return stats.reviewLeft ? "Google review received" : "Review request sent — no review yet";
    case "referral":
      return stats.referralsGenerated > 0
        ? `${stats.referralsGenerated} referral${stats.referralsGenerated === 1 ? "" : "s"} generated`
        : "Referral request sent";
    case "neighbor-campaign":
      return stats.neighborLeadsGenerated > 0
        ? `${stats.neighborLeadsGenerated} neighbor leads created`
        : "Neighbor drop scheduled";
    case "crm":
      return "Job record, colour spec and photos retained";
    case "reactivation":
      return "Scheduled for the next repaint cycle";
  }
}
