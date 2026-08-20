"use client";

import { use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Home,
  Zap,
  Ruler,
  Receipt,
  PaintRoller,
} from "lucide-react";
import { Badge, Button, Card, CardHeader, EmptyState } from "@/components/ui";
import { StageBadge } from "@/components/ui/StageBadge";
import { ScorePill } from "@/components/ui/ScoreIndicators";
import {
  FactGrid,
  OutreachPanel,
  ScoreExplanation,
  StageAndNotes,
  Timeline,
} from "@/components/leads/DetailParts";
import { CompliancePanel } from "@/components/leads/CompliancePanel";
import { useData } from "@/lib/store/DataProvider";
import { currency, formatDate, number, relativeDate } from "@/lib/utils";

export default function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { getProperty, moveStage, updateNotes, setFollowUp, updatePermissions, queueOutreach } =
    useData();
  const lead = getProperty(id);

  if (!lead) {
    return (
      <Card>
        <EmptyState
          icon={<Home className="size-5" />}
          title="Property not found"
          description="This lead may have been generated in a previous session. Return to the list to pick another."
          action={
            <Link href="/property-leads">
              <Button variant="primary">Back to property leads</Button>
            </Link>
          }
        />
      </Card>
    );
  }

  const age = new Date().getFullYear() - lead.yearBuilt;

  return (
    <div className="space-y-5">
      <Link
        href="/property-leads"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted transition-colors hover:text-fg"
      >
        <ArrowLeft className="size-3.5" /> All property leads
      </Link>

      {/* Hero -------------------------------------------------------- */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-brand/8 via-transparent to-transparent p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-brand">
                Property opportunity
              </p>
              <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.02em] text-fg sm:text-[28px]">
                {lead.address}
              </h1>
              <p className="mt-1.5 flex items-center gap-1.5 text-[14px] text-muted">
                <MapPin className="size-4 text-subtle" />
                {lead.neighborhood}, {lead.borough}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <StageBadge stage={lead.stage} />
                <Badge tone="neutral">{lead.propertyType}</Badge>
                <Badge tone="neutral">{lead.ownerType}</Badge>
                {lead.interiorOpportunity && <Badge tone="info">Interior scope</Badge>}
                {lead.exteriorOpportunity && <Badge tone="brand">Exterior scope</Badge>}
                <Badge tone="warning" dot>
                  Synthetic record
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-subtle">
                  Est. project value
                </p>
                <p className="mt-1 text-[20px] font-semibold tabular-nums tracking-[-0.02em] text-fg">
                  {currency(lead.estimatedValueLow)} – {currency(lead.estimatedValueHigh)}
                </p>
                <p className="mt-0.5 text-[12px] text-muted">{lead.estimatedProjectType}</p>
              </div>
              <ScorePill score={lead.score.score} className="text-[15px]" />
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-border bg-surface p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-subtle">
              Why this property was identified
            </p>
            <p className="mt-1.5 text-[14px] leading-relaxed text-fg">{lead.identifiedReason}</p>
            <p className="mt-2 text-[12px] text-subtle">
              Source: {lead.sourceIntegration} · Discovered {relativeDate(lead.dateDiscovered)}
            </p>
          </div>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-5">
          {/* Property information */}
          <Card>
            <CardHeader
              title="Property information"
              subtitle="From public records in the demo feed"
              icon={<Ruler className="size-4.5" />}
            />
            <div className="px-5 pb-5">
              <FactGrid
                columns={4}
                items={[
                  { label: "Property type", value: lead.propertyType },
                  { label: "Year built", value: lead.yearBuilt, hint: `${age} years old` },
                  { label: "Units", value: lead.unitCount },
                  { label: "Approx. size", value: `${number(lead.squareFeet)} sq ft` },
                  { label: "Owner type", value: lead.ownerType },
                  { label: "Owner (synthetic)", value: lead.ownerLabel },
                  { label: "Est. property value", value: currency(lead.estimatedValue) },
                  { label: "Borough", value: lead.borough },
                ]}
              />
            </div>
          </Card>

          {/* Transaction information */}
          <Card>
            <CardHeader
              title="Recent transaction information"
              subtitle="Sales and ownership signals"
              icon={<Receipt className="size-4.5" />}
            />
            <div className="px-5 pb-5">
              <FactGrid
                columns={3}
                items={[
                  {
                    label: "Last sale date",
                    value: formatDate(lead.lastSaleDate),
                    hint: lead.lastSaleDate ? relativeDate(lead.lastSaleDate) : undefined,
                  },
                  {
                    label: "Last sale price",
                    value: lead.lastSalePrice ? currency(lead.lastSalePrice) : "—",
                  },
                  {
                    label: "Value vs. last sale",
                    value:
                      lead.lastSalePrice
                        ? `${lead.estimatedValue >= lead.lastSalePrice ? "+" : ""}${Math.round(
                            ((lead.estimatedValue - lead.lastSalePrice) / lead.lastSalePrice) * 100,
                          )}%`
                        : "—",
                  },
                ]}
              />
              {lead.permitSignals.length > 0 && (
                <div className="mt-4 rounded-xl border border-border bg-surface-2/60 p-3.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-subtle">
                    Permit signals
                  </p>
                  <ul className="mt-1.5 space-y-1">
                    {lead.permitSignals.map((s, i) => (
                      <li key={i} className="flex gap-2 text-[13px] leading-relaxed text-fg">
                        <span className="mt-[7px] size-1 shrink-0 rounded-full bg-brand" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Card>

          {/* Triggers */}
          <Card>
            <CardHeader
              title="Detected triggers"
              subtitle="The timing signals that moved this property up the list"
              icon={<Zap className="size-4.5" />}
            />
            <ul className="divide-y divide-border">
              {lead.triggers.map((t, i) => (
                <li key={i} className="flex flex-wrap items-start gap-3 px-5 py-3">
                  <Badge tone="brand">{t.type}</Badge>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] leading-relaxed text-fg">{t.detail}</p>
                    {t.daysAgo !== undefined && (
                      <p className="mt-0.5 text-[11.5px] text-subtle">{t.daysAgo} days ago</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11.5px] text-subtle">Strength</span>
                    <div className="h-1.5 w-14 overflow-hidden rounded-full bg-surface-3">
                      <div
                        className="h-full rounded-full bg-brand"
                        style={{ width: `${Math.round(t.strength * 100)}%` }}
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <ScoreExplanation score={lead.score} title="Painting Opportunity Score" />

          {/* Estimated scope */}
          <Card>
            <CardHeader
              title="Estimated project"
              subtitle="What the crew would most likely be quoting"
              icon={<PaintRoller className="size-4.5" />}
            />
            <div className="px-5 pb-5">
              <FactGrid
                columns={3}
                items={[
                  { label: "Project type", value: lead.estimatedProjectType },
                  {
                    label: "Estimated range",
                    value: `${currency(lead.estimatedValueLow)} – ${currency(lead.estimatedValueHigh)}`,
                  },
                  {
                    label: "Scope",
                    value: [
                      lead.interiorOpportunity ? "Interior" : null,
                      lead.exteriorOpportunity ? "Exterior" : null,
                    ]
                      .filter(Boolean)
                      .join(" + ") || "—",
                  },
                ]}
              />
            </div>
          </Card>

          <CompliancePanel lead={lead} onUpdate={(patch) => updatePermissions(lead.id, patch)} />
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <StageAndNotes
            lead={lead}
            onStage={(s) => moveStage(lead.id, s)}
            onNotes={(n) => updateNotes(lead.id, n)}
            onFollowUp={(d) => setFollowUp(lead.id, d || undefined)}
          />
          <OutreachPanel lead={lead} onQueue={(c) => queueOutreach(lead.id, c)} />
          <Timeline events={lead.timeline} />
        </div>
      </div>
    </div>
  );
}
