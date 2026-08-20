"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Dashboard focus card — the "where do I spend this week" tiles. */
export function FocusCard({
  count,
  label,
  detail,
  icon: Icon,
  href,
  tone = "brand",
}: {
  count: number | string;
  label: string;
  detail: string;
  icon: LucideIcon;
  href: string;
  tone?: "brand" | "emerald" | "amber" | "sky" | "violet" | "rose";
}) {
  const tones: Record<string, string> = {
    brand: "bg-brand-soft text-brand",
    emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300",
    sky: "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300",
    violet: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300",
    rose: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300",
  };

  return (
    <Link
      href={href}
      className="card group relative flex flex-col gap-3 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <span className={cn("flex size-9 items-center justify-center rounded-xl", tones[tone])}>
          <Icon className="size-4.5" />
        </span>
        <ArrowUpRight className="size-4 text-subtle opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      <div>
        <p className="text-[28px] font-semibold leading-none tracking-[-0.03em] text-fg">{count}</p>
        <p className="mt-1.5 text-[13.5px] font-medium leading-snug text-fg">{label}</p>
        <p className="mt-1 text-[12px] leading-relaxed text-muted">{detail}</p>
      </div>
    </Link>
  );
}

/** Compact KPI tile used in the metrics strip. */
export function StatTile({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="card p-4">
      <p className="text-[11.5px] font-medium uppercase tracking-[0.08em] text-subtle">{label}</p>
      <p
        className="mt-2 text-[24px] font-semibold leading-none tracking-[-0.025em]"
        style={{ color: accent }}
      >
        {value}
      </p>
      {sub && <p className="mt-1.5 text-[12px] leading-relaxed text-muted">{sub}</p>}
    </div>
  );
}
