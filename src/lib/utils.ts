import { demoToday } from "./config";
import type { ScoreBand } from "./types";

export function cn(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

export const currency = (n: number, compact = false) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
    notation: compact ? "compact" : "standard",
  }).format(n);

export const number = (n: number) => new Intl.NumberFormat("en-US").format(n);

export function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function daysFromToday(days: number) {
  const d = demoToday();
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export function daysAgo(iso: string | undefined): number | undefined {
  if (!iso) return undefined;
  const then = new Date(iso + "T00:00:00");
  const now = demoToday();
  return Math.round((now.getTime() - then.getTime()) / 86_400_000);
}

export function formatDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function relativeDate(iso?: string) {
  const d = daysAgo(iso);
  if (d === undefined) return "—";
  if (d === 0) return "Today";
  if (d === 1) return "Yesterday";
  if (d === -1) return "Tomorrow";
  if (d < 0) return `In ${Math.abs(d)} days`;
  if (d < 30) return `${d} days ago`;
  if (d < 365) return `${Math.round(d / 30)} mo ago`;
  return `${(d / 365).toFixed(1)} yrs ago`;
}

export function isOverdue(iso?: string) {
  const d = daysAgo(iso);
  return d !== undefined && d > 0;
}

export function isDueWithin(iso: string | undefined, days: number) {
  const d = daysAgo(iso);
  return d !== undefined && d >= -days;
}

export function scoreBand(score: number): ScoreBand {
  if (score >= 90) return "Extremely High Opportunity";
  if (score >= 75) return "High Opportunity";
  if (score >= 60) return "Medium Opportunity";
  return "Low Priority";
}

/** Tailwind class fragments per score band, used by badges and rings. */
export const BAND_STYLES: Record<
  ScoreBand,
  { text: string; bg: string; ring: string; dot: string; hex: string }
> = {
  "Extremely High Opportunity": {
    text: "text-emerald-700 dark:text-emerald-300",
    bg: "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/25",
    ring: "stroke-emerald-500",
    dot: "bg-emerald-500",
    hex: "#10b981",
  },
  "High Opportunity": {
    text: "text-sky-700 dark:text-sky-300",
    bg: "bg-sky-50 dark:bg-sky-500/10 border-sky-200 dark:border-sky-500/25",
    ring: "stroke-sky-500",
    dot: "bg-sky-500",
    hex: "#0ea5e9",
  },
  "Medium Opportunity": {
    text: "text-amber-700 dark:text-amber-300",
    bg: "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/25",
    ring: "stroke-amber-500",
    dot: "bg-amber-500",
    hex: "#f59e0b",
  },
  "Low Priority": {
    text: "text-slate-600 dark:text-slate-400",
    bg: "bg-slate-50 dark:bg-slate-500/10 border-slate-200 dark:border-slate-500/25",
    ring: "stroke-slate-400",
    dot: "bg-slate-400",
    hex: "#94a3b8",
  },
};

export function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function initials(s: string) {
  return s
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}
