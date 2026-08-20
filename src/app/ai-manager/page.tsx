"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowUp,
  Loader2,
  Check,
  Bot,
  ShieldAlert,
  Lightbulb,
  RotateCcw,
  ChevronRight,
  Cpu,
} from "lucide-react";
import { Badge, Button, Card, CardHeader, PageHeader } from "@/components/ui";
import { BusinessTable, PropertyTable } from "@/components/leads/LeadTables";
import { useData } from "@/lib/store/DataProvider";
import { runManagerCommand, EXAMPLE_COMMANDS, WORKER_AGENTS } from "@/lib/manager";
import type { ManagerResponse } from "@/lib/manager";
import { cn, currency, formatDate } from "@/lib/utils";
import { DEMO_MODE } from "@/lib/config";

interface Turn {
  id: string;
  command: string;
  response: ManagerResponse;
  revealed: number;
  done: boolean;
}

export default function AiManagerPage() {
  const { propertyLeads, businessLeads, customers, addDiscovered } = useData();
  const [input, setInput] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const t = timers.current;
    return () => t.forEach(clearTimeout);
  }, []);

  const db = useMemo(
    () => ({ propertyLeads, businessLeads, customers }),
    [propertyLeads, businessLeads, customers],
  );

  const submit = useCallback(
    (raw: string) => {
      const command = raw.trim();
      if (!command || busy) return;
      setInput("");
      setBusy(true);

      const response = runManagerCommand(command, db);
      const turnId = `${Date.now()}`;
      setTurns((prev) => [...prev, { id: turnId, command, response, revealed: 0, done: false }]);

      // Simulated streaming of the worker trace.
      let elapsed = 0;
      response.steps.forEach((step, i) => {
        elapsed += Math.max(260, step.ms / 2.4);
        timers.current.push(
          setTimeout(() => {
            setTurns((prev) => prev.map((t) => (t.id === turnId ? { ...t, revealed: i + 1 } : t)));
          }, elapsed),
        );
      });

      timers.current.push(
        setTimeout(() => {
          setTurns((prev) => prev.map((t) => (t.id === turnId ? { ...t, done: true } : t)));
          if (response.discovered) {
            addDiscovered(response.discovered.properties, response.discovered.businesses);
          }
          setBusy(false);
        }, elapsed + 320),
      );
    },
    [busy, db, addDiscovered],
  );

  useEffect(() => {
    // Only follow the conversation once it has started — otherwise the first
    // paint scrolls the prompt box off the top of the page.
    if (turns.length === 0) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns.length, busy]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="AI Manager"
        title="Tell the Manager what you need"
        description="Ask in plain English. The Manager decides which specialist research agents to run, searches the market, scores what it finds, and reports back. You never have to operate the individual workers."
        actions={
          turns.length > 0 ? (
            <Button variant="secondary" onClick={() => setTurns([])}>
              <RotateCcw className="size-4" /> Clear conversation
            </Button>
          ) : undefined
        }
      />

      <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-5">
          <Card className="overflow-hidden border-brand/25 shadow-md">
            <div className="bg-gradient-to-br from-brand/8 to-transparent p-5">
              <div className="mb-3 flex items-center gap-2">
                <span className="relative flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-violet-500 text-white">
                  <Sparkles className="size-4" />
                  {busy && <span className="absolute inset-0 rounded-xl bg-brand/40 animate-pulse-ring" />}
                </span>
                <div>
                  <p className="text-[13.5px] font-semibold text-fg">Manager</p>
                  <p className="text-[11.5px] text-subtle">
                    {busy ? "Dispatching specialist agents…" : "Ready — ask for anything"}
                  </p>
                </div>
              </div>

              <div className="relative">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      submit(input);
                    }
                  }}
                  rows={3}
                  placeholder="e.g. Find me 100 high-potential residential painting opportunities in Brooklyn."
                  className="w-full resize-none rounded-xl border border-border bg-surface p-4 pr-14 text-[14.5px] leading-relaxed text-fg placeholder:text-subtle outline-none transition-shadow focus-visible:focus-ring"
                />
                <button
                  onClick={() => submit(input)}
                  disabled={!input.trim() || busy}
                  className="absolute bottom-3 right-3 flex size-9 items-center justify-center rounded-lg bg-brand text-white transition-all hover:bg-brand-strong disabled:opacity-40 active:scale-95"
                  aria-label="Send command"
                >
                  {busy ? <Loader2 className="size-4 animate-spin" /> : <ArrowUp className="size-4" />}
                </button>
              </div>

              <div className={cn("mt-3 flex-wrap gap-1.5", turns.length === 0 ? "hidden" : "flex")}>
                {EXAMPLE_COMMANDS.slice(0, 6).map((ex) => (
                  <button
                    key={ex.text}
                    onClick={() => submit(ex.text)}
                    disabled={busy}
                    className="rounded-full border border-border bg-surface px-3 py-1.5 text-left text-[12px] text-muted transition-colors hover:border-brand/40 hover:bg-brand-soft hover:text-brand disabled:opacity-50"
                  >
                    {ex.text}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {turns.length === 0 && <EmptyManagerState onPick={submit} />}

          {turns.map((turn) => (
            <TurnView key={turn.id} turn={turn} onSuggestion={submit} />
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-1 2xl:content-start">
          <Card>
            <CardHeader
              title="Specialist workers"
              subtitle="The Manager operates these on your behalf"
              icon={<Cpu className="size-4.5" />}
            />
            <ul className="divide-y divide-border">
              {WORKER_AGENTS.map((agent) => (
                <li key={agent.id} className="px-5 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[13px] font-medium text-fg">{agent.name}</p>
                    <span
                      className={cn(
                        "mt-0.5 size-1.5 shrink-0 rounded-full",
                        agent.status === "Disabled in demo" ? "bg-rose-400" : "bg-emerald-500",
                      )}
                      title={agent.status}
                    />
                  </div>
                  <p className="mt-0.5 text-[12px] leading-relaxed text-muted">{agent.role}</p>
                </li>
              ))}
            </ul>
            <div className="border-t border-border px-5 py-3">
              <Link
                href="/settings"
                className="inline-flex items-center gap-1 text-[12.5px] font-medium text-brand"
              >
                Configure agents <ChevronRight className="size-3.5" />
              </Link>
            </div>
          </Card>

          {DEMO_MODE && (
            <Card className="border-amber-300/50 bg-amber-50/60 dark:border-amber-500/25 dark:bg-amber-500/5">
              <div className="flex gap-3 p-4">
                <ShieldAlert className="mt-0.5 size-4.5 shrink-0 text-amber-600 dark:text-amber-400" />
                <div>
                  <p className="text-[13px] font-semibold text-fg">Outreach Agent disabled</p>
                  <p className="mt-1 text-[12px] leading-relaxed text-muted">
                    The Manager can research, score and organise. It cannot send email, SMS, mail or
                    place calls in this build — every outreach action is queued and simulated only.
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyManagerState({ onPick }: { onPick: (s: string) => void }) {
  return (
    <Card>
      <CardHeader
        title="What the Manager can do"
        subtitle="Pick one of these or write your own request"
        icon={<Lightbulb className="size-4.5" />}
      />
      <ul className="divide-y divide-border">
        {EXAMPLE_COMMANDS.map((ex) => (
          <li key={ex.text}>
            <button
              onClick={() => onPick(ex.text)}
              className="group flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-surface-2"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-[13.5px] text-fg group-hover:text-brand">{ex.text}</span>
              </span>
              <Badge tone="muted">{ex.hint}</Badge>
              <ChevronRight className="size-4 shrink-0 text-subtle opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function TurnView({ turn, onSuggestion }: { turn: Turn; onSuggestion: (s: string) => void }) {
  const r = turn.response;

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-brand px-4 py-2.5 text-[14px] leading-relaxed text-white shadow-sm">
          {turn.command}
        </div>
      </div>

      {r.steps.length > 0 && (
        <Card className="overflow-hidden">
          <div className="border-b border-border bg-surface-2/60 px-5 py-2.5">
            <p className="flex items-center gap-2 text-[12px] font-medium text-muted">
              <Bot className="size-3.5" />
              Manager dispatched {r.steps.length} specialist{r.steps.length === 1 ? "" : "s"}
            </p>
          </div>
          <ul className="divide-y divide-border">
            {r.steps.map((step, i) => {
              const revealed = i < turn.revealed;
              const active = i === turn.revealed && !turn.done;
              if (!revealed && !active) return null;
              return (
                <li key={i} className="flex items-start gap-3 px-5 py-3 animate-fade-in">
                  <span
                    className={cn(
                      "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full",
                      revealed
                        ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400"
                        : "bg-brand-soft text-brand",
                    )}
                  >
                    {revealed ? <Check className="size-3" /> : <Loader2 className="size-3 animate-spin" />}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-fg">
                      {step.agentName} <span className="font-normal text-muted">· {step.action}</span>
                    </p>
                    <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted">{step.detail}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {turn.done && (
        <>
          <Card className="animate-fade-up">
            <div className="p-5">
              <div className="flex items-start gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-violet-500 text-white">
                  <Sparkles className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-[16px] font-semibold tracking-[-0.01em] text-fg">{r.headline}</h3>
                  <p
                    className="mt-2 text-[14px] leading-relaxed text-muted"
                    dangerouslySetInnerHTML={{ __html: boldify(r.summary) }}
                  />
                </div>
              </div>

              {r.metrics.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  {r.metrics.map((m) => (
                    <div key={m.label} className="surface-inset px-3 py-2.5">
                      <p className="text-[11px] uppercase tracking-[0.06em] text-subtle">{m.label}</p>
                      <p className="mt-1 text-[18px] font-semibold leading-none tracking-[-0.02em] text-fg">
                        {m.value}
                      </p>
                      {m.sub && <p className="mt-1 text-[11px] text-subtle">{m.sub}</p>}
                    </div>
                  ))}
                </div>
              )}

              {r.recommendations.length > 0 && (
                <div className="mt-4 rounded-xl border border-border bg-surface-2/60 p-4">
                  <p className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.07em] text-subtle">
                    <Lightbulb className="size-3.5" /> Recommended next moves
                  </p>
                  <ul className="space-y-1.5">
                    {r.recommendations.map((rec, i) => (
                      <li key={i} className="flex gap-2 text-[13px] leading-relaxed text-fg">
                        <span className="mt-[7px] size-1 shrink-0 rounded-full bg-brand" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {r.complianceNote && (
                <div className="mt-3 flex gap-2.5 rounded-xl border border-amber-300/50 bg-amber-50/60 p-3.5 dark:border-amber-500/25 dark:bg-amber-500/5">
                  <ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <p className="text-[12.5px] leading-relaxed text-muted">{r.complianceNote}</p>
                </div>
              )}

              {r.intent.matched.length > 0 && (
                <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-border pt-3">
                  <span className="text-[11.5px] text-subtle">Understood as:</span>
                  {r.intent.matched.map((m) => (
                    <Badge key={m} tone="muted">
                      {m}
                    </Badge>
                  ))}
                  <Badge tone="brand">{r.intent.kind}</Badge>
                </div>
              )}
            </div>
          </Card>

          {r.properties.length > 0 && (
            <Card className="overflow-hidden animate-fade-up">
              <CardHeader
                title={r.resultLabel || "Property results"}
                subtitle={`${r.properties.length} shown`}
              />
              <PropertyTable leads={r.properties} />
            </Card>
          )}

          {r.businesses.length > 0 && (
            <Card className="overflow-hidden animate-fade-up">
              <CardHeader
                title={r.properties.length ? "Partnership results" : r.resultLabel || "Partnership results"}
                subtitle={`${r.businesses.length} shown`}
              />
              <BusinessTable leads={r.businesses} />
            </Card>
          )}

          {r.customers.length > 0 && (
            <Card className="overflow-hidden animate-fade-up">
              <CardHeader title={r.resultLabel} subtitle={`${r.customers.length} shown`} />
              <ul className="divide-y divide-border">
                {r.customers.map((c) => (
                  <li key={c.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-medium text-fg">{c.name}</p>
                      <p className="mt-0.5 text-[12px] text-subtle">
                        {c.jobType} · {c.neighborhood}, {c.borough}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[13px] font-medium tabular-nums text-fg">{currency(c.jobValue)}</p>
                      <p className="text-[11.5px] text-subtle">Completed {formatDate(c.completedDate)}</p>
                    </div>
                    <Badge tone="warning">Due {formatDate(c.reactivationDue)}</Badge>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {r.suggestions.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {r.suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => onSuggestion(s)}
                  className="rounded-full border border-border bg-surface px-3 py-1.5 text-[12px] text-muted transition-colors hover:border-brand/40 hover:bg-brand-soft hover:text-brand"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** Renders **bold** segments from the Manager's summary text. */
function boldify(text: string) {
  const escaped = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return escaped.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-fg">$1</strong>');
}
