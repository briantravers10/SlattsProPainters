"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { loadDemoDatabase } from "@/lib/data";
import type {
  ActivityEvent,
  BusinessLead,
  ContactPermissions,
  Customer,
  Lead,
  LeadStage,
  PropertyLead,
} from "@/lib/types";
import { daysFromToday } from "@/lib/utils";

/**
 * Client-side data access layer.
 *
 * Everything the UI reads or mutates goes through this provider. Replacing
 * the demo generators with a real backend means changing only this file and
 * the module it imports from — no component touches raw data.
 */

export interface OutreachLogEntry {
  id: string;
  leadId: string;
  leadName: string;
  channel: string;
  date: string;
  status: "Queued (simulated)";
  note: string;
}

interface DataContextValue {
  propertyLeads: PropertyLead[];
  businessLeads: BusinessLead[];
  customers: Customer[];
  allLeads: Lead[];
  outreachLog: OutreachLogEntry[];
  getLead: (id: string) => Lead | undefined;
  getProperty: (id: string) => PropertyLead | undefined;
  getBusiness: (id: string) => BusinessLead | undefined;
  getCustomer: (id: string) => Customer | undefined;
  moveStage: (id: string, stage: LeadStage) => void;
  updateNotes: (id: string, notes: string) => void;
  setFollowUp: (id: string, date: string | undefined) => void;
  updatePermissions: (id: string, patch: Partial<ContactPermissions>) => void;
  addDiscovered: (properties: PropertyLead[], businesses: BusinessLead[]) => void;
  queueOutreach: (id: string, channel: string) => void;
  advanceFlywheel: (customerId: string) => void;
  resetDemo: () => void;
}

const DataContext = createContext<DataContextValue | null>(null);

let eventCounter = 0;
function makeEvent(
  kind: ActivityEvent["kind"],
  title: string,
  detail: string,
  actor: string,
): ActivityEvent {
  return {
    id: `evt-${++eventCounter}`,
    date: daysFromToday(0),
    kind,
    title,
    detail,
    actor,
  };
}

export function DataProvider({ children }: { children: ReactNode }) {
  const seed = useMemo(() => loadDemoDatabase(), []);
  const [propertyLeads, setPropertyLeads] = useState<PropertyLead[]>(seed.propertyLeads);
  const [businessLeads, setBusinessLeads] = useState<BusinessLead[]>(seed.businessLeads);
  const [customers, setCustomers] = useState<Customer[]>(seed.customers);
  const [outreachLog, setOutreachLog] = useState<OutreachLogEntry[]>([]);

  const patchLead = useCallback(
    (id: string, fn: <T extends Lead>(lead: T) => T) => {
      if (id.startsWith("B-")) {
        setBusinessLeads((prev) => prev.map((l) => (l.id === id ? fn(l) : l)));
      } else {
        setPropertyLeads((prev) => prev.map((l) => (l.id === id ? fn(l) : l)));
      }
    },
    [],
  );

  const moveStage = useCallback(
    (id: string, stage: LeadStage) => {
      patchLead(id, (lead) => ({
        ...lead,
        stage,
        timeline: [
          makeEvent("stage", `Moved to ${stage}`, "Stage updated from the pipeline", "Demo User"),
          ...lead.timeline,
        ],
      }));
    },
    [patchLead],
  );

  const updateNotes = useCallback(
    (id: string, notes: string) => patchLead(id, (lead) => ({ ...lead, notes })),
    [patchLead],
  );

  const setFollowUp = useCallback(
    (id: string, date: string | undefined) => {
      patchLead(id, (lead) => ({
        ...lead,
        followUpDate: date,
        timeline: [
          makeEvent(
            "note",
            date ? `Follow-up set for ${date}` : "Follow-up cleared",
            "Scheduled by the Follow-Up Agent",
            "Follow-Up Agent",
          ),
          ...lead.timeline,
        ],
      }));
    },
    [patchLead],
  );

  const updatePermissions = useCallback(
    (id: string, patch: Partial<ContactPermissions>) => {
      patchLead(id, (lead) => ({
        ...lead,
        permissions: { ...lead.permissions, ...patch },
        timeline: [
          makeEvent(
            "compliance",
            "Contact permissions updated",
            Object.entries(patch)
              .map(([k, v]) => `${k}: ${String(v)}`)
              .join(" · "),
            "Compliance Agent",
          ),
          ...lead.timeline,
        ],
      }));
    },
    [patchLead],
  );

  const addDiscovered = useCallback(
    (properties: PropertyLead[], businesses: BusinessLead[]) => {
      if (properties.length) {
        setPropertyLeads((prev) => {
          const existing = new Set(prev.map((p) => p.id));
          return [...properties.filter((p) => !existing.has(p.id)), ...prev];
        });
      }
      if (businesses.length) {
        setBusinessLeads((prev) => {
          const existing = new Set(prev.map((b) => b.id));
          return [...businesses.filter((b) => !existing.has(b.id)), ...prev];
        });
      }
    },
    [],
  );

  const queueOutreach = useCallback(
    (id: string, channel: string) => {
      let leadName = id;
      patchLead(id, (lead) => {
        leadName = lead.kind === "property" ? lead.address : lead.businessName;
        return {
          ...lead,
          timeline: [
            makeEvent(
              "outreach",
              `${channel} campaign queued`,
              "DEMO MODE — nothing was sent. The Outreach Agent prepared the campaign and it is waiting for human approval.",
              "Outreach Agent (simulated)",
            ),
            ...lead.timeline,
          ],
        };
      });
      setOutreachLog((prev) => [
        {
          id: `out-${prev.length + 1}`,
          leadId: id,
          leadName,
          channel,
          date: daysFromToday(0),
          status: "Queued (simulated)" as const,
          note: "Nothing was sent. Simulated queue only.",
        },
        ...prev,
      ]);
    },
    [patchLead],
  );

  const advanceFlywheel = useCallback((customerId: string) => {
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id !== customerId) return c;
        const idx = c.flywheel.findIndex((f) => f.status === "in-progress");
        if (idx === -1) return c;
        const next = [...c.flywheel];
        next[idx] = { ...next[idx], status: "complete", date: daysFromToday(0), detail: "Completed in demo" };
        if (next[idx + 1]) next[idx + 1] = { ...next[idx + 1], status: "in-progress", detail: "Currently in progress" };
        return { ...c, flywheel: next };
      }),
    );
  }, []);

  const resetDemo = useCallback(() => {
    const fresh = loadDemoDatabase();
    setPropertyLeads(fresh.propertyLeads);
    setBusinessLeads(fresh.businessLeads);
    setCustomers(fresh.customers);
    setOutreachLog([]);
  }, []);

  const value = useMemo<DataContextValue>(() => {
    const allLeads: Lead[] = [...propertyLeads, ...businessLeads];
    return {
      propertyLeads,
      businessLeads,
      customers,
      allLeads,
      outreachLog,
      getLead: (id) => allLeads.find((l) => l.id === id),
      getProperty: (id) => propertyLeads.find((l) => l.id === id),
      getBusiness: (id) => businessLeads.find((l) => l.id === id),
      getCustomer: (id) => customers.find((c) => c.id === id),
      moveStage,
      updateNotes,
      setFollowUp,
      updatePermissions,
      addDiscovered,
      queueOutreach,
      advanceFlywheel,
      resetDemo,
    };
  }, [
    propertyLeads,
    businessLeads,
    customers,
    outreachLog,
    moveStage,
    updateNotes,
    setFollowUp,
    updatePermissions,
    addDiscovered,
    queueOutreach,
    advanceFlywheel,
    resetDemo,
  ]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used inside <DataProvider>");
  return ctx;
}
