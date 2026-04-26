import { useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import {
  Bell,
  Menu,
  User,
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
  ChevronDown,
} from "lucide-react";
import { useTenant } from "@/contexts/TenantContext";

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

  return (
    <div className="min-h-screen bg-background flex">
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
        <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-2xl border-b border-border/50 h-16 flex items-center px-6 justify-between">
          <div className="flex items-center gap-4 min-w-0">
            <button
              className="lg:hidden text-foreground p-2 rounded-xl hover:bg-muted transition-colors"
              onClick={() => setSidebarOpen(true)}
              aria-label="Menü"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-display font-bold text-foreground truncate">
              {title}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs text-muted-foreground hover:text-foreground bg-muted/30 hover:bg-muted/60 transition-all border border-border/50">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Alle KI-Agenten aktiv
              <ChevronDown className="h-3 w-3" />
            </button>
            <button className="relative p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full ring-2 ring-background" />
            </button>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-navy to-navy-light flex items-center justify-center shadow-sm">
              <User className="h-4 w-4 text-primary-foreground" />
            </div>
          </div>
        </header>

        <main className="p-6 lg:p-8 max-w-7xl">
          <Outlet />
        </main>

        <footer className="border-t border-border/50 px-6 py-4 mt-8">
          <div className="flex justify-between items-center text-xs text-muted-foreground/60">
            <div className="flex gap-6">
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
