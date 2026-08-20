"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  Flame,
  Building2,
  KeyRound,
  HardHat,
  CalendarClock,
  Repeat,
  Sparkles,
  TrendingUp,
  ArrowRight,
  Info,
} from "lucide-react";
import { Card, CardHeader, PageHeader, Badge, Button } from "@/components/ui";
import { FocusCard, StatTile } from "@/components/leads/StatCard";
import { LeadMiniList } from "@/components/leads/LeadTables";
import {
  BoroughChart,
  DiscoveryChart,
  FunnelChart,
  HorizontalBars,
  ScoreBandChart,
  ValueByBoroughChart,
} from "@/components/charts";
import { useData } from "@/lib/store/DataProvider";
import { computeDashboard } from "@/lib/store/analytics";
import { currency, isDueWithin } from "@/lib/utils";

export default function DashboardPage() {
  const { propertyLeads, businessLeads, customers } = useData();
  const stats = useMemo(
    () => computeDashboard(propertyLeads, businessLeads, customers),
    [propertyLeads, businessLeads, customers],
  );

  const topProperties = useMemo(
    () => [...propertyLeads].sort((a, b) => b.score.score - a.score.score).slice(0, 5),
    [propertyLeads],
  );
  const topBusinesses = useMemo(
    () => [...businessLeads].sort((a, b) => b.score.score - a.score.score).slice(0, 5),
    [businessLeads],
  );

  const dueToday = useMemo(
    () =>
      [...propertyLeads, ...businessLeads].filter(
        (l) => l.followUpDate && isDueWithin(l.followUpDate, 0),
      ).length,
    [propertyLeads, businessLeads],
  );

  const funnelData = stats.byStage
    .filter((s) => s.stage !== "Won" && s.stage !== "Lost")
    .map((s) => ({ stage: s.stage, count: s.count }));

  const won = stats.byStage.find((s) => s.stage === "Won")?.count ?? 0;
  const lost = stats.byStage.find((s) => s.stage === "Lost")?.count ?? 0;

  const newestBorough = [...stats.byBorough].sort((a, b) => b.value - a.value)[0];

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Weekly opportunity dashboard"
        title="Where should I focus this week?"
        description={`The system is tracking ${stats.totalLeads} live opportunities across all five boroughs. Everything below is ranked so the highest-value work is at the top of the list.`}
        actions={
          <Link href="/ai-manager">
            <Button variant="primary" size="lg">
              <Sparkles className="size-4" />
              Ask the AI Manager
            </Button>
          </Link>
        }
      />

      {/* Focus cards ------------------------------------------------- */}
      <div className="grid grid-cols-2 gap-3 stagger sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <FocusCard
          count={stats.hotProperties}
          label="Hot property opportunities"
          detail="Scoring 85+ — work these first"
          icon={Flame}
          href="/property-leads?score=hot"
          tone="rose"
        />
        <FocusCard
          count={stats.newPropertyManagers}
          label="New property managers"
          detail="Found in the last 14 days"
          icon={Building2}
          href="/partnership-leads?group=Property+Managers"
          tone="brand"
        />
        <FocusCard
          count={stats.realtorOpportunities}
          label="Realtor opportunities"
          detail="Agents & brokerages in territory"
          icon={KeyRound}
          href="/partnership-leads?group=Realtors"
          tone="violet"
        />
        <FocusCard
          count={stats.contractorOpportunities}
          label="Contractor opportunities"
          detail="Subcontracting relationships"
          icon={HardHat}
          href="/partnership-leads?group=Contractors"
          tone="amber"
        />
        <FocusCard
          count={dueToday}
          label="Prospects due follow-up"
          detail="Due today or already overdue"
          icon={CalendarClock}
          href="/follow-ups"
          tone="sky"
        />
        <FocusCard
          count={stats.reactivationCandidates}
          label="Customers worth reactivating"
          detail="Past jobs inside a repaint cycle"
          icon={Repeat}
          href="/customers"
          tone="emerald"
        />
      </div>

      {/* KPI strip --------------------------------------------------- */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        <StatTile label="Total leads" value={stats.totalLeads.toLocaleString()} sub={`${propertyLeads.length} property · ${businessLeads.length} partnership`} />
        <StatTile label="Average score" value={String(stats.avgScore)} sub="Across every live opportunity" />
        <StatTile label="Hot leads" value={String(stats.hotLeads)} sub="Scoring 85 or above" />
        <StatTile
          label="Est. pipeline value"
          value={currency(stats.pipelineValue, true)}
          sub="Project value + annual partnership value"
        />
        <StatTile label="New this week" value={String(stats.newThisWeek)} sub="Discovered in the last 7 days" />
      </div>

      {/* Charts row 1 ------------------------------------------------ */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Leads by borough"
            subtitle="Property opportunities and partnership targets side by side"
            icon={<TrendingUp className="size-4.5" />}
          />
          <div className="px-5 pb-5">
            <BoroughChart data={stats.byBorough} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Opportunity score distribution" subtitle="Every live lead, banded" />
          <div className="px-5 pb-5">
            <ScoreBandChart data={stats.byScoreBand} />
          </div>
        </Card>
      </div>

      {/* Charts row 2 ------------------------------------------------ */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader
            title="Discovery — last 7 days"
            subtitle="What the research agents surfaced each day"
          />
          <div className="px-5 pb-5">
            <DiscoveryChart data={stats.weeklyDiscovery} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Pipeline value by borough" subtitle="Where the money actually is" />
          <div className="px-5 pb-5">
            <ValueByBoroughChart data={stats.byBorough} />
            <p className="mt-3 text-[12px] leading-relaxed text-muted">
              <strong className="text-fg">{newestBorough.borough}</strong> carries the most value right
              now. Concentrating crews in one or two boroughs cuts travel time and makes neighbor
              campaigns far more effective.
            </p>
          </div>
        </Card>

        <Card>
          <CardHeader title="Leads by source" subtitle="Which feed produced each opportunity" />
          <div className="px-5 pb-5">
            <HorizontalBars
              data={stats.bySource.slice(0, 6).map((s) => ({ name: s.source, value: s.count }))}
              height={200}
              yWidth={170}
            />
          </div>
        </Card>
      </div>

      {/* Charts row 3 ------------------------------------------------ */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Pipeline funnel"
            subtitle="Live stages, excluding closed outcomes"
            action={
              <div className="flex gap-1.5">
                <Badge tone="success">{won} won</Badge>
                <Badge tone="danger">{lost} lost</Badge>
              </div>
            }
          />
          <div className="px-5 pb-5">
            <FunnelChart data={funnelData} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Partnership leads by category" subtitle="Where recurring work would come from" />
          <div className="px-5 pb-5">
            <HorizontalBars
              data={stats.byCategory.slice(0, 8).map((c) => ({ name: c.category, value: c.count }))}
              height={272}
              valueLabel="Organisations"
              yWidth={182}
            />
          </div>
        </Card>
      </div>

      {/* Top leads --------------------------------------------------- */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHeader
            title="Highest-scoring property opportunities"
            subtitle="Ranked by Painting Opportunity Score"
            action={
              <Link href="/property-leads">
                <Button size="sm" variant="ghost">
                  View all <ArrowRight className="size-3.5" />
                </Button>
              </Link>
            }
          />
          <LeadMiniList properties={topProperties} />
        </Card>

        <Card className="overflow-hidden">
          <CardHeader
            title="Highest-scoring partnership opportunities"
            subtitle="Ranked by recurring-revenue potential"
            action={
              <Link href="/partnership-leads">
                <Button size="sm" variant="ghost">
                  View all <ArrowRight className="size-3.5" />
                </Button>
              </Link>
            }
          />
          <LeadMiniList businesses={topBusinesses} />
        </Card>
      </div>

      {/* Explainer --------------------------------------------------- */}
      <Card className="border-brand/20 bg-brand-soft/40">
        <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <Info className="size-4.5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] font-semibold text-fg">This is a demonstration build</p>
            <p className="mt-1 text-[13px] leading-relaxed text-muted">
              Every property, owner, business and contact detail shown is synthetic. No outreach of any
              kind is sent from this application — the Outreach Agent only prepares and queues campaigns
              for human approval. Contact-permission rules are configurable safeguards, not legal advice.
            </p>
          </div>
          <Link href="/lead-sources" className="shrink-0">
            <Button variant="secondary" size="sm">
              See data sources <ArrowRight className="size-3.5" />
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
