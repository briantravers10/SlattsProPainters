"use client";

import type { LeadStage } from "@/lib/types";
import { cn } from "@/lib/utils";

const STAGE_TONE: Record<LeadStage, string> = {
  Discovered: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-500/10 dark:text-slate-300 dark:border-slate-500/20",
  Researching: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-500/25",
  Qualified: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/25",
  "Ready for Outreach": "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/25",
  Contacted: "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-300 dark:border-cyan-500/25",
  "Follow-Up": "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/25",
  "Estimate Requested": "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-300 dark:border-orange-500/25",
  "Estimate Sent": "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-500/10 dark:text-teal-300 dark:border-teal-500/25",
  Won: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/25",
  Lost: "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/25",
};

export const STAGE_ACCENT: Record<LeadStage, string> = {
  Discovered: "#94a3b8",
  Researching: "#8b5cf6",
  Qualified: "#6366f1",
  "Ready for Outreach": "#0ea5e9",
  Contacted: "#06b6d4",
  "Follow-Up": "#f59e0b",
  "Estimate Requested": "#f97316",
  "Estimate Sent": "#14b8a6",
  Won: "#10b981",
  Lost: "#f43f5e",
};

export function StageBadge({ stage, className }: { stage: LeadStage; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[11.5px] font-medium whitespace-nowrap",
        STAGE_TONE[stage],
        className,
      )}
    >
      {stage}
    </span>
  );
}
