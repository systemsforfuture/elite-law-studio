import { useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import {
  Menu,
  LogOut,
  Cpu,
  LayoutDashboard,
  Phone,
  Inbox,
  Users,
  FolderOpen,
  CalendarDays,
  FileSearch,
  Receipt,
  BrainCircuit,
  DatabaseZap,
  Palette,
  CreditCard,
  ShieldCheck,
  UsersRound,
  Search,
} from "lucide-react";
import { useTenant } from "@/contexts/TenantContext";
import { useRealtimeSubscriptions } from "@/lib/queries/use-realtime";
import { CommandPalette, useCommandPalette } from "@/components/dashboard/CommandPalette";
import ThemeToggle from "@/components/dashboard/ThemeToggle";
import NotificationsDropdown from "@/components/dashboard/NotificationsDropdown";
import WelcomeTour from "@/components/dashboard/WelcomeTour";
import ProfileMenu from "@/components/dashboard/ProfileMenu";
import { useDocumentTitle } from "@/hooks/use-document-title";

interface NavGroup {
  label: string;
  items: { to: string; icon: typeof Phone; label: string; badge?: string | number }[];
}

const navGroups: NavGroup[] = [
  {
    label: "Übersicht",
    items: [{ to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" }],
  },
  {
    label: "KI-Operations",
    items: [
      { to: "/dashboard/voice", icon: Phone, label: "Voice-Agent", badge: "47" },
      { to: "/dashboard/inbox", icon: Inbox, label: "Inbox", badge: "12" },
      { to: "/dashboard/agenten", icon: BrainCircuit, label: "KI-Agenten" },
    ],
  },
  {
    label: "Kanzlei",
    items: [
      { to: "/dashboard/mandanten", icon: Users, label: "Mandanten" },
      { to: "/dashboard/akten", icon: FolderOpen, label: "Akten" },
      { to: "/dashboard/termine", icon: CalendarDays, label: "Termine" },
      { to: "/dashboard/dokumente", icon: FileSearch, label: "Dokumente" },
      { to: "/dashboard/mahnwesen", icon: Receipt, label: "Mahnwesen", badge: "3" },
    ],
  },
  {
    label: "Setup",
    items: [
      { to: "/dashboard/import", icon: DatabaseZap, label: "Daten-Import" },
      { to: "/dashboard/branding", icon: Palette, label: "White-Label" },
      { to: "/dashboard/team", icon: UsersRound, label: "Team" },
      { to: "/dashboard/abrechnung", icon: CreditCard, label: "Abrechnung" },
      { to: "/dashboard/audit", icon: ShieldCheck, label: "Audit-Log" },
    ],
  },
];

const titleByPath: Record<string, string> = {
  "/dashboard": "Übersicht",
  "/dashboard/voice": "Voice-Agent",
  "/dashboard/inbox": "Inbox · Email & WhatsApp",
  "/dashboard/agenten": "KI-Agenten",
  "/dashboard/mandanten": "Mandanten",
  "/dashboard/akten": "Akten",
  "/dashboard/termine": "Termine & Fristen",
  "/dashboard/dokumente": "Dokumente",
  "/dashboard/mahnwesen": "Mahnwesen",
  "/dashboard/import": "Daten-Import",
  "/dashboard/branding": "White-Label",
  "/dashboard/team": "Team",
  "/dashboard/abrechnung": "Abrechnung",
  "/dashboard/audit": "Audit-Log",
};

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { tenant } = useTenant();
  const title = titleByPath[location.pathname] ?? "Dashboard";
  useDocumentTitle(`${title} · ${tenant.kanzlei_name}`);
  useRealtimeSubscriptions();
  const cmdk = useCommandPalette();

  return (
    <div className="min-h-screen bg-background flex">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:rounded-xl focus:bg-accent focus:text-navy-dark focus:shadow-xl focus:font-medium focus:text-sm"
      >
        Zum Hauptinhalt springen
      </a>
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-navy-dark transform transition-transform duration-500 ease-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } overflow-y-auto`}
      >
        <div className="p-6 border-b border-white/[0.06]">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center">
              <Cpu className="h-5 w-5 text-accent" />
            </div>
            <div>
              <span className="text-sm font-display font-bold text-primary-foreground">
                {tenant.kanzlei_name.toUpperCase()}
              </span>
              <span className="block text-[10px] text-primary-foreground/30 tracking-[0.2em] uppercase">
                · powered by SYSTEMS™
              </span>
            </div>
          </Link>
        </div>

        <nav className="p-4 pb-32 space-y-6">
          {navGroups.map((g) => (
            <div key={g.label}>
              <div className="text-[10px] uppercase tracking-[0.2em] text-primary-foreground/30 px-3 mb-2 font-semibold">
                {g.label}
              </div>
              <div className="space-y-1">
                {g.items.map(({ to, icon: Icon, label, badge }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={to === "/dashboard"}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                        isActive
                          ? "bg-accent/10 text-accent"
                          : "text-primary-foreground/40 hover:text-primary-foreground/70 hover:bg-white/[0.03]"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon className="h-4 w-4" />
                        <span className="flex-1 text-left">{label}</span>
                        {badge && (
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              isActive
                                ? "bg-accent/20 text-accent"
                                : "bg-white/[0.04] text-primary-foreground/40"
                            }`}
                          >
                            {badge}
                          </span>
                        )}
                        {isActive && (
                          <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/[0.06] bg-navy-dark">
          <div className="flex items-center gap-3 mb-3 p-2 rounded-xl bg-white/[0.03]">
            <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center text-xs font-bold text-accent">
              MB
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-primary-foreground truncate">
                {tenant.inhaber_name}
              </div>
              <div className="text-[10px] text-primary-foreground/40 capitalize">
                Owner · {tenant.subscription_tier}
              </div>
            </div>
          </div>
          <Link to="/">
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs text-primary-foreground/30 hover:text-primary-foreground/60 hover:bg-white/[0.03] transition-all">
              <LogOut className="h-4 w-4" />
              Abmelden
            </button>
          </Link>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-navy-dark/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 lg:ml-72 min-w-0">
        <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-2xl border-b border-border/50 h-16 flex items-center px-3 sm:px-6 justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
            <button
              className="lg:hidden text-foreground p-2 rounded-xl hover:bg-muted transition-colors shrink-0"
              onClick={() => setSidebarOpen(true)}
              aria-label="Menü"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-base sm:text-xl font-display font-bold text-foreground truncate">
              {title}
            </h1>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <button
              onClick={() => cmdk.setOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs text-muted-foreground hover:text-foreground bg-muted/30 hover:bg-muted/60 transition-all border border-border/50"
            >
              <Search className="h-3 w-3" />
              <span>Suchen…</span>
              <kbd className="ml-2 px-1.5 py-0.5 rounded bg-background border border-border/50 font-mono text-[9px]">
                ⌘K
              </kbd>
            </button>
            <button
              onClick={() => cmdk.setOpen(true)}
              className="sm:hidden p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              aria-label="Suchen"
            >
              <Search className="h-4 w-4" />
            </button>
            <div
              className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs text-muted-foreground bg-muted/30 border border-border/50"
              role="status"
              aria-label="KI-Agenten Status"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Alle KI-Agenten aktiv
            </div>
            <ThemeToggle />
            <NotificationsDropdown />
            <ProfileMenu />
          </div>
        </header>

        <CommandPalette open={cmdk.open} onOpenChange={cmdk.setOpen} />
        <WelcomeTour />

        <main id="main-content" className="p-3 sm:p-6 lg:p-8 max-w-7xl">
          <Outlet />
        </main>

        <footer className="border-t border-border/50 px-3 sm:px-6 py-4 mt-8">
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center text-xs text-muted-foreground/60">
            <div className="flex flex-wrap gap-4 sm:gap-6">
              <a href="#" className="hover:text-foreground transition-colors">
                Datenschutz
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Impressum
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                AVV
              </a>
            </div>
            <div className="hidden sm:block">
              SYSTEMS™ v1.0 · {tenant.subdomain}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default DashboardLayout;
