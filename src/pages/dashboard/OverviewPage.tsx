// SYSTEMS™ — OverviewPage v2 (Dashboard-WOW)
//
// Anwalts-zentriertes Dashboard. Statt bunter Marketing-Pille-Optik gibt
// es hier eine cleane Branchenlösung — Layout-Vorbilder: Stripe-Dashboard,
// Linear, Notion. Tinten kommen aus den Status-Tokens (siehe index.css),
// nicht aus Tailwind-Inline-Klassen.
//
// Aufbau:
//   1. Header  — Begrüßung + Plattform-Status + Trust-Signal
//   2. Briefing — »Heute zu tun« mit klickbaren Drill-Downs
//   3. KPI-Row — Pipeline / MTD-Umsatz / Aktive Mandate / KI-ROI mit Sparklines
//   4. Body    — Akten-Funnel + KI-Aktivität (links) · Hot-Leads + Fristen + Termine (rechts)

import { Link } from "react-router-dom";
import { useMemo } from "react";
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  Database,
  FileText,
  Inbox,
  Lock,
  Phone,
  Plug,
  Receipt,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
  Globe,
  ExternalLink,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Sparkline from "@/components/dashboard/Sparkline";
import {
  formatEur,
  formatEurCompact,
  useDashboardMetrics,
} from "@/lib/queries/use-dashboard-metrics";
import { useAktenQuery } from "@/lib/queries/use-akten";
import { useMandantenQuery } from "@/lib/queries/use-mandanten";
import { useRechnungenQuery } from "@/lib/queries/use-rechnungen";
import { useConfirmTermin } from "@/lib/queries/use-termine";
import { useProviderHealth } from "@/lib/queries/use-provider-config";
import { useSeedDemoData } from "@/lib/queries/use-seed-demo";
import { useTenant } from "@/contexts/TenantContext";
import { useEncryption } from "@/contexts/EncryptionContext";
import { greetingForTime } from "@/lib/date-utils";
import { findMandant, findUser, mandantName } from "@/data/mockData";
import type { AktenStufe, Tenant } from "@/data/types";
import { toast } from "sonner";

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

const stufeLabel: Record<AktenStufe, string> = {
  fallaufnahme: "Fallaufnahme",
  strategie: "Strategie",
  verfahren: "Verfahren",
  abschluss: "Abschluss",
};

const trendOfSeries = (values: number[]): "positive" | "negative" | "neutral" => {
  if (values.length < 2) return "neutral";
  const half = Math.floor(values.length / 2);
  const left = values.slice(0, half).reduce((s, v) => s + v, 0);
  const right = values.slice(half).reduce((s, v) => s + v, 0);
  if (right > left * 1.1) return "positive";
  if (right < left * 0.9) return "negative";
  return "neutral";
};

const deltaPct = (values: number[]): string => {
  if (values.length < 2) return "";
  const half = Math.floor(values.length / 2);
  const left = values.slice(0, half).reduce((s, v) => s + v, 0) / Math.max(half, 1);
  const right =
    values.slice(half).reduce((s, v) => s + v, 0) / Math.max(values.length - half, 1);
  if (left === 0 && right === 0) return "—";
  if (left === 0) return "+neu";
  const pct = Math.round(((right - left) / left) * 100);
  if (pct === 0) return "±0 %";
  return `${pct > 0 ? "+" : ""}${pct} %`;
};

// ─────────────────────────────────────────────────────────────────
// Komponente
// ─────────────────────────────────────────────────────────────────

const OverviewPage = () => {
  const { tenant } = useTenant();
  const enc = useEncryption();
  const metrics = useDashboardMetrics();
  const { data: akten = [] } = useAktenQuery();
  const { data: mandanten = [] } = useMandantenQuery();
  const { data: rechnungen = [] } = useRechnungenQuery();
  const { data: health } = useProviderHealth();
  const confirmTermin = useConfirmTermin();
  const seed = useSeedDemoData();

  const integrationsReady = [
    health?.voice?.enabled && health?.voice?.status === "active",
    health?.whatsapp?.enabled && health?.whatsapp?.verification_status === "verified",
    health?.email?.enabled && health?.email?.verification_status === "verified",
    health?.stripe?.enabled && health?.stripe?.charges_enabled,
  ].filter(Boolean).length;
  const integrationsTotal = 4;
  const allIntegrationsActive = integrationsReady === integrationsTotal;

  const isEmptyTenant =
    mandanten.length === 0 && akten.length === 0 && rechnungen.length === 0;

  const handleSeed = async () => {
    const t = toast.loading("Demo-Daten werden angelegt …");
    try {
      const res = await seed.mutateAsync();
      if (res.skipped) {
        toast.info("Demo-Daten übersprungen", {
          id: t,
          description: res.reason ?? "Tenant hat bereits Daten.",
        });
      } else {
        const s = res.seeded;
        toast.success("Demo-Daten angelegt", {
          id: t,
          description: s
            ? `${s.mandanten} Mandanten · ${s.akten} Akten · ${s.termine} Termine · ${s.rechnungen} Rechnungen`
            : "Tenant ist startklar.",
        });
      }
    } catch (e) {
      toast.error("Anlegen fehlgeschlagen", {
        id: t,
        description: e instanceof Error ? e.message : "Unbekannt",
      });
    }
  };

  // Briefing-Aggregation: zu viele kleine Cards verwirren — wir zeigen
  // genau 4 Action-Buckets nach Priorität sortiert.
  const briefingItems = useMemo(() => {
    const items: Array<{
      label: string;
      count: number;
      to: string;
      severity: "critical" | "warning" | "neutral" | "info";
    }> = [
      {
        label: "Eskalierte Anrufe",
        count: metrics.pendingEscalations.length,
        to: "/dashboard/voice",
        severity: "critical",
      },
      {
        label: "Kritische Fristen (≤ 14 T)",
        count: metrics.criticalDeadlines.length,
        to: "/dashboard/akten",
        severity: "warning",
      },
      {
        label: "Termine heute",
        count: metrics.todayTermine.length,
        to: "/dashboard/termine",
        severity: "info",
      },
      {
        label: "Hot-Leads aus Voice",
        count: metrics.hotLeads.length,
        to: "/dashboard/mandanten",
        severity: "info",
      },
    ];
    return items;
  }, [metrics]);

  return (
    <div className="space-y-7">
      {/* Onboarding-State */}
      {isEmptyTenant && <EmptyTenantHero onSeed={handleSeed} seeding={seed.isPending} />}

      {/* Integrations-Warning */}
      {!isEmptyTenant && !allIntegrationsActive && (
        <div className="surface px-4 py-3 flex items-center gap-3 flex-wrap">
          <AlertTriangle className="h-4 w-4 text-[hsl(var(--status-warning))] shrink-0" />
          <div className="flex-1 min-w-0 text-sm">
            <span className="font-medium text-foreground">
              {integrationsReady} / {integrationsTotal} Integrationen aktiv.
            </span>{" "}
            <span className="text-muted-foreground">
              Bis alle vier verbunden sind, kann die KI keine echten Mandanten bedienen.
            </span>
          </div>
          <Link to="/dashboard/integrationen">
            <Button variant="outline" size="sm" className="h-8">
              <Plug className="mr-2 h-3.5 w-3.5" />
              Einrichten
            </Button>
          </Link>
        </div>
      )}

      {/* 1. Header */}
      <header className="flex items-end justify-between flex-wrap gap-4 pt-1">
        <div>
          <h1 className="text-[28px] md:text-[32px] font-display font-bold text-foreground leading-tight tracking-tight">
            {greetingForTime()}, {tenant.inhaber_name.split(" ").pop()}
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            {new Date().toLocaleDateString("de-DE", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-border/60 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-[hsl(var(--status-success))]" />
            Mandatsgeheimnis-konform
          </span>
          {enc.enabled ? (
            <span
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium"
              style={{
                color: "hsl(var(--status-success))",
                background: "hsl(var(--status-success-soft))",
              }}
            >
              <Lock className="h-3.5 w-3.5" />
              E2E-verschlüsselt
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-border/60 text-xs text-muted-foreground">
              <Lock className="h-3.5 w-3.5 opacity-50" />
              Verschlüsselung verfügbar
            </span>
          )}
        </div>
      </header>

      {/* 2. Today-Briefing */}
      <TodayBriefing items={briefingItems} />

      {/* 2b. Meine Webseite — was Mandanten sehen */}
      <MyWebsiteCard tenant={tenant} />

      {/* 3. KPI Row */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          icon={Wallet}
          label="Pipeline"
          value={formatEurCompact(metrics.pipelineEur)}
          hint={`${formatEurCompact(metrics.openInvoicesEur)} offene Forderungen`}
          series={metrics.revenueSeries}
          deltaLabel={deltaPct(metrics.revenueSeries)}
          to="/dashboard/mahnwesen"
        />
        <KpiCard
          icon={Receipt}
          label="Umsatz MtD"
          value={formatEurCompact(metrics.mtdRevenueEur)}
          hint={
            metrics.dso != null ? `Ø ${metrics.dso} Tage bis Zahlung` : "—"
          }
          series={metrics.revenueSeries}
          deltaLabel={deltaPct(metrics.revenueSeries)}
          to="/dashboard/abrechnung"
        />
        <KpiCard
          icon={Users}
          label="Aktive Mandanten"
          value={(tenant.mandanten_count ?? mandanten.length).toLocaleString("de-DE")}
          hint={
            metrics.mandantenLast30 === 0
              ? "kein Zuwachs · 30 T"
              : `+${metrics.mandantenLast30} · 30 T`
          }
          series={metrics.mandantenSeries}
          deltaLabel={deltaPct(metrics.mandantenSeries)}
          to="/dashboard/mandanten"
        />
        <KpiCard
          icon={Sparkles}
          label="KI-Ersparnis heute"
          value={
            metrics.aiSavingsTodayEur === 0
              ? "—"
              : formatEurCompact(metrics.aiSavingsTodayEur)
          }
          hint={
            metrics.voiceCostTodayEur > 0
              ? `Kosten: ${formatEur(metrics.voiceCostTodayEur, true)}`
              : `${metrics.aiHandled24h} KI-Aktionen · 24 h`
          }
          series={metrics.callsSeries.concat(metrics.mailsSeries).slice(-14)}
          deltaLabel=""
          to="/dashboard/agenten"
          highlight
        />
      </section>

      {/* 4. Body */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Linke 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          <AktenFunnel funnel={metrics.aktenFunnel} />
          <AiActivityStream metrics={metrics} />
        </div>

        {/* Rechte 1/3 — Sidebar */}
        <aside className="space-y-6">
          <HotLeadsPanel hotLeads={metrics.hotLeads} />
          <CriticalDeadlinesPanel deadlines={metrics.criticalDeadlines} />
          <UpcomingTerminePanel
            termine={metrics.todayTermine.concat(metrics.unconfirmedTermine).slice(0, 5)}
            onConfirm={(id) => {
              const tid = toast.loading("Wird bestätigt …");
              confirmTermin
                .mutateAsync(id)
                .then(() => toast.success("Termin bestätigt", { id: tid }))
                .catch((e) =>
                  toast.error("Fehler", {
                    id: tid,
                    description: e instanceof Error ? e.message : String(e),
                  }),
                );
            }}
            isPending={confirmTermin.isPending}
          />
        </aside>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// Sub-Komponenten
// ─────────────────────────────────────────────────────────────────

const TodayBriefing = ({
  items,
}: {
  items: Array<{
    label: string;
    count: number;
    to: string;
    severity: "critical" | "warning" | "neutral" | "info";
  }>;
}) => {
  const allZero = items.every((i) => i.count === 0);
  return (
    <section className="surface-elevated p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-foreground tracking-tight uppercase">
          Ihr Tag heute
        </h2>
        <span className="text-[11px] text-muted-foreground">
          {allZero
            ? "Alles ruhig — gute Zeit für Akten-Arbeit."
            : "Diese Punkte erwarten Sie."}
        </span>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {items.map((item) => (
          <Link
            key={item.label}
            to={item.to}
            className={[
              "group block px-4 py-3.5 rounded-lg border transition-colors",
              item.count === 0
                ? "border-border/50 hover:border-border bg-muted/10"
                : item.severity === "critical"
                  ? "border-[hsl(var(--status-critical))] / 40 bg-[hsl(var(--status-critical-soft))] hover:bg-[hsl(var(--status-critical-soft))] hover:border-[hsl(var(--status-critical))]"
                  : item.severity === "warning"
                    ? "border-border/60 bg-[hsl(var(--status-warning-soft))]"
                    : "border-border/60 hover:border-accent/40 bg-card",
            ].join(" ")}
            style={
              item.severity === "critical" && item.count > 0
                ? { borderColor: "hsl(var(--status-critical) / 0.4)" }
                : undefined
            }
          >
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-[28px] font-display font-bold tabular-nums tracking-tight text-foreground">
                {item.count}
              </span>
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-foreground transition-colors" />
            </div>
            <div
              className={
                item.count > 0 && item.severity === "critical"
                  ? "text-xs font-medium"
                  : "text-xs text-muted-foreground"
              }
              style={
                item.count > 0 && item.severity === "critical"
                  ? { color: "hsl(var(--status-critical))" }
                  : undefined
              }
            >
              {item.label}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

const KpiCard = ({
  icon: Icon,
  label,
  value,
  hint,
  series,
  deltaLabel,
  to,
  highlight = false,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  hint: string;
  series: number[];
  deltaLabel: string;
  to: string;
  highlight?: boolean;
}) => {
  const trend = trendOfSeries(series);
  return (
    <Link
      to={to}
      className={[
        "block p-4 rounded-xl border transition-colors group",
        highlight
          ? "border-accent/30 bg-accent/[0.025] hover:border-accent/60"
          : "border-border/60 bg-card hover:border-foreground/20",
      ].join(" ")}
    >
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <Icon className="h-3.5 w-3.5 text-muted-foreground/70" />
          <span className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground">
            {label}
          </span>
        </div>
        {deltaLabel && (
          <span
            className="text-[10px] tabular-nums font-medium flex items-center gap-0.5"
            style={{
              color:
                trend === "positive"
                  ? "hsl(var(--status-success))"
                  : trend === "negative"
                    ? "hsl(var(--status-critical))"
                    : "hsl(var(--muted-foreground))",
            }}
          >
            {trend === "positive" ? (
              <TrendingUp className="h-2.5 w-2.5" />
            ) : trend === "negative" ? (
              <TrendingDown className="h-2.5 w-2.5" />
            ) : null}
            {deltaLabel}
          </span>
        )}
      </div>
      <div className="text-[26px] font-display font-bold text-foreground tabular-nums leading-none tracking-tight">
        {value}
      </div>
      <div className="flex items-end justify-between mt-2 gap-2">
        <span className="text-[11px] text-muted-foreground truncate">{hint}</span>
        <span className="text-muted-foreground/60 shrink-0">
          <Sparkline values={series} trend={trend} width={64} height={20} />
        </span>
      </div>
    </Link>
  );
};

const AktenFunnel = ({
  funnel,
}: {
  funnel: { stufe: AktenStufe; count: number; streitwert_eur: number }[];
}) => {
  const totalCount = funnel.reduce((s, f) => s + f.count, 0);
  const maxCount = Math.max(1, ...funnel.map((f) => f.count));
  return (
    <section className="surface p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground tracking-tight uppercase">
            Akten-Pipeline
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {totalCount} Akten · Σ {formatEurCompact(funnel.reduce((s, f) => s + f.streitwert_eur, 0))} Streitwert
          </p>
        </div>
        <Link
          to="/dashboard/akten"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Alle Akten →
        </Link>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {funnel.map((f) => {
          const pct = (f.count / maxCount) * 100;
          return (
            <Link
              key={f.stufe}
              to={`/dashboard/akten?stufe=${f.stufe}`}
              className="group rounded-lg border border-border/60 bg-muted/10 px-4 py-3.5 hover:border-foreground/20 hover:bg-card transition-colors"
            >
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">
                {stufeLabel[f.stufe]}
              </div>
              <div className="text-2xl font-display font-bold text-foreground tabular-nums leading-none mb-2.5">
                {f.count}
              </div>
              <div className="h-1 rounded-full bg-muted overflow-hidden mb-2">
                <div
                  className="h-full bg-foreground/60 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="text-[10px] tabular-nums text-muted-foreground">
                {formatEurCompact(f.streitwert_eur)}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

const AiActivityStream = ({
  metrics,
}: {
  metrics: ReturnType<typeof useDashboardMetrics>;
}) => {
  const recent = useMemo(() => {
    // 5 zuletzt — Live-Calls zuerst, dann nach Zeit
    const live = metrics.liveCalls;
    const rest = metrics.pendingEscalations
      .concat([])
      .filter((k) => !live.find((l) => l.id === k.id));
    return live
      .concat(rest)
      .slice(0, 6)
      .sort((a, b) => (b.zeitpunkt ?? "").localeCompare(a.zeitpunkt ?? ""));
  }, [metrics]);

  return (
    <section className="surface p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground tracking-tight uppercase flex items-center gap-2">
            KI-Aktivität
            {metrics.liveCalls.length > 0 && (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                style={{
                  color: "hsl(var(--status-critical))",
                  background: "hsl(var(--status-critical-soft))",
                }}
              >
                <span className="status-dot" style={{ background: "hsl(var(--status-critical))" }} />
                {metrics.liveCalls.length} live
              </span>
            )}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {metrics.aiHandled24h} automatisch · {metrics.escalated24h} eskaliert (24 h)
          </p>
        </div>
        <Link
          to="/dashboard/voice"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Alle Anrufe →
        </Link>
      </div>

      <div className="divide-y divide-border/40">
        {recent.length === 0 && (
          <p className="text-xs text-muted-foreground py-6 text-center">
            Noch keine KI-Aktivität in den letzten Stunden.
          </p>
        )}
        {recent.map((k) => {
          const md = findMandant(k.mandant_id);
          const isLive = k.status === "pending" && !k.ended_at;
          const isEsc = k.status === "escalated";
          return (
            <div
              key={k.id}
              className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div
                className="h-8 w-8 rounded-md border border-border/60 flex items-center justify-center shrink-0 bg-muted/30"
              >
                {k.kanal === "voice" ? (
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <Inbox className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className="text-sm font-medium text-foreground truncate">
                    {md ? mandantName(md) : "Unbekannt"}
                  </span>
                  {isLive && (
                    <span className="status-pill status-critical">
                      <span
                        className="status-dot"
                        style={{ background: "hsl(var(--status-critical))" }}
                      />
                      Live
                    </span>
                  )}
                  {isEsc && (
                    <span className="status-pill status-warning">Eskaliert</span>
                  )}
                  {k.ai_handled && !isEsc && !isLive && (
                    <span className="status-pill status-success">
                      <CheckCircle2 className="h-2.5 w-2.5" />
                      KI gelöst
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {k.preview}
                </p>
              </div>
              <span className="text-[10px] tabular-nums text-muted-foreground shrink-0">
                {new Date(k.zeitpunkt).toLocaleTimeString("de-DE", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
};

const HotLeadsPanel = ({
  hotLeads,
}: {
  hotLeads: ReturnType<typeof useDashboardMetrics>["hotLeads"];
}) => {
  if (hotLeads.length === 0) return null;
  return (
    <section className="surface p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground tracking-tight uppercase">
          Hot-Leads
        </h3>
        <span className="text-[10px] text-muted-foreground">
          KI-bewertet
        </span>
      </div>
      <div className="space-y-2">
        {hotLeads.map((hl) => (
          <Link
            key={hl.konversation.id}
            to="/dashboard/voice"
            className="block px-3 py-2.5 rounded-md border border-border/60 hover:border-foreground/20 hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-sm font-medium text-foreground truncate">
                {hl.mandant ? mandantName(hl.mandant) : "Neuer Lead"}
              </span>
              <span className="status-pill status-critical text-[9px]">
                hot
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground line-clamp-1">
              {hl.konversation.structured_data?.next_step ??
                hl.konversation.preview}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
};

const CriticalDeadlinesPanel = ({
  deadlines,
}: {
  deadlines: ReturnType<typeof useDashboardMetrics>["criticalDeadlines"];
}) => (
  <section className="surface p-5">
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-sm font-semibold text-foreground tracking-tight uppercase">
        Kritische Fristen
      </h3>
      <span className="text-[10px] text-muted-foreground">≤ 14 Tage</span>
    </div>
    <div className="space-y-2">
      {deadlines.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2">
          Keine kritischen Fristen in den nächsten 14 Tagen.
        </p>
      ) : (
        deadlines.slice(0, 5).map((d, i) => {
          const overdue = d.daysLeft < 0;
          const tight = d.daysLeft <= 3;
          return (
            <Link
              key={i}
              to="/dashboard/akten"
              className="block px-3 py-2.5 rounded-md border border-border/60 hover:border-foreground/20 transition-colors"
            >
              <div className="flex items-center justify-between mb-0.5 gap-2">
                <span className="text-sm font-medium text-foreground truncate">
                  {d.titel}
                </span>
                <span
                  className="text-[10px] tabular-nums font-semibold shrink-0"
                  style={{
                    color: overdue || tight
                      ? "hsl(var(--status-critical))"
                      : "hsl(var(--muted-foreground))",
                  }}
                >
                  {overdue
                    ? `${Math.abs(d.daysLeft)} T überfällig`
                    : d.daysLeft === 0
                      ? "heute"
                      : `in ${d.daysLeft} T`}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground font-mono">
                {d.akte.aktenzeichen}
              </p>
            </Link>
          );
        })
      )}
    </div>
  </section>
);

const UpcomingTerminePanel = ({
  termine,
  onConfirm,
  isPending,
}: {
  termine: ReturnType<typeof useDashboardMetrics>["todayTermine"];
  onConfirm: (id: string) => void;
  isPending: boolean;
}) => (
  <section className="surface p-5">
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-sm font-semibold text-foreground tracking-tight uppercase flex items-center gap-1.5">
        <CalendarClock className="h-3.5 w-3.5 text-muted-foreground" />
        Termine
      </h3>
      <Link
        to="/dashboard/termine"
        className="text-[11px] text-muted-foreground hover:text-foreground"
      >
        Kalender →
      </Link>
    </div>
    <div className="space-y-2">
      {termine.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2">
          Keine anstehenden Termine.
        </p>
      ) : (
        termine.map((t) => {
          const u = findUser(t.anwalt_id);
          const d = new Date(t.start_at);
          return (
            <div
              key={t.id}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md border border-border/60"
            >
              <div className="flex flex-col items-center justify-center w-10 shrink-0 text-foreground">
                <span className="text-[9px] uppercase font-semibold text-muted-foreground">
                  {d.toLocaleDateString("de-DE", { month: "short" })}
                </span>
                <span className="text-sm font-display font-bold tabular-nums">
                  {d.getDate()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground truncate">
                  {t.titel}
                </div>
                <div className="text-[11px] text-muted-foreground truncate">
                  {d.toLocaleTimeString("de-DE", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  Uhr · {u?.name ?? "—"}
                </div>
              </div>
              {!t.bestaetigt && (
                <button
                  onClick={() => onConfirm(t.id)}
                  disabled={isPending}
                  className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded border border-border hover:border-foreground/30 disabled:opacity-50 shrink-0 transition-colors"
                  title="Termin bestätigen"
                >
                  Bestätigen
                </button>
              )}
            </div>
          );
        })
      )}
    </div>
  </section>
);

const EmptyTenantHero = ({
  onSeed,
  seeding,
}: {
  onSeed: () => void;
  seeding: boolean;
}) => (
  <div className="surface-elevated p-6 flex items-start gap-4 flex-wrap">
    <div className="h-11 w-11 rounded-lg border border-border bg-muted/30 flex items-center justify-center shrink-0">
      <Database className="h-5 w-5 text-muted-foreground" />
    </div>
    <div className="flex-1 min-w-0">
      <h2 className="text-base font-display font-semibold text-foreground mb-1">
        Plattform startklar machen
      </h2>
      <p className="text-sm text-muted-foreground mb-4 max-w-prose">
        Zwei Schritte: Integrationen einrichten (KI-Telefon, E-Mail, Zahlung) —
        dann eigene Mandanten importieren oder mit Demo-Daten testen.
      </p>
      <div className="flex gap-2 flex-wrap">
        <Link to="/dashboard/integrationen">
          <Button size="sm">
            <Plug className="mr-2 h-3.5 w-3.5" />
            Integrationen einrichten
          </Button>
        </Link>
        <Button
          variant="outline"
          size="sm"
          onClick={onSeed}
          disabled={seeding}
        >
          {seeding ? (
            <>
              <Database className="mr-2 h-3.5 w-3.5 animate-pulse" />
              Anlegen …
            </>
          ) : (
            <>
              <Database className="mr-2 h-3.5 w-3.5" />
              Demo-Daten anlegen
            </>
          )}
        </Button>
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────
// Meine-Webseite-Karte
// ─────────────────────────────────────────────────────────────────
//
// Anwalt sieht hier prominent seine eigene Landing-Page-URL + Preview-
// Button. Das ist DAS Produkt das Mandanten sehen, wenn sie über
// Google/Ads/QR auf die Kanzlei stoßen. Daher gehört es ins Dashboard.

const MyWebsiteCard = ({ tenant }: { tenant: Tenant }) => {
  const url = tenant.domain
    ? `https://${tenant.domain}`
    : `${typeof window !== "undefined" ? window.location.origin : ""}/template/kanzlei`;
  const previewUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/template/kanzlei`
      : "/template/kanzlei";

  return (
    <section className="surface-elevated p-5">
      <div className="flex items-start gap-4 flex-wrap">
        <div className="h-11 w-11 rounded-lg border border-border bg-muted/30 flex items-center justify-center shrink-0">
          <Globe className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-1.5">
            <h3 className="text-sm font-semibold text-foreground tracking-tight uppercase">
              Ihre Webseite — was Mandanten sehen
            </h3>
            <span className="text-[11px] text-muted-foreground">
              Live unter Ihrer Domain
            </span>
          </div>
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <code className="text-xs font-mono px-2.5 py-1.5 rounded border border-border/60 bg-muted/20 text-foreground/85">
              {url}
            </code>
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(url);
                  toast.success("URL kopiert");
                } catch {
                  toast.error("Kopieren fehlgeschlagen");
                }
              }}
              className="inline-flex items-center gap-1 px-2 py-1.5 rounded-md text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
              aria-label="URL kopieren"
            >
              <Copy className="h-3 w-3" />
              kopieren
            </button>
          </div>
          <p className="text-xs text-muted-foreground max-w-prose mb-3">
            Drucken Sie diese Adresse auf Visitenkarten, Briefpapier und
            E-Mail-Signatur. Anfragen über die Webseite landen automatisch
            in Ihrer Inbox. Werbeanzeigen können Sie direkt darauf schalten.
          </p>
          <div className="flex flex-wrap gap-2">
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-foreground text-background text-xs font-medium hover:bg-foreground/90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Vorschau öffnen
            </a>
            <Link
              to="/dashboard/branding"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs font-medium text-foreground hover:bg-muted/30 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
            >
              Inhalte bearbeiten
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OverviewPage;

// Tree-shake protection — verhindert dead-code-elimination der Type-Tokens.
void Activity;
void AlertOctagon;
void FileText;
