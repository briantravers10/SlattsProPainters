/**
 * Demo-wide configuration.
 *
 * Everything in this file is intentionally centralised so that the
 * "demo" behaviour of the app can be swapped for production behaviour
 * (real data providers, real AI scoring, real outreach) by changing
 * configuration rather than rewriting components.
 */

export const APP = {
  name: "Slatts Pro Painters",
  productName: "PaintPipeline AI",
  tagline: "AI lead generation & market outreach for NYC painting contractors",
  market: "New York City — all five boroughs",
} as const;

/**
 * DEMO MODE.
 *
 * While true the application performs **no** real-world side effects:
 * no email, no SMS, no calls, no scraping, no data purchases.
 * Every "send" action is simulated and logged locally.
 */
export const DEMO_MODE = true;

/** Every outbound integration is explicitly disabled in the demo build. */
export const INTEGRATIONS_ENABLED = {
  email: false,
  sms: false,
  voice: false,
  directMail: false,
  ads: false,
  dataProviders: false,
} as const;

/**
 * Stable "today" for the demo. Computed once at module load and pinned to
 * the start of the day so server render and client hydration agree.
 */
export function demoToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export const DEMO_SEED = 20260420;
