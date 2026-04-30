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
  Clock4,
  Plug,
  HeartPulse,
  Search,
} from "lucide-react";
import { useTenant } from "@/contexts/TenantContext";
import { useRealtimeSubscriptions, useRealtimeToasts } from "@/lib/queries/use-realtime";
import { useProviderHealth } from "@/lib/queries/use-provider-config";
import { useKonversationenQuery } from "@/lib/queries/use-konversationen";
import { useRechnungenQuery } from "@/lib/queries/use-rechnungen";
import { useUrlaubQuery } from "@/lib/queries/use-personal";
import { useLlmUsage } from "@/lib/queries/use-llm-usage";
import { isSameDay } from "@/lib/date-utils";
import { CommandPalette, useCommandPalette } from "@/components/dashboard/CommandPalette";
import ThemeToggle from "@/components/dashboard/ThemeToggle";
import NotificationsDropdown from "@/components/dashboard/NotificationsDropdown";
import WelcomeTour from "@/components/dashboard/WelcomeTour";
import ProfileMenu from "@/components/dashboard/ProfileMenu";
import AssistantWidget from "@/components/dashboard/AssistantWidget";
import { useDocumentTitle } from "@/hooks/use-document-title";

interface NavGroup {
  label: string;
  items: { to: string; icon: typeof Phone; label: string; badge?: string | number }[];
}

const buildNavGroups = (badges: {
  voice: number;
  inbox: number;
  mahnwesen: number;
  personal: number;
}): NavGroup[] => [
  {
    label: "Übersicht",
    items: [{ to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" }],
  },
  {
    label: "KI-Operations",
    items: [
      {
        to: "/dashboard/voice",
        icon: Phone,
        label: "Voice-Agent",
        badge: badges.voice > 0 ? badges.voice : undefined,
      },
      {
        to: "/dashboard/inbox",
        icon: Inbox,
        label: "Inbox",
        badge: badges.inbox > 0 ? badges.inbox : undefined,
      },
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
      {
        to: "/dashboard/mahnwesen",
        icon: Receipt,
        label: "Mahnwesen",
        badge: badges.mahnwesen > 0 ? badges.mahnwesen : undefined,
      },
    ],
  },
  {
    label: "Team & Personal",
    items: [
      { to: "/dashboard/team", icon: UsersRound, label: "Team" },
      {
        to: "/dashboard/personal",
        icon: Clock4,
        label: "Personal",
        badge: badges.personal > 0 ? badges.personal : undefined,
      },
    ],
  },
  {
    label: "Setup",
    items: [
      { to: "/dashboard/system-status", icon: HeartPulse, label: "System-Status" },
      { to: "/dashboard/integrationen", icon: Plug, label: "Integrationen" },
      { to: "/dashboard/import", icon: DatabaseZap, label: "Daten-Import" },
      { to: "/dashboard/branding", icon: Palette, label: "White-Label" },
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
  "/dashboard/personal": "Personal · Zeit & Urlaub",
  "/dashboard/system-status": "System-Status · Live-Readiness",
  "/dashboard/integrationen": "Integrationen · Telefon · WhatsApp · E-Mail · Zahlungen",
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
  useRealtimeToasts();
  const cmdk = useCommandPalette();
  const { data: providerHealth } = useProviderHealth();
  const { data: konversationen = [] } = useKonversationenQuery();
  const { data: rechnungen = [] } = useRechnungenQuery();
  const { data: urlaube = [] } = useUrlaubQuery("pending");
  const { data: llmUsage = [] } = useLlmUsage();
  const integrationsReady = [
    providerHealth?.voice?.enabled && providerHealth?.voice?.status === "active",
    providerHealth?.email?.enabled && providerHealth?.email?.verification_status === "verified",
    providerHealth?.whatsapp?.enabled && providerHealth?.whatsapp?.verification_status === "verified",
    providerHealth?.stripe?.enabled && providerHealth?.stripe?.charges_enabled,
  ].filter(Boolean).length;

  // Live-Sidebar-Badges aus echten Daten.
  const voiceTodayCount = konversationen.filter(
    (k) => k.kanal === "voice" && isSameDay(k.zeitpunkt),
  ).length;
  const inboxUnread = konversationen.filter(
    (k) => k.ungelesen && (k.kanal === "email" || k.kanal === "whatsapp" || k.kanal === "sms"),
  ).length;
  const mahnwesenAktiv = rechnungen.filter(
    (r) => r.mahnstufe > 0 && r.status !== "bezahlt",
  ).length;
  const personalPending = urlaube.length;
  const navGroups = buildNavGroups({
    voice: voiceTodayCount,
    inbox: inboxUnread,
    mahnwesen: mahnwesenAktiv,
    personal: personalPending,
  });

  // Header KI-Cost-Live-Indicator: Token-Verbrauch im aktuellen Monat vs. Tier-Limit.
  const tierLimits: Record<typeof tenant.subscription_tier, number> = {
    foundation: 300_000,
    growth: 2_000_000,
    premium: 999_999_999,
  };
  const tierLimit = tierLimits[tenant.subscription_tier];
  const monthTokens = llmUsage.reduce(
    (s, r) => s + (r.input_tokens_sum ?? 0) + (r.output_tokens_sum ?? 0),
    0,
  );
  const tierPct = tierLimit > 0 ? (monthTokens / tierLimit) * 100 : 0;
  const tokensLabel =
    monthTokens >= 1_000_000
      ? `${(monthTokens / 1_000_000).toFixed(1)}M`
      : monthTokens >= 1_000
      ? `${Math.round(monthTokens / 1_000)}k`
      : monthTokens.toString();
  const kiToneClass =
    tenant.subscription_tier === "premium"
      ? "text-muted-foreground bg-muted/30 border border-border/50"
      : tierPct > 100
      ? "text-rose-700 bg-rose-500/10 border border-rose-500/20"
      : tierPct > 80
      ? "text-amber-700 bg-amber-500/10 border border-amber-500/20"
      : "text-muted-foreground bg-muted/30 border border-border/50";

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
            {integrationsReady === 4 ? (
              <>
                <div
                  className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs text-muted-foreground bg-emerald-500/10 border border-emerald-500/20"
                  role="status"
                  aria-label="Plattform-Status"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Alle KI-Agenten live
                </div>
                {/* Mobile: nur Punkt */}
                <span
                  className="xl:hidden w-2 h-2 rounded-full bg-emerald-500 animate-pulse"
                  aria-label="Plattform live"
                  title="Alle KI-Agenten live"
                />
              </>
            ) : (
              <>
                <Link
                  to="/dashboard/integrationen"
                  className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs text-amber-700 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/15 transition-colors"
                  aria-label="Setup unvollständig"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Setup {integrationsReady}/4
                </Link>
                {/* Mobile: kompakte Pille */}
                <Link
                  to="/dashboard/integrationen"
                  className="xl:hidden inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-semibold text-amber-700 bg-amber-500/10 border border-amber-500/20"
                  aria-label="Setup unvollständig"
                  title="Plattform-Setup unvollständig"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  {integrationsReady}/4
                </Link>
              </>
            )}
            <Link
              to="/dashboard/abrechnung"
              className={`hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${kiToneClass}`}
              title={
                tenant.subscription_tier === "premium"
                  ? `KI-Verbrauch diesen Monat: ${tokensLabel} Tokens (Premium · unbegrenzt)`
                  : `KI-Verbrauch diesen Monat: ${tokensLabel} / ${(tierLimit / 1_000_000).toFixed(tierLimit < 1_000_000 ? 1 : 0)}${tierLimit < 1_000_000 ? "M" : "M"} Tokens (${tierPct.toFixed(0)}%)`
              }
              aria-label="KI-Verbrauch"
            >
              <Cpu className="h-3 w-3" />
              <span className="tabular-nums">
                {tenant.subscription_tier === "premium"
                  ? tokensLabel
                  : `${tokensLabel} · ${tierPct.toFixed(0)}%`}
              </span>
            </Link>
            <ThemeToggle />
            <NotificationsDropdown />
            <ProfileMenu />
          </div>
        </header>

        <CommandPalette open={cmdk.open} onOpenChange={cmdk.setOpen} />
        <WelcomeTour />
        <AssistantWidget />

        <main id="main-content" className="p-3 pb-24 sm:p-6 sm:pb-24 lg:p-8 lg:pb-24 max-w-7xl">
          <Outlet />
        </main>

        <footer className="border-t border-border/50 px-3 sm:px-6 py-4 mt-8">
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center text-xs text-muted-foreground/60">
            <div className="flex flex-wrap gap-4 sm:gap-6">
              <Link to="/datenschutz" className="hover:text-foreground transition-colors">
                Datenschutz
              </Link>
              <Link to="/impressum" className="hover:text-foreground transition-colors">
                Impressum
              </Link>
              <Link to="/agb" className="hover:text-foreground transition-colors">
                AGB
              </Link>
              <Link to="/avv" className="hover:text-foreground transition-colors">
                AVV
              </Link>
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
