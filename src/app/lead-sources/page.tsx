"use client";

import { useState } from "react";
import {
  Database,
  Globe,
  Lock,
  UserCheck,
  ShieldAlert,
  CheckCircle2,
  CircleDashed,
  AlertTriangle,
} from "lucide-react";
import { Badge, Card, CardHeader, PageHeader } from "@/components/ui";
import { LEAD_SOURCES, SOURCE_CLASS_ORDER } from "@/lib/data";
import type { LeadSource, SourceClass } from "@/lib/types";
import { COMPLIANCE_DISCLAIMER } from "@/lib/compliance";
import { cn } from "@/lib/utils";

const CLASS_META: Record<
  SourceClass,
  { icon: typeof Globe; tone: string; blurb: string }
> = {
  "Available Public Data": {
    icon: Globe,
    tone: "border-emerald-200 bg-emerald-50/60 dark:border-emerald-500/25 dark:bg-emerald-500/5",
    blurb:
      "Published openly and usable without a licence fee. This is the backbone of the property pipeline — it tells you what exists and when something changed, but never who you may contact.",
  },
  "Licensed / Paid Data": {
    icon: Lock,
    tone: "border-sky-200 bg-sky-50/60 dark:border-sky-500/25 dark:bg-sky-500/5",
    blurb:
      "Available, but only under a contract that sets the price and the permitted uses. Budget and terms both need agreeing before these are switched on.",
  },
  "Customer-Provided Data": {
    icon: UserCheck,
    tone: "border-violet-200 bg-violet-50/60 dark:border-violet-500/25 dark:bg-violet-500/5",
    blurb:
      "Given to the business directly by the person it belongs to. The highest quality, the highest intent, and the cleanest permission position in the whole system.",
  },
  "Requires Permission / Compliance Review": {
    icon: ShieldAlert,
    tone: "border-amber-300 bg-amber-50/60 dark:border-amber-500/25 dark:bg-amber-500/5",
    blurb:
      "Technically obtainable, but carrying obligations that must be reviewed with counsel before anyone considers using them for outreach. Not enabled in this demo.",
  },
};

const STATUS_TONE: Record<LeadSource["status"], { tone: "success" | "info" | "warning" | "muted"; icon: typeof CheckCircle2 }> = {
  "Connected (Demo)": { tone: "success", icon: CheckCircle2 },
  Available: { tone: "info", icon: CircleDashed },
  "Requires Review": { tone: "warning", icon: AlertTriangle },
  "Not Connected": { tone: "muted", icon: CircleDashed },
};

export default function LeadSourcesPage() {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Lead sources"
        title="Where the leads would actually come from"
        description="Everything the production system could draw on, sorted by what it costs and what it obliges you to do. Nothing here is connected in this demo — no site is scraped, no access restriction is bypassed, and no consumer data is purchased."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {SOURCE_CLASS_ORDER.map((cls) => {
          const meta = CLASS_META[cls];
          const Icon = meta.icon;
          const count = LEAD_SOURCES.filter((s) => s.sourceClass === cls).length;
          return (
            <div key={cls} className={cn("rounded-2xl border p-4", meta.tone)}>
              <div className="flex items-start justify-between">
                <span className="flex size-8 items-center justify-center rounded-lg bg-surface text-fg">
                  <Icon className="size-4" />
                </span>
                <span className="text-[20px] font-semibold tabular-nums leading-none text-fg">{count}</span>
              </div>
              <p className="mt-3 text-[13px] font-semibold leading-snug text-fg">{cls}</p>
              <p className="mt-1.5 text-[12px] leading-relaxed text-muted">{meta.blurb}</p>
            </div>
          );
        })}
      </div>

      {SOURCE_CLASS_ORDER.map((cls) => {
        const sources = LEAD_SOURCES.filter((s) => s.sourceClass === cls);
        if (!sources.length) return null;
        const Icon = CLASS_META[cls].icon;
        return (
          <Card key={cls} className="overflow-hidden">
            <CardHeader title={cls} subtitle={`${sources.length} source${sources.length === 1 ? "" : "s"}`} icon={<Icon className="size-4.5" />} />
            <ul className="divide-y divide-border">
              {sources.map((source) => {
                const st = STATUS_TONE[source.status];
                const StatusIcon = st.icon;
                const open = openId === source.id;
                return (
                  <li key={source.id}>
                    <button
                      onClick={() => setOpenId(open ? null : source.id)}
                      className="w-full px-5 py-3.5 text-left transition-colors hover:bg-surface-2"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-[14px] font-medium text-fg">{source.name}</p>
                          <p className="mt-1 text-[13px] leading-relaxed text-muted">{source.description}</p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1.5">
                          <Badge tone={st.tone}>
                            <StatusIcon className="size-3" />
                            {source.status}
                          </Badge>
                          {source.estimatedCost && (
                            <span className="text-[11.5px] text-subtle">{source.estimatedCost}</span>
                          )}
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {source.feeds.map((f) => (
                          <Badge key={f} tone="muted">
                            Feeds: {f}
                          </Badge>
                        ))}
                      </div>
                    </button>

                    {open && (
                      <div className="animate-fade-in border-t border-border bg-surface-2/50 px-5 py-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-subtle">
                          Example fields
                        </p>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {source.exampleFields.map((f) => (
                            <span
                              key={f}
                              className="rounded-md border border-border bg-surface px-2 py-0.5 font-mono text-[11.5px] text-muted"
                            >
                              {f}
                            </span>
                          ))}
                        </div>
                        <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.07em] text-subtle">
                          Notes
                        </p>
                        <p className="mt-1 text-[13px] leading-relaxed text-fg">{source.notes}</p>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </Card>
        );
      })}

      <Card className="border-amber-300/50 bg-amber-50/50 dark:border-amber-500/25 dark:bg-amber-500/5">
        <div className="flex gap-3 p-5">
          <ShieldAlert className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="text-[14px] font-semibold text-fg">Before any source is switched on</p>
            <ul className="mt-2 space-y-1.5 text-[13px] leading-relaxed text-muted">
              <li className="flex gap-2">
                <span className="mt-[8px] size-1 shrink-0 rounded-full bg-amber-500" />
                No website is scraped and no access restriction, paywall or robots directive is bypassed.
                Where an official API or licensed feed exists, that is what the production system should use.
              </li>
              <li className="flex gap-2">
                <span className="mt-[8px] size-1 shrink-0 rounded-full bg-amber-500" />
                Private homeowner phone numbers are not collected in this demo, and consumer contact
                append is deliberately left disabled.
              </li>
              <li className="flex gap-2">
                <span className="mt-[8px] size-1 shrink-0 rounded-full bg-amber-500" />
                Each licensed source carries its own permitted-use terms — including whether the data may
                be used for marketing at all. Those terms govern, not the capability of the software.
              </li>
            </ul>
            <p className="mt-3 border-t border-amber-300/40 pt-3 text-[12px] leading-relaxed text-subtle">
              {COMPLIANCE_DISCLAIMER}
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="How a source becomes a scored lead" subtitle="The path every record takes" icon={<Database className="size-4.5" />} />
        <div className="px-5 pb-5">
          <ol className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { n: "01", t: "Ingest", d: "Records pulled from a permitted source on a schedule." },
              { n: "02", t: "Normalise", d: "Addresses, owners and entities matched and de-duplicated." },
              { n: "03", t: "Detect triggers", d: "Sales, permits, listings and turnovers dated and attached." },
              { n: "04", t: "Score", d: "0–100 opportunity score with an itemised explanation." },
              { n: "05", t: "Gate", d: "Compliance Agent decides which channels are usable." },
              { n: "06", t: "Route", d: "Lead lands in the right pipeline at the right stage." },
            ].map((s) => (
              <li key={s.n} className="rounded-xl border border-border bg-surface-2/60 p-3.5">
                <span className="text-[10.5px] font-semibold text-subtle">{s.n}</span>
                <p className="mt-1 text-[13px] font-semibold text-fg">{s.t}</p>
                <p className="mt-1 text-[11.5px] leading-relaxed text-muted">{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </Card>
    </div>
  );
}
