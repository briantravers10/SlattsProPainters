"use client";

import { AlertTriangle, Ban, Check, ShieldCheck, ShieldQuestion } from "lucide-react";
import { Badge, Card, CardHeader, Select } from "@/components/ui";
import type { ContactPermissions, Lead } from "@/lib/types";
import {
  COMPLIANCE_DISCLAIMER,
  NEGATIVE_PERMISSION_VALUES,
  NEUTRAL_PERMISSION_VALUES,
  PERMISSION_FIELD_LABELS,
  evaluateChannels,
  type GateStatus,
} from "@/lib/compliance";
import { cn, formatDate } from "@/lib/utils";

const STATUS_META: Record<GateStatus, { label: string; tone: string; icon: typeof Check }> = {
  allowed: {
    label: "Cleared",
    tone: "text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-500/10 dark:border-emerald-500/25",
    icon: Check,
  },
  review: {
    label: "Needs review",
    tone: "text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-500/10 dark:border-amber-500/25",
    icon: ShieldQuestion,
  },
  blocked: {
    label: "Blocked",
    tone: "text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-300 dark:bg-rose-500/10 dark:border-rose-500/25",
    icon: Ban,
  },
};

export function CompliancePanel({
  lead,
  onUpdate,
}: {
  lead: Lead;
  onUpdate: (patch: Partial<ContactPermissions>) => void;
}) {
  const gates = evaluateChannels(lead);
  const p = lead.permissions;
  const isConsumer = lead.kind === "property" && lead.ownerType === "Individual";

  return (
    <Card className="overflow-hidden">
      <CardHeader
        title="Contact permissions"
        subtitle={
          isConsumer
            ? "Consumer / residential lead — the stricter rule set applies"
            : "Business contact — B2B rules apply"
        }
        icon={<ShieldCheck className="size-4.5" />}
        action={
          p.doNotContact ? (
            <Badge tone="danger" dot>
              DO NOT CONTACT
            </Badge>
          ) : (
            <Badge tone="muted">{p.source}</Badge>
          )
        }
      />

      {/* Core principle warning */}
      <div className="mx-5 mb-4 flex gap-2.5 rounded-xl border border-amber-300/60 bg-amber-50/70 p-3.5 dark:border-amber-500/25 dark:bg-amber-500/5">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <p className="text-[12.5px] leading-relaxed text-muted">
          <strong className="font-semibold text-fg">
            Finding this information is not permission to use it.
          </strong>{" "}
          Discovery and consent are tracked separately. A channel is only usable when it is explicitly
          cleared below.
        </p>
      </div>

      {/* Permission fields */}
      <div className="grid gap-3 px-5 pb-4 sm:grid-cols-2 lg:grid-cols-3">
        {PERMISSION_FIELD_LABELS.map((field) => {
          const current = String(p[field.key]);
          const negative = NEGATIVE_PERMISSION_VALUES.has(current);
          const neutral = NEUTRAL_PERMISSION_VALUES.has(current);
          return (
            <div key={field.key}>
              <label className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.07em] text-subtle">
                {field.label}
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    negative ? "bg-rose-500" : neutral ? "bg-slate-400" : "bg-emerald-500",
                  )}
                />
              </label>
              <Select
                value={current}
                onChange={(e) => onUpdate({ [field.key]: e.target.value } as Partial<ContactPermissions>)}
                className={cn(
                  negative && "border-rose-300 dark:border-rose-500/40",
                  !negative && !neutral && "border-emerald-300 dark:border-emerald-500/40",
                )}
              >
                {field.options.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </Select>
            </div>
          );
        })}

        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.07em] text-subtle">
            Do not contact
          </label>
          <Select
            value={p.doNotContact ? "Yes" : "No"}
            onChange={(e) => onUpdate({ doNotContact: e.target.value === "Yes" })}
            className={cn(p.doNotContact && "border-rose-400 text-rose-600 dark:border-rose-500/50")}
          >
            <option value="No">No</option>
            <option value="Yes">Yes</option>
          </Select>
        </div>
      </div>

      {(p.consentDate || p.consentSource) && (
        <div className="mx-5 mb-4 grid gap-2 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 sm:grid-cols-2 dark:border-emerald-500/25 dark:bg-emerald-500/5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-subtle">Consent date</p>
            <p className="mt-0.5 text-[13px] text-fg">{formatDate(p.consentDate)}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-subtle">Consent source</p>
            <p className="mt-0.5 text-[13px] text-fg">{p.consentSource ?? "—"}</p>
          </div>
        </div>
      )}

      {/* Channel gates */}
      <div className="border-t border-border">
        <p className="px-5 pb-2 pt-4 text-[11px] font-semibold uppercase tracking-[0.07em] text-subtle">
          Channel decisions
        </p>
        <ul className="divide-y divide-border">
          {gates.map((gate) => {
            const meta = STATUS_META[gate.status];
            const Icon = meta.icon;
            return (
              <li key={gate.channel} className="flex flex-wrap items-start gap-3 px-5 py-2.5">
                <span
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11.5px] font-medium",
                    meta.tone,
                  )}
                >
                  <Icon className="size-3" />
                  {meta.label}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-fg">{gate.channel}</p>
                  <p className="mt-0.5 text-[12px] leading-relaxed text-muted">{gate.reason}</p>
                  {gate.requirement && (
                    <p className="mt-1 text-[12px] leading-relaxed text-amber-700 dark:text-amber-400">
                      Needed: {gate.requirement}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="border-t border-border bg-surface-2/50 px-5 py-3.5">
        <p className="text-[11.5px] leading-relaxed text-subtle">{COMPLIANCE_DISCLAIMER}</p>
      </div>
    </Card>
  );
}
