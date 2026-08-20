"use client";

import { useState } from "react";
import {
  ListChecks,
  Settings as SettingsIcon,
  Cpu,
  ShieldCheck,
  Sliders,
  Palette,
  RotateCcw,
  Ban,
  Building,
  Info,
} from "lucide-react";
import { Badge, Button, Card, CardHeader, Input, PageHeader, Select } from "@/components/ui";
import { useTheme } from "@/components/layout/ThemeProvider";
import { useData } from "@/lib/store/DataProvider";
import { WORKER_AGENTS } from "@/lib/manager";
import { activePropertyEngine, activePartnershipEngine } from "@/lib/scoring";
import { COMPLIANCE_DISCLAIMER } from "@/lib/compliance";
import { REGISTRIES, SCREENING_DISCLAIMER } from "@/lib/compliance/registries";
import { activeScreeningEngine } from "@/lib/compliance/screening";
import { APP, DEMO_MODE, INTEGRATIONS_ENABLED } from "@/lib/config";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { theme, toggle } = useTheme();
  const { resetDemo, propertyLeads, businessLeads, outreachLog } = useData();
  const [thresholds, setThresholds] = useState({ hot: 90, high: 75, medium: 60 });
  const [reset, setReset] = useState(false);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings"
        title="Configuration & safeguards"
        description="Everything the production system would expose as configuration: scoring thresholds, which agents run, and which outreach channels are permitted. In this build every sending integration is hard-disabled."
      />

      {/* Safety switches */}
      <Card className="border-amber-300/50 dark:border-amber-500/25">
        <CardHeader
          title="Outreach safety switches"
          subtitle="All sending is disabled in the demo build"
          icon={<Ban className="size-4.5" />}
          action={<Badge tone="warning" dot>Demo mode {DEMO_MODE ? "on" : "off"}</Badge>}
        />
        <ul className="divide-y divide-border">
          {Object.entries(INTEGRATIONS_ENABLED).map(([key, enabled]) => (
            <li key={key} className="flex items-center justify-between gap-3 px-5 py-3">
              <div className="min-w-0">
                <p className="text-[13.5px] font-medium capitalize text-fg">
                  {key.replace(/([A-Z])/g, " $1")}
                </p>
                <p className="mt-0.5 text-[12px] text-muted">
                  {enabled ? "Enabled" : "Hard-disabled — no requests are made to any provider"}
                </p>
              </div>
              <span
                className={cn(
                  "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
                  enabled ? "bg-emerald-500" : "bg-surface-3",
                )}
                title={enabled ? "Enabled" : "Disabled in demo"}
              >
                <span
                  className={cn(
                    "absolute size-4 rounded-full bg-white shadow transition-transform",
                    enabled ? "translate-x-4.5" : "translate-x-0.5",
                  )}
                />
              </span>
            </li>
          ))}
        </ul>
        <div className="border-t border-border bg-surface-2/50 px-5 py-3.5">
          <p className="text-[12px] leading-relaxed text-subtle">
            Enabling any of these in production requires connecting a paid provider and completing a
            compliance review first. Nothing in this demo can be switched on from the interface.
          </p>
        </div>
      </Card>

      {/* Suppression registries */}
      <Card>
        <CardHeader
          title="Suppression registries"
          subtitle="Every lead is screened against these before any channel opens"
          icon={<ListChecks className="size-4.5" />}
          action={<Badge tone="brand">{activeScreeningEngine.id}</Badge>}
        />

        <div className="mx-5 mb-4 flex gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 dark:border-emerald-500/25 dark:bg-emerald-500/5">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <p className="text-[12.5px] leading-relaxed text-muted">
            <strong className="font-semibold text-fg">Screening fails closed.</strong> A list that
            has not been checked blocks its channel exactly as a positive match does. Screening also
            outranks consent — a do-not-call match blocks the call even where consent is on file.
          </p>
        </div>

        <ul className="divide-y divide-border">
          {REGISTRIES.map((registry) => (
            <li key={registry.id} className="px-5 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[14px] font-medium text-fg">{registry.name}</p>
                    <Badge tone="muted">{registry.channel}</Badge>
                    {!registry.appliesToBusiness && <Badge tone="muted">consumer only</Badge>}
                  </div>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted">
                    {registry.description}
                  </p>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-subtle">
                    <strong className="font-medium text-muted">Access:</strong> {registry.access}
                  </p>
                  <p className="mt-0.5 text-[12px] text-subtle">
                    <strong className="font-medium text-muted">Refresh:</strong> {registry.cadence}
                  </p>
                </div>
                <Badge
                  tone={registry.connectionStatus.startsWith("Internal") ? "success" : "warning"}
                  dot
                >
                  {registry.connectionStatus}
                </Badge>
              </div>
            </li>
          ))}
        </ul>

        <div className="border-t border-border bg-surface-2/50 px-5 py-3.5">
          <p className="text-[11.5px] leading-relaxed text-subtle">{SCREENING_DISCLAIMER}</p>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Scoring */}
        <Card>
          <CardHeader
            title="Lead scoring"
            subtitle="Band thresholds and the active scoring engine"
            icon={<Sliders className="size-4.5" />}
          />
          <div className="space-y-4 px-5 pb-5">
            <div className="grid gap-3 sm:grid-cols-3">
              {([
                ["hot", "Extremely high"],
                ["high", "High"],
                ["medium", "Medium"],
              ] as const).map(([key, label]) => (
                <div key={key}>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.07em] text-subtle">
                    {label} ≥
                  </label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={thresholds[key]}
                    onChange={(e) => setThresholds({ ...thresholds, [key]: Number(e.target.value) })}
                  />
                </div>
              ))}
            </div>

            <div className="surface-inset p-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-subtle">
                Active engines
              </p>
              <div className="mt-2 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] text-fg">Property scoring</span>
                  <Badge tone="brand">{activePropertyEngine.id}</Badge>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] text-fg">Partnership scoring</span>
                  <Badge tone="brand">{activePartnershipEngine.id}</Badge>
                </div>
              </div>
              <p className="mt-2.5 text-[12px] leading-relaxed text-muted">
                Both engines are deterministic rules in this build. They implement a shared interface, so a
                model-backed scoring service can be registered in its place without changing anything in
                the interface.
              </p>
            </div>
          </div>
        </Card>

        {/* Business profile */}
        <Card>
          <CardHeader
            title="Business profile"
            subtitle="Used to shape scoring and territory"
            icon={<Building className="size-4.5" />}
          />
          <div className="grid gap-3 px-5 pb-5 sm:grid-cols-2">
            <Field label="Company" value={APP.name} />
            <Field label="Service territory" value={APP.market} />
            <Field label="Primary services" value="Interior & exterior painting" />
            <Field label="Crew capacity" value="3 crews" />
            <div className="sm:col-span-2">
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.07em] text-subtle">
                Minimum project value to pursue
              </label>
              <Select defaultValue="2500">
                <option value="1000">$1,000</option>
                <option value="2500">$2,500</option>
                <option value="5000">$5,000</option>
                <option value="10000">$10,000</option>
              </Select>
            </div>
          </div>
        </Card>
      </div>

      {/* Agents */}
      <Card>
        <CardHeader
          title="Specialist agents"
          subtitle="What each worker does and what it would connect to in production"
          icon={<Cpu className="size-4.5" />}
        />
        <ul className="divide-y divide-border">
          {WORKER_AGENTS.map((agent) => (
            <li key={agent.id} className="px-5 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[14px] font-medium text-fg">{agent.name}</p>
                    <Badge tone={agent.status === "Disabled in demo" ? "danger" : "success"} dot>
                      {agent.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted">{agent.description}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {agent.productionInputs.map((input) => (
                      <span
                        key={input}
                        className="rounded-md border border-border bg-surface-2 px-2 py-0.5 text-[11.5px] text-muted"
                      >
                        {input}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Compliance */}
        <Card>
          <CardHeader
            title="Compliance safeguards"
            subtitle="Structural rules applied before any channel is usable"
            icon={<ShieldCheck className="size-4.5" />}
          />
          <ul className="space-y-2.5 px-5 pb-5">
            {[
              "Discovering information is never treated as permission to contact.",
              "Every lead is screened against suppression registries at discovery and again before contact.",
              "Screening fails closed — an unchecked list blocks the channel exactly as a match does.",
              "Consumer and B2B leads are gated by separate default rule sets.",
              "SMS requires recorded written consent — never inferred.",
              "A do-not-contact flag blocks every direct channel, in every view.",
              "Consent date and source are stored alongside every permission.",
              "Audience advertising and partnership channels need no personal contact data, so they stay available when direct channels are blocked.",
            ].map((rule) => (
              <li key={rule} className="flex gap-2 text-[13px] leading-relaxed text-fg">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                {rule}
              </li>
            ))}
          </ul>
          <div className="border-t border-border bg-surface-2/50 px-5 py-3.5">
            <p className="text-[11.5px] leading-relaxed text-subtle">{COMPLIANCE_DISCLAIMER}</p>
          </div>
        </Card>

        {/* Appearance & demo data */}
        <div className="space-y-5">
          <Card>
            <CardHeader title="Appearance" subtitle="Interface theme" icon={<Palette className="size-4.5" />} />
            <div className="flex items-center justify-between gap-3 px-5 pb-5">
              <div>
                <p className="text-[13.5px] font-medium text-fg">Colour theme</p>
                <p className="mt-0.5 text-[12px] text-muted">
                  Currently {theme}. Follows the system preference on first load.
                </p>
              </div>
              <Button onClick={toggle} variant="secondary">
                Switch to {theme === "light" ? "dark" : "light"}
              </Button>
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Demo data"
              subtitle="Reset to the original synthetic dataset"
              icon={<SettingsIcon className="size-4.5" />}
            />
            <div className="px-5 pb-5">
              <div className="grid grid-cols-3 gap-2.5">
                <MiniStat label="Property leads" value={String(propertyLeads.length)} />
                <MiniStat label="Partnership leads" value={String(businessLeads.length)} />
                <MiniStat label="Queued campaigns" value={String(outreachLog.length)} />
              </div>
              <p className="mt-3 text-[12.5px] leading-relaxed text-muted">
                Resetting discards stage changes, notes, permission edits and anything the AI Manager
                discovered during this session, and restores the original dataset.
              </p>
              <Button
                className="mt-3"
                variant="danger"
                onClick={() => {
                  resetDemo();
                  setReset(true);
                  setTimeout(() => setReset(false), 2400);
                }}
              >
                <RotateCcw className="size-4" /> {reset ? "Demo data reset" : "Reset demo data"}
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {outreachLog.length > 0 && (
        <Card className="overflow-hidden">
          <CardHeader
            title="Simulated outreach log"
            subtitle="Campaigns queued during this session — nothing was sent"
            action={<Badge tone="warning">Simulated only</Badge>}
          />
          <ul className="divide-y divide-border">
            {outreachLog.map((entry) => (
              <li key={entry.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                <Badge tone="muted">{entry.channel}</Badge>
                <span className="min-w-0 flex-1 truncate text-[13px] text-fg">{entry.leadName}</span>
                <span className="text-[12px] text-subtle">{entry.date}</span>
                <Badge tone="warning">{entry.status}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="border-brand/20 bg-brand-soft/40">
        <div className="flex gap-3 p-5">
          <Info className="mt-0.5 size-4.5 shrink-0 text-brand" />
          <p className="text-[13px] leading-relaxed text-muted">
            <strong className="font-semibold text-fg">Architecture note.</strong> Demo data, scoring,
            Manager logic, compliance rules and data access each live in their own module. Replacing the
            synthetic dataset with a real database, or the rules-based scorer with a model, means changing
            one module — the interface is written against interfaces, not against the demo.
          </p>
        </div>
      </Card>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.07em] text-subtle">
        {label}
      </label>
      <Input defaultValue={value} />
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface-inset px-3 py-2.5">
      <p className="text-[11px] uppercase tracking-[0.06em] text-subtle">{label}</p>
      <p className="mt-1 text-[18px] font-semibold tabular-nums leading-none text-fg">{value}</p>
    </div>
  );
}
