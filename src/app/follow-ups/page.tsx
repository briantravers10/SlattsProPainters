"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarClock,
  AlertCircle,
  CheckCircle2,
  Home,
  Building2,
  Phone,
  Mail,
  ArrowRight,
  Ban,
} from "lucide-react";
import { Badge, Button, Card, CardHeader, EmptyState, PageHeader } from "@/components/ui";
import { StageBadge } from "@/components/ui/StageBadge";
import { ScorePill } from "@/components/ui/ScoreIndicators";
import { StatTile } from "@/components/leads/StatCard";
import { useData } from "@/lib/store/DataProvider";
import { channelStatus } from "@/lib/compliance";
import type { Lead } from "@/lib/types";
import { cn, currency, daysAgo, formatDate, relativeDate } from "@/lib/utils";

type Bucket = "overdue" | "today" | "week" | "later";

const BUCKET_META: Record<Bucket, { label: string; description: string; tone: string }> = {
  overdue: {
    label: "Overdue",
    description: "Should already have been handled — clear these before anything else",
    tone: "text-rose-600 dark:text-rose-400",
  },
  today: { label: "Due today", description: "On the list for today", tone: "text-amber-600 dark:text-amber-400" },
  week: { label: "Next 7 days", description: "Coming up this week", tone: "text-sky-600 dark:text-sky-400" },
  later: { label: "Later", description: "Scheduled beyond this week", tone: "text-muted" },
};

function bucketFor(iso?: string): Bucket | null {
  const d = daysAgo(iso);
  if (d === undefined) return null;
  if (d > 0) return "overdue";
  if (d === 0) return "today";
  if (d >= -7) return "week";
  return "later";
}

export default function FollowUpsPage() {
  const { propertyLeads, businessLeads, moveStage } = useData();
  const [done, setDone] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<"all" | "property" | "business">("all");

  const buckets = useMemo(() => {
    const source: Lead[] =
      filter === "property" ? propertyLeads : filter === "business" ? businessLeads : [...propertyLeads, ...businessLeads];
    const map: Record<Bucket, Lead[]> = { overdue: [], today: [], week: [], later: [] };
    for (const l of source) {
      const b = bucketFor(l.followUpDate);
      if (b) map[b].push(l);
    }
    for (const k of Object.keys(map) as Bucket[]) {
      map[k].sort((a, b) => (a.followUpDate ?? "").localeCompare(b.followUpDate ?? "") || b.score.score - a.score.score);
    }
    return map;
  }, [propertyLeads, businessLeads, filter]);

  const totalDue = buckets.overdue.length + buckets.today.length;
  const allValue = [...buckets.overdue, ...buckets.today].reduce(
    (s, l) => s + (l.kind === "property" ? (l.estimatedValueLow + l.estimatedValueHigh) / 2 : l.estimatedAnnualOpportunity),
    0,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Follow-ups"
        title="Today's list"
        description="Most pipeline is lost to silence, not rejection. The Follow-Up Agent keeps a dated touch on every live lead so nothing quietly dies — overdue items sit at the top."
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile label="Due now" value={String(totalDue)} sub="Overdue plus due today" />
        <StatTile label="Overdue" value={String(buckets.overdue.length)} sub="Handle these first" />
        <StatTile label="Next 7 days" value={String(buckets.week.length)} sub="Coming up" />
        <StatTile label="Value in play" value={currency(allValue, true)} sub="Across everything due now" />
      </div>

      <div className="flex gap-1 rounded-xl border border-border bg-surface p-1">
        {([
          { id: "all", label: "All" },
          { id: "property", label: "Property" },
          { id: "business", label: "Partnership" },
        ] as const).map((t) => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id)}
            className={cn(
              "flex-1 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
              filter === t.id ? "bg-brand-soft text-brand" : "text-muted hover:bg-surface-2 hover:text-fg",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {(Object.keys(BUCKET_META) as Bucket[]).map((bucket) => {
        const leads = buckets[bucket];
        if (!leads.length) return null;
        const meta = BUCKET_META[bucket];
        return (
          <Card key={bucket} className="overflow-hidden">
            <CardHeader
              title={
                <span className="flex items-center gap-2">
                  <span className={meta.tone}>{meta.label}</span>
                  <Badge tone="muted">{leads.length}</Badge>
                </span>
              }
              subtitle={meta.description}
              icon={
                bucket === "overdue" ? (
                  <AlertCircle className="size-4.5" />
                ) : (
                  <CalendarClock className="size-4.5" />
                )
              }
            />
            <ul className="divide-y divide-border">
              {leads.map((lead) => (
                <FollowUpRow
                  key={lead.id}
                  lead={lead}
                  done={done.has(lead.id)}
                  onDone={() => {
                    setDone((s) => new Set(s).add(lead.id));
                    moveStage(lead.id, "Follow-Up");
                  }}
                />
              ))}
            </ul>
          </Card>
        );
      })}

      {totalDue === 0 && buckets.week.length === 0 && buckets.later.length === 0 && (
        <Card>
          <EmptyState
            icon={<CheckCircle2 className="size-5" />}
            title="Nothing scheduled"
            description="No follow-ups are on the calendar for this filter. Ask the AI Manager for the highest-value opportunities to add to the pipeline."
            action={
              <Link href="/ai-manager">
                <Button variant="primary">Open the AI Manager</Button>
              </Link>
            }
          />
        </Card>
      )}
    </div>
  );
}

function FollowUpRow({ lead, done, onDone }: { lead: Lead; done: boolean; onDone: () => void }) {
  const href = lead.kind === "property" ? `/property-leads/${lead.id}` : `/partnership-leads/${lead.id}`;
  const title = lead.kind === "property" ? lead.address : lead.businessName;
  const sub =
    lead.kind === "property"
      ? `${lead.neighborhood}, ${lead.borough} · ${lead.triggers[0]?.type ?? ""}`
      : `${lead.category} · ${lead.borough}`;

  const phoneOk = channelStatus(lead, "Phone") === "allowed";
  const emailOk = channelStatus(lead, "Email") === "allowed";
  const dnc = lead.permissions.doNotContact;

  return (
    <li className={cn("flex flex-wrap items-center gap-3 px-5 py-3 transition-opacity", done && "opacity-45")}>
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-subtle">
        {lead.kind === "property" ? <Home className="size-4" /> : <Building2 className="size-4" />}
      </span>

      <Link href={href} className="min-w-0 flex-1">
        <p className="truncate text-[13.5px] font-medium text-fg hover:text-brand">{title}</p>
        <p className="mt-0.5 truncate text-[12px] text-subtle">{sub}</p>
      </Link>

      <div className="flex items-center gap-1.5">
        {dnc ? (
          <Badge tone="danger">
            <Ban className="size-3" /> Do not contact
          </Badge>
        ) : (
          <>
            <span
              className={cn(
                "inline-flex size-6 items-center justify-center rounded-md border",
                phoneOk
                  ? "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-400"
                  : "border-border bg-surface-2 text-subtle",
              )}
              title={phoneOk ? "Phone cleared" : "Phone not cleared"}
            >
              <Phone className="size-3" />
            </span>
            <span
              className={cn(
                "inline-flex size-6 items-center justify-center rounded-md border",
                emailOk
                  ? "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-400"
                  : "border-border bg-surface-2 text-subtle",
              )}
              title={emailOk ? "Email cleared" : "Email not cleared"}
            >
              <Mail className="size-3" />
            </span>
          </>
        )}
      </div>

      <StageBadge stage={lead.stage} className="hidden sm:inline-flex" />
      <ScorePill score={lead.score.score} />

      <div className="text-right">
        <p className="text-[12.5px] font-medium text-fg">{formatDate(lead.followUpDate)}</p>
        <p className="text-[11.5px] text-subtle">{relativeDate(lead.followUpDate)}</p>
      </div>

      <Button size="sm" variant={done ? "subtle" : "secondary"} disabled={done} onClick={onDone}>
        {done ? (
          <>
            <CheckCircle2 className="size-3.5" /> Logged
          </>
        ) : (
          <>
            Mark touched <ArrowRight className="size-3.5" />
          </>
        )}
      </Button>
    </li>
  );
}
