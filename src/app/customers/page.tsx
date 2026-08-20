"use client";

import { useMemo, useState } from "react";
import {
  Repeat,
  Camera,
  Star,
  Users,
  MapPinned,
  Database,
  RefreshCw,
  CheckCircle2,
  Circle,
  Loader2,
  TrendingUp,
  Info,
} from "lucide-react";
import { Badge, Button, Card, CardHeader, PageHeader } from "@/components/ui";
import { StatTile } from "@/components/leads/StatCard";
import { useData } from "@/lib/store/DataProvider";
import { FLYWHEEL_STEPS } from "@/lib/data";
import type { Customer, FlywheelStepId } from "@/lib/types";
import { cn, currency, formatDate, relativeDate } from "@/lib/utils";

const STEP_ICON: Record<FlywheelStepId, typeof Camera> = {
  "job-completed": CheckCircle2,
  photos: Camera,
  review: Star,
  referral: Users,
  "neighbor-campaign": MapPinned,
  crm: Database,
  reactivation: RefreshCw,
};

export default function CustomersPage() {
  const { customers, advanceFlywheel } = useData();
  const [openId, setOpenId] = useState<string | null>(customers[0]?.id ?? null);

  const stats = useMemo(() => {
    const revenue = customers.reduce((s, c) => s + c.jobValue, 0);
    const reviews = customers.filter((c) => c.reviewLeft).length;
    const referrals = customers.reduce((s, c) => s + c.referralsGenerated, 0);
    const neighbors = customers.reduce((s, c) => s + c.neighborLeadsGenerated, 0);
    const photos = customers.reduce((s, c) => s + c.photosCaptured, 0);
    const reactivation = customers.filter((c) => c.reactivationDue).length;
    return { revenue, reviews, referrals, neighbors, photos, reactivation };
  }, [customers]);

  const selected = customers.find((c) => c.id === openId) ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Customer flywheel"
        title="One job should produce far more than one payment"
        description="After a job is won, the system keeps working: photos become portfolio and ad creative, the review builds local ranking, the referral produces a warm lead, and the neighbors on that block become the cheapest leads in the business."
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-6">
        <StatTile label="Completed revenue" value={currency(stats.revenue, true)} sub={`${customers.length} jobs`} />
        <StatTile label="Reviews" value={`${stats.reviews}/${customers.length}`} sub="Google reviews received" />
        <StatTile label="Referrals" value={String(stats.referrals)} sub="Generated from past jobs" />
        <StatTile label="Neighbor leads" value={String(stats.neighbors)} sub="From block campaigns" />
        <StatTile label="Photos captured" value={String(stats.photos)} sub="Portfolio & ad creative" />
        <StatTile label="Reactivation due" value={String(stats.reactivation)} sub="Inside a repaint cycle" />
      </div>

      {/* The flywheel diagram */}
      <Card>
        <CardHeader
          title="The flywheel"
          subtitle="What happens automatically after a job is marked Won"
          icon={<Repeat className="size-4.5" />}
        />
        <div className="px-5 pb-5">
          <ol className="grid gap-2 sm:grid-cols-4 lg:grid-cols-7">
            {FLYWHEEL_STEPS.map((step, i) => {
              const Icon = STEP_ICON[step.id];
              return (
                <li
                  key={step.id}
                  className="relative rounded-xl border border-border bg-surface-2/60 p-3.5 transition-colors hover:border-brand/30"
                >
                  <span className="flex size-8 items-center justify-center rounded-lg bg-brand-soft text-brand">
                    <Icon className="size-4" />
                  </span>
                  <p className="mt-2.5 text-[12.5px] font-semibold leading-snug text-fg">{step.label}</p>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-muted">{step.description}</p>
                  <span className="absolute right-2 top-2 text-[10px] font-semibold text-subtle">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </li>
              );
            })}
          </ol>

          <div className="mt-4 flex gap-2.5 rounded-xl border border-brand/20 bg-brand-soft/40 p-4">
            <TrendingUp className="mt-0.5 size-4.5 shrink-0 text-brand" />
            <div>
              <p className="text-[13.5px] font-semibold text-fg">Why this matters more than lead volume</p>
              <p className="mt-1 text-[13px] leading-relaxed text-muted">
                Across the {customers.length} completed jobs in this demo, the flywheel has already produced{" "}
                <strong className="text-fg">{stats.referrals} referrals</strong>,{" "}
                <strong className="text-fg">{stats.neighbors} neighbor leads</strong>,{" "}
                <strong className="text-fg">{stats.reviews} reviews</strong> and{" "}
                <strong className="text-fg">{stats.photos} portfolio photos</strong> — with no additional
                advertising spend. A single completed job is a revenue event, a marketing asset, a
                ranking signal and a source of the next three jobs.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Customer list + detail */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <Card className="overflow-hidden">
          <CardHeader title="Customers" subtitle="Completed jobs stored in the CRM" />
          <ul className="max-h-[620px] divide-y divide-border overflow-y-auto">
            {customers.map((c) => {
              const progress = c.flywheel.filter((f) => f.status === "complete").length;
              return (
                <li key={c.id}>
                  <button
                    onClick={() => setOpenId(c.id)}
                    className={cn(
                      "w-full px-5 py-3 text-left transition-colors",
                      openId === c.id ? "bg-brand-soft" : "hover:bg-surface-2",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className={cn("truncate text-[13.5px] font-medium", openId === c.id ? "text-brand" : "text-fg")}>
                          {c.name}
                        </p>
                        <p className="mt-0.5 truncate text-[12px] text-subtle">
                          {c.neighborhood}, {c.borough}
                        </p>
                      </div>
                      <span className="shrink-0 text-[12.5px] font-medium tabular-nums text-fg">
                        {currency(c.jobValue, true)}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-1 flex-1 overflow-hidden rounded-full bg-surface-3">
                        <div
                          className="h-full rounded-full bg-brand transition-[width] duration-500"
                          style={{ width: `${(progress / 7) * 100}%` }}
                        />
                      </div>
                      <span className="text-[11px] tabular-nums text-subtle">{progress}/7</span>
                      {c.reactivationDue && <Badge tone="warning">Reactivate</Badge>}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>

        {selected && <CustomerDetail customer={selected} onAdvance={() => advanceFlywheel(selected.id)} />}
      </div>
    </div>
  );
}

function CustomerDetail({ customer, onAdvance }: { customer: Customer; onAdvance: () => void }) {
  const canAdvance = customer.flywheel.some((f) => f.status === "in-progress");

  return (
    <Card className="overflow-hidden">
      <CardHeader
        title={customer.name}
        subtitle={`${customer.jobType} · completed ${formatDate(customer.completedDate)}`}
        action={
          canAdvance ? (
            <Button size="sm" variant="primary" onClick={onAdvance}>
              Advance flywheel
            </Button>
          ) : (
            <Badge tone="success">Flywheel complete</Badge>
          )
        }
      />

      <div className="grid grid-cols-2 gap-3 px-5 pb-4 sm:grid-cols-4">
        <MiniStat label="Job value" value={currency(customer.jobValue)} />
        <MiniStat
          label="Review"
          value={customer.reviewLeft ? `${customer.reviewStars}★` : "Not yet"}
        />
        <MiniStat label="Referrals" value={String(customer.referralsGenerated)} />
        <MiniStat label="Neighbor leads" value={String(customer.neighborLeadsGenerated)} />
      </div>

      <div className="border-t border-border px-5 py-4">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.07em] text-subtle">
          Flywheel progress
        </p>
        <ol className="relative">
          <span className="absolute bottom-4 left-[13px] top-2 w-px bg-border" />
          {customer.flywheel.map((state) => {
            const meta = FLYWHEEL_STEPS.find((s) => s.id === state.step)!;
            const Icon = STEP_ICON[state.step];
            return (
              <li key={state.step} className="relative flex gap-3 pb-3.5 last:pb-0">
                <span
                  className={cn(
                    "relative z-10 flex size-[27px] shrink-0 items-center justify-center rounded-full border-2 border-[var(--surface)]",
                    state.status === "complete"
                      ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400"
                      : state.status === "in-progress"
                        ? "bg-brand-soft text-brand"
                        : "bg-surface-2 text-subtle",
                  )}
                >
                  {state.status === "complete" ? (
                    <CheckCircle2 className="size-3.5" />
                  ) : state.status === "in-progress" ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Circle className="size-3" />
                  )}
                </span>
                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <p
                      className={cn(
                        "text-[13.5px] font-medium",
                        state.status === "pending" ? "text-subtle" : "text-fg",
                      )}
                    >
                      {meta.label}
                    </p>
                    {state.date && <span className="text-[11.5px] text-subtle">{relativeDate(state.date)}</span>}
                  </div>
                  <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted">
                    {state.detail ?? meta.description}
                  </p>
                </div>
                <Icon className="mt-1 size-3.5 shrink-0 text-subtle" />
              </li>
            );
          })}
        </ol>
      </div>

      {customer.reactivationDue && (
        <div className="mx-5 mb-4 rounded-xl border border-amber-300/60 bg-amber-50/70 p-4 dark:border-amber-500/25 dark:bg-amber-500/5">
          <p className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.07em] text-amber-700 dark:text-amber-400">
            <RefreshCw className="size-3.5" /> Reactivation opportunity
          </p>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-fg">{customer.reactivationReason}</p>
          <p className="mt-1 text-[12px] text-muted">
            Due {formatDate(customer.reactivationDue)} · {relativeDate(customer.reactivationDue)}
          </p>
        </div>
      )}

      <div className="border-t border-border px-5 py-4">
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.07em] text-subtle">Notes</p>
        <p className="text-[13px] leading-relaxed text-muted">{customer.notes}</p>
      </div>

      <div className="flex gap-2.5 border-t border-border bg-surface-2/50 px-5 py-3.5">
        <Info className="mt-0.5 size-4 shrink-0 text-subtle" />
        <p className="text-[12px] leading-relaxed text-subtle">
          Customers hold documented consent from their signed work agreement, which is why they are the
          only group in the system eligible for every direct channel by default. Even so, nothing is
          sent from this demo build.
        </p>
      </div>
    </Card>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface-inset px-3 py-2.5">
      <p className="text-[11px] uppercase tracking-[0.06em] text-subtle">{label}</p>
      <p className="mt-1 text-[16px] font-semibold tabular-nums leading-none text-fg">{value}</p>
    </div>
  );
}
