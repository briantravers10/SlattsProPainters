"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Home, Handshake, CornerDownLeft } from "lucide-react";
import { useData } from "@/lib/store/DataProvider";
import { ScorePill } from "@/components/ui/ScoreIndicators";
import { StageBadge } from "@/components/ui/StageBadge";

export function GlobalSearch({ onClose }: { onClose: () => void }) {
  const { propertyLeads, businessLeads } = useData();
  const [q, setQ] = useState("");
  const router = useRouter();

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) {
      return [
        ...propertyLeads.slice(0, 4).map((p) => ({ kind: "property" as const, lead: p })),
        ...businessLeads.slice(0, 4).map((b) => ({ kind: "business" as const, lead: b })),
      ];
    }
    const props = propertyLeads
      .filter(
        (p) =>
          p.address.toLowerCase().includes(term) ||
          p.neighborhood.toLowerCase().includes(term) ||
          p.borough.toLowerCase().includes(term) ||
          p.ownerLabel.toLowerCase().includes(term),
      )
      .slice(0, 6)
      .map((p) => ({ kind: "property" as const, lead: p }));
    const biz = businessLeads
      .filter(
        (b) =>
          b.businessName.toLowerCase().includes(term) ||
          b.category.toLowerCase().includes(term) ||
          b.neighborhood.toLowerCase().includes(term) ||
          b.borough.toLowerCase().includes(term),
      )
      .slice(0, 6)
      .map((b) => ({ kind: "business" as const, lead: b }));
    return [...props, ...biz];
  }, [q, propertyLeads, businessLeads]);

  const go = (kind: "property" | "business", id: string) => {
    router.push(kind === "property" ? `/property-leads/${id}` : `/partnership-leads/${id}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-[12vh]">
      <div className="absolute inset-0 bg-slate-900/45 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl animate-fade-up">
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search className="size-4 shrink-0 text-subtle" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && results[0]) go(results[0].kind, results[0].lead.id);
            }}
            placeholder="Search addresses, businesses, neighborhoods…"
            className="h-13 w-full bg-transparent py-4 text-[14px] text-fg placeholder:text-subtle outline-none"
          />
          <kbd className="rounded border border-border bg-surface-2 px-1.5 py-0.5 text-[10px] text-subtle">ESC</kbd>
        </div>

        <div className="max-h-[52vh] overflow-y-auto p-2">
          {results.length === 0 && (
            <p className="px-3 py-8 text-center text-[13px] text-muted">
              No leads match &ldquo;{q}&rdquo;.
            </p>
          )}
          {results.map(({ kind, lead }) => (
            <button
              key={lead.id}
              onClick={() => go(kind, lead.id)}
              className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-surface-2"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-subtle group-hover:bg-surface-3">
                {kind === "property" ? <Home className="size-4" /> : <Handshake className="size-4" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13.5px] font-medium text-fg">
                  {kind === "property" ? lead.address : (lead as { businessName: string }).businessName}
                </span>
                <span className="block truncate text-[12px] text-subtle">
                  {lead.neighborhood}, {lead.borough}
                </span>
              </span>
              <StageBadge stage={lead.stage} className="hidden sm:inline-flex" />
              <ScorePill score={lead.score.score} />
              <CornerDownLeft className="size-3.5 shrink-0 text-subtle opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
