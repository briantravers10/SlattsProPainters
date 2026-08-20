"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  Menu,
  X,
  Moon,
  Sun,
  ShieldAlert,
  PaintRoller,
  Search,
  ChevronRight,
} from "lucide-react";
import { NAV_GROUPS, NAV_ITEMS } from "./nav";
import { useTheme } from "./ThemeProvider";
import { APP, DEMO_MODE } from "@/lib/config";
import { cn } from "@/lib/utils";
import { GlobalSearch } from "./GlobalSearch";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
      if (e.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="min-h-dvh bg-bg">
      <DemoBanner />

      {/* Sidebar — desktop */}
      <aside className="fixed inset-y-0 left-0 top-9 z-30 hidden w-[248px] flex-col border-r border-border bg-surface lg:flex">
        <SidebarContent pathname={pathname} />
      </aside>

      {/* Sidebar — mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] animate-fade-in"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-[272px] flex-col border-r border-border bg-surface shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between px-4 py-3.5">
              <Brand />
              <button
                onClick={() => setMobileOpen(false)}
                className="flex size-8 items-center justify-center rounded-lg text-muted hover:bg-surface-2"
                aria-label="Close navigation"
              >
                <X className="size-4.5" />
              </button>
            </div>
            <SidebarContent pathname={pathname} hideBrand onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="lg:pl-[248px]">
        <header className="sticky top-9 z-20 flex h-14 items-center gap-3 border-b border-border bg-bg/85 px-4 backdrop-blur-xl sm:px-6">
          <button
            onClick={() => setMobileOpen(true)}
            className="flex size-9 items-center justify-center rounded-lg text-muted hover:bg-surface-2 lg:hidden"
            aria-label="Open navigation"
          >
            <Menu className="size-5" />
          </button>

          <Breadcrumb pathname={pathname} />

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              className="flex h-9 items-center gap-2 rounded-[10px] border border-border bg-surface px-3 text-[13px] text-subtle transition-colors hover:border-border-strong hover:text-muted"
            >
              <Search className="size-3.5" />
              <span className="hidden sm:inline">Search leads</span>
              <kbd className="ml-1 hidden rounded border border-border bg-surface-2 px-1.5 py-px font-sans text-[10px] text-subtle sm:inline">
                ⌘K
              </kbd>
            </button>
            <ThemeToggle />
          </div>
        </header>

        <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">{children}</main>

        <footer className="mx-auto max-w-[1440px] px-4 pb-10 sm:px-6 lg:px-8">
          <div className="border-t border-border pt-5 text-[12px] leading-relaxed text-subtle">
            <p>
              <strong className="text-muted">{APP.productName}</strong> — demo build for{" "}
              {APP.name}. All property, business, owner and contact data shown is
              synthetic and generated for demonstration purposes. It does not represent real
              people, real businesses or real addresses.
            </p>
            <p className="mt-1.5">
              This demo does not provide legal advice. Compliance rules shown are configurable
              safeguards that must be reviewed against applicable federal, New York State and NYC
              requirements before any real outreach.
            </p>
          </div>
        </footer>
      </div>

      {searchOpen && <GlobalSearch onClose={() => setSearchOpen(false)} />}
    </div>
  );
}

function DemoBanner() {
  if (!DEMO_MODE) return null;
  return (
    <div className="sticky top-0 z-40 flex h-9 items-center justify-center gap-2 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 px-4 text-[11.5px] font-semibold tracking-wide text-white">
      <ShieldAlert className="size-3.5 shrink-0" />
      <span className="truncate">
        DEMO MODE — synthetic data only. No emails, texts, calls or mail are sent from this build.
      </span>
    </div>
  );
}

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-violet-500 text-white shadow-sm">
        <PaintRoller className="size-4.5" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[14px] font-semibold leading-tight tracking-[-0.01em] text-fg">
          {APP.productName}
        </span>
        <span className="block truncate text-[11px] leading-tight text-subtle">{APP.name}</span>
      </span>
    </Link>
  );
}

function SidebarContent({
  pathname,
  hideBrand,
  onNavigate,
}: {
  pathname: string;
  hideBrand?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <>
      {!hideBrand && (
        <div className="flex h-14 items-center border-b border-border px-4">
          <Brand />
        </div>
      )}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {NAV_GROUPS.map((group) => (
          <div key={group} className="mb-5 last:mb-0">
            <p className="mb-1.5 px-2.5 text-[10.5px] font-semibold uppercase tracking-[0.13em] text-subtle">
              {group}
            </p>
            <ul className="space-y-0.5">
              {NAV_ITEMS.filter((i) => i.group === group).map((item) => {
                const active =
                  item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        "group relative flex items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-[13.5px] font-medium transition-colors",
                        active
                          ? "bg-brand-soft text-brand"
                          : "text-muted hover:bg-surface-2 hover:text-fg",
                      )}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-brand" />
                      )}
                      <Icon className={cn("size-4.5 shrink-0", active ? "text-brand" : "text-subtle group-hover:text-muted")} />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t border-border p-3">
        <Link
          href="/ai-manager"
          className="block rounded-xl bg-gradient-to-br from-brand to-violet-500 p-3.5 text-white transition-transform hover:scale-[1.015]"
        >
          <p className="text-[12.5px] font-semibold">Ask the AI Manager</p>
          <p className="mt-0.5 text-[11.5px] leading-snug text-white/80">
            &ldquo;Where should I focus this week?&rdquo;
          </p>
          <span className="mt-2 inline-flex items-center gap-1 text-[11.5px] font-medium">
            Open Manager <ChevronRight className="size-3.5" />
          </span>
        </Link>
      </div>
    </>
  );
}

function Breadcrumb({ pathname }: { pathname: string }) {
  const item =
    NAV_ITEMS.find((i) => (i.href === "/" ? pathname === "/" : pathname.startsWith(i.href))) ??
    NAV_ITEMS[0];
  return (
    <div className="min-w-0">
      <p className="truncate text-[14px] font-semibold tracking-[-0.01em] text-fg">{item.label}</p>
      <p className="hidden truncate text-[11.5px] text-subtle sm:block">{item.description}</p>
    </div>
  );
}

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      className="flex size-9 items-center justify-center rounded-[10px] border border-border bg-surface text-muted transition-colors hover:border-border-strong hover:text-fg"
      aria-label="Toggle colour theme"
    >
      {theme === "light" ? <Moon className="size-4" /> : <Sun className="size-4" />}
    </button>
  );
}
