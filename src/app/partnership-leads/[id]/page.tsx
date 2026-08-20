"use client";

import { use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Building2,
  Globe,
  Phone,
  Mail,
  User,
  Target,
  TrendingUp,
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

export default function PartnershipDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { getBusiness, moveStage, updateNotes, setFollowUp, updatePermissions, queueOutreach } =
    useData();
  const lead = getBusiness(id);

  if (!lead) {
    return (
      <Card>
        <EmptyState
          icon={<Building2 className="size-5" />}
          title="Organisation not found"
          description="This lead may have been generated in a previous session. Return to the list to pick another."
          action={
            <Link href="/partnership-leads">
              <Button variant="primary">Back to partnership leads</Button>
            </Link>
          }
        />
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <Link
        href="/partnership-leads"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted transition-colors hover:text-fg"
      >
        <ArrowLeft className="size-3.5" /> All partnership leads
      </Link>

      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-brand/8 via-transparent to-transparent p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-brand">
                Partnership opportunity
              </p>
              <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.02em] text-fg sm:text-[28px]">
                {lead.businessName}
              </h1>
              <p className="mt-1.5 flex items-center gap-1.5 text-[14px] text-muted">
                <MapPin className="size-4 text-subtle" />
                {lead.neighborhood}, {lead.borough}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <StageBadge stage={lead.stage} />
                <Badge tone="neutral">{lead.category}</Badge>
                <Badge tone="info">{lead.group}</Badge>
                <Badge tone="warning" dot>
                  Synthetic record
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-subtle">
                  Est. annual opportunity
                </p>
                <p className="mt-1 text-[22px] font-semibold tabular-nums tracking-[-0.02em] text-fg">
                  {currency(lead.estimatedAnnualOpportunity)}
                </p>
                <p className="mt-0.5 text-[12px] text-muted">~{lead.potentialJobsPerYear} jobs / year</p>
              </div>
              <ScorePill score={lead.score.score} className="text-[15px]" />
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-5">
          {/* Public contact info */}
          <Card>
            <CardHeader
              title="Public contact information"
              subtitle="Business details published by the organisation (synthetic in this demo)"
              icon={<Globe className="size-4.5" />}
            />
            <div className="px-5 pb-5">
              <ul className="space-y-2.5">
                <ContactRow icon={<Globe className="size-4" />} label="Website" value={lead.website} />
                <ContactRow icon={<Phone className="size-4" />} label="Business phone" value={lead.phone} />
                <ContactRow icon={<Mail className="size-4" />} label="Business email" value={lead.email} />
                <ContactRow
                  icon={<User className="size-4" />}
                  label="Contact person"
                  value={
                    lead.contactPerson
                      ? `${lead.contactPerson} — ${lead.contactTitle}`
                      : "Not yet identified — the Business Research Agent should find a decision-maker"
                  }
                  muted={!lead.contactPerson}
                />
              </ul>
              <p className="mt-3 text-[12px] leading-relaxed text-subtle">
                These are demonstration values. No real business contact details are stored, collected or
                displayed in this build.
              </p>
            </div>
          </Card>

          {/* Portfolio */}
          <Card>
            <CardHeader
              title="Estimated portfolio & opportunity"
              subtitle="What a signed relationship could be worth"
              icon={<TrendingUp className="size-4.5" />}
            />
            <div className="px-5 pb-5">
              <FactGrid
                columns={4}
                items={[
                  { label: "Portfolio size", value: number(lead.portfolioSize), hint: lead.portfolioUnit },
                  { label: "Jobs per year", value: `~${lead.potentialJobsPerYear}` },
                  { label: "Annual opportunity", value: currency(lead.estimatedAnnualOpportunity) },
                  {
                    label: "Avg. job value",
                    value: currency(
                      Math.round(lead.estimatedAnnualOpportunity / Math.max(lead.potentialJobsPerYear, 1)),
                    ),
                  },
                ]}
              />

              <div className="mt-5">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.07em] text-subtle">
                  Why this relationship is valuable
                </p>
                <ul className="space-y-1.5">
                  {lead.whyValuable.map((w, i) => (
                    <li key={i} className="flex gap-2 text-[13.5px] leading-relaxed text-fg">
                      <span className="mt-[8px] size-1 shrink-0 rounded-full bg-brand" />
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>

          <ScoreExplanation score={lead.score} title="Partnership Score" />

          {/* Pitch */}
          <Card className="border-brand/20">
            <CardHeader
              title="Recommended pitch"
              subtitle="How to open the conversation"
              icon={<Target className="size-4.5" />}
            />
            <div className="px-5 pb-5">
              <p className="rounded-xl border border-brand/20 bg-brand-soft/50 p-4 text-[14px] leading-relaxed text-fg">
                {lead.recommendedPitch}
              </p>
            </div>
          </Card>

          <CompliancePanel lead={lead} onUpdate={(patch) => updatePermissions(lead.id, patch)} />
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader title="Contact history" subtitle="Next action and last touch" />
            <div className="px-5 pb-5">
              <FactGrid
                columns={2}
                items={[
                  {
                    label: "Last contacted",
                    value: lead.lastContacted ? formatDate(lead.lastContacted) : "Never",
                    hint: lead.lastContacted ? relativeDate(lead.lastContacted) : "No outreach yet",
                  },
                  {
                    label: "Next follow-up",
                    value: lead.followUpDate ? formatDate(lead.followUpDate) : "Not scheduled",
                    hint: lead.followUpDate ? relativeDate(lead.followUpDate) : undefined,
                  },
                  { label: "Discovered", value: formatDate(lead.dateDiscovered) },
                  { label: "Source", value: lead.sourceIntegration },
                ]}
              />
            </div>
          </Card>

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

function ContactRow({
  icon,
  label,
  value,
  muted,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <li className="flex items-center gap-3 rounded-xl border border-border bg-surface-2/50 px-3.5 py-2.5">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface text-subtle">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-[11px] font-semibold uppercase tracking-[0.07em] text-subtle">
          {label}
        </span>
        <span className={`block truncate text-[13.5px] ${muted ? "text-muted" : "text-fg"}`}>{value}</span>
      </span>
    </li>
  );
}
