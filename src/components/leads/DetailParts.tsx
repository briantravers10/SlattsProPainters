"use client";

import { useState } from "react";
import {
  Activity,
  Send,
  StickyNote,
  Sparkles,
  Check,
  Info,
} from "lucide-react";
import { Badge, Button, Card, CardHeader, Select, Textarea } from "@/components/ui";
import { StageBadge } from "@/components/ui/StageBadge";
import { ScoreRing, BandBadge } from "@/components/ui/ScoreIndicators";
import type { ActivityEvent, Lead, LeadStage, OutreachChannel, ScoreResult } from "@/lib/types";
import { LEAD_STAGES } from "@/lib/types";
import { channelStatus } from "@/lib/compliance";
import { cn, formatDate, relativeDate } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Key/value grid                                                      */
/* ------------------------------------------------------------------ */

export function FactGrid({
  items,
  columns = 3,
}: {
  items: { label: string; value: React.ReactNode; hint?: string }[];
  columns?: 2 | 3 | 4;
}) {
  return (
    <dl
      className={cn(
        "grid gap-x-5 gap-y-4",
        columns === 2 && "grid-cols-2",
        columns === 3 && "grid-cols-2 sm:grid-cols-3",
        columns === 4 && "grid-cols-2 sm:grid-cols-4",
      )}
    >
      {items.map((i) => (
        <div key={i.label} className="min-w-0">
          <dt className="text-[11px] font-semibold uppercase tracking-[0.07em] text-subtle">{i.label}</dt>
          <dd className="mt-1 text-[13.5px] leading-snug text-fg">{i.value}</dd>
          {i.hint && <p className="mt-0.5 text-[11.5px] text-subtle">{i.hint}</p>}
        </div>
      ))}
    </dl>
  );
}

/* ------------------------------------------------------------------ */
/* Score explanation                                                   */
/* ------------------------------------------------------------------ */

export function ScoreExplanation({
  score,
  title,
}: {
  score: ScoreResult;
  title: string;
}) {
  const positive = score.factors.filter((f) => f.points > 0).sort((a, b) => b.points - a.points);
  const negative = score.factors.filter((f) => f.points < 0);
  const max = Math.max(...positive.map((f) => f.points), 1);

  return (
    <Card>
      <CardHeader
        title={title}
        subtitle={`Produced by ${score.engine}`}
        icon={<Sparkles className="size-4.5" />}
      />
      <div className="px-5 pb-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <ScoreRing score={score.score} size={96} label="/ 100" />
          <div className="min-w-0 flex-1">
            <BandBadge band={score.band} />
            <p className="mt-2.5 text-[14px] leading-relaxed text-muted">{score.explanation}</p>
          </div>
        </div>

        <div className="mt-5">
          <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.07em] text-subtle">
            How the score was built
          </p>
          <ul className="space-y-2.5">
            {[...positive, ...negative].map((f, i) => (
              <li key={i}>
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-[13px] font-medium text-fg">{f.label}</p>
                  <span
                    className={cn(
                      "shrink-0 text-[12.5px] font-semibold tabular-nums",
                      f.points > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400",
                    )}
                  >
                    {f.points > 0 ? "+" : ""}
                    {f.points}
                  </span>
                </div>
                <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-surface-3">
                  <div
                    className="h-full rounded-full transition-[width] duration-700"
                    style={{
                      width: `${(Math.abs(f.points) / max) * 100}%`,
                      background: f.points > 0 ? "var(--brand)" : "#f43f5e",
                    }}
                  />
                </div>
                <p className="mt-1 text-[12px] leading-relaxed text-muted">{f.detail}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-5 rounded-xl border border-brand/20 bg-brand-soft/50 p-4">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.07em] text-brand">
            <Info className="size-3.5" /> Recommended action
          </p>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-fg">{score.recommendedAction}</p>
        </div>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Outreach panel (simulated)                                          */
/* ------------------------------------------------------------------ */

export function OutreachPanel({
  lead,
  onQueue,
}: {
  lead: Lead;
  onQueue: (channel: OutreachChannel) => void;
}) {
  const [queued, setQueued] = useState<string[]>([]);

  return (
    <Card>
      <CardHeader
        title="Recommended outreach"
        subtitle="Channels the Manager suggests for this lead"
        icon={<Send className="size-4.5" />}
        action={<Badge tone="warning">Sending disabled</Badge>}
      />
      <div className="px-5 pb-5">
        <ul className="space-y-2">
          {lead.recommendedChannels.map((channel) => {
            const status = channelStatus(lead, channel);
            const isQueued = queued.includes(channel);
            return (
              <li
                key={channel}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface-2/50 px-3.5 py-2.5"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-[13.5px] font-medium text-fg">{channel}</span>
                  <span className="mt-0.5 block text-[12px] text-muted">
                    {status === "allowed"
                      ? "Cleared by the Compliance Agent"
                      : status === "review"
                        ? "Requires a compliance check before use"
                        : "Blocked — no permission established"}
                  </span>
                </span>
                <Button
                  size="sm"
                  variant={status === "blocked" ? "secondary" : isQueued ? "subtle" : "primary"}
                  disabled={status === "blocked" || isQueued}
                  onClick={() => {
                    setQueued((q) => [...q, channel]);
                    onQueue(channel);
                  }}
                >
                  {isQueued ? (
                    <>
                      <Check className="size-3.5" /> Queued
                    </>
                  ) : status === "blocked" ? (
                    "Blocked"
                  ) : (
                    "Queue (simulated)"
                  )}
                </Button>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-[12px] leading-relaxed text-subtle">
          Queuing a campaign in this build records the intent on the lead timeline and nothing else. No
          email, SMS, call or physical mail leaves the system.
        </p>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Timeline                                                            */
/* ------------------------------------------------------------------ */

const KIND_COLOR: Record<string, string> = {
  discovered: "bg-brand",
  research: "bg-violet-500",
  score: "bg-sky-500",
  stage: "bg-emerald-500",
  note: "bg-slate-400",
  outreach: "bg-amber-500",
  compliance: "bg-rose-500",
};

export function Timeline({ events }: { events: ActivityEvent[] }) {
  return (
    <Card>
      <CardHeader title="Timeline & history" subtitle="Everything the system has done with this lead" icon={<Activity className="size-4.5" />} />
      <ol className="relative px-5 pb-5">
        <span className="absolute bottom-6 left-[26px] top-1 w-px bg-border" />
        {events.map((e) => (
          <li key={e.id} className="relative flex gap-3.5 pb-4 last:pb-0">
            <span
              className={cn(
                "relative z-10 mt-1 size-2.5 shrink-0 rounded-full ring-4 ring-[var(--surface)]",
                KIND_COLOR[e.kind] ?? "bg-slate-400",
              )}
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <p className="text-[13.5px] font-medium text-fg">{e.title}</p>
                <span className="text-[11.5px] text-subtle">{relativeDate(e.date)}</span>
              </div>
              {e.detail && <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted">{e.detail}</p>}
              <p className="mt-0.5 text-[11.5px] text-subtle">{e.actor}</p>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Stage & notes                                                       */
/* ------------------------------------------------------------------ */

export function StageAndNotes({
  lead,
  onStage,
  onNotes,
  onFollowUp,
}: {
  lead: Lead;
  onStage: (s: LeadStage) => void;
  onNotes: (n: string) => void;
  onFollowUp: (d: string) => void;
}) {
  const [notes, setNotes] = useState(lead.notes);
  const [saved, setSaved] = useState(false);

  return (
    <Card>
      <CardHeader title="Pipeline & notes" subtitle="Move this lead and record what you learn" icon={<StickyNote className="size-4.5" />} />
      <div className="space-y-4 px-5 pb-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.07em] text-subtle">
              Stage
            </label>
            <Select value={lead.stage} onChange={(e) => onStage(e.target.value as LeadStage)}>
              {LEAD_STAGES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
            <div className="mt-2">
              <StageBadge stage={lead.stage} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.07em] text-subtle">
              Follow-up date
            </label>
            <input
              type="date"
              value={lead.followUpDate ?? ""}
              onChange={(e) => onFollowUp(e.target.value)}
              className="h-9.5 w-full rounded-[10px] border border-border bg-surface px-3 text-sm text-fg outline-none focus-visible:focus-ring"
            />
            <p className="mt-2 text-[12px] text-muted">
              {lead.followUpDate ? `${formatDate(lead.followUpDate)} · ${relativeDate(lead.followUpDate)}` : "No follow-up scheduled"}
            </p>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.07em] text-subtle">
            Notes
          </label>
          <Textarea
            rows={4}
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              setSaved(false);
            }}
          />
          <div className="mt-2 flex items-center gap-2">
            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                onNotes(notes);
                setSaved(true);
              }}
            >
              Save note
            </Button>
            {saved && (
              <span className="inline-flex items-center gap-1 text-[12.5px] text-emerald-600 dark:text-emerald-400">
                <Check className="size-3.5" /> Saved
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
