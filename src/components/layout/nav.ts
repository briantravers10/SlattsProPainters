import {
  LayoutDashboard,
  Sparkles,
  Home,
  Handshake,
  KanbanSquare,
  Map,
  CalendarClock,
  Repeat,
  Database,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  description: string;
  group: "Overview" | "Leads" | "Operate" | "System";
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, description: "Where to focus this week", group: "Overview" },
  { href: "/ai-manager", label: "AI Manager", icon: Sparkles, description: "Ask for anything in plain English", group: "Overview" },
  { href: "/property-leads", label: "Property Leads", icon: Home, description: "Homeowner & building opportunities", group: "Leads" },
  { href: "/partnership-leads", label: "Partnership Leads", icon: Handshake, description: "Recurring B2B relationships", group: "Leads" },
  { href: "/pipeline", label: "Pipeline", icon: KanbanSquare, description: "CRM stages end to end", group: "Operate" },
  { href: "/map", label: "Map", icon: Map, description: "Territory view across the boroughs", group: "Operate" },
  { href: "/follow-ups", label: "Follow-Ups", icon: CalendarClock, description: "Everything due today", group: "Operate" },
  { href: "/customers", label: "Customers", icon: Repeat, description: "The post-job flywheel", group: "Operate" },
  { href: "/lead-sources", label: "Lead Sources", icon: Database, description: "Data sources & compliance class", group: "System" },
  { href: "/settings", label: "Settings", icon: Settings, description: "Scoring, agents & safeguards", group: "System" },
];

export const NAV_GROUPS = ["Overview", "Leads", "Operate", "System"] as const;
