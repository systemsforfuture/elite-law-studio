import { Link } from "react-router-dom";
import {
  Phone,
  Inbox,
  Receipt,
  Users,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  Sparkles,
  CheckCircle2,
  Clock,
  Activity,
  CalendarClock,
} from "lucide-react";
import {
  kiAgents,
  findMandant,
  findUser,
  mandantName,
} from "@/data/mockData";
import { useTenant } from "@/contexts/TenantContext";
import { useKonversationenQuery } from "@/lib/queries/use-konversationen";
import { useRechnungenQuery } from "@/lib/queries/use-rechnungen";
import { useTermineQuery } from "@/lib/queries/use-termine";
import { useAktenQuery } from "@/lib/queries/use-akten";

const OverviewPage = () => {
  const { tenant } = useTenant();
  const { data: konversationen = [] } = useKonversationenQuery();
  const { data: rechnungen = [] } = useRechnungenQuery();
  const { data: termine = [] } = useTermineQuery();
  const { data: akten = [] } = useAktenQuery();

  const aiHandled24h = kiAgents.reduce(
    (sum, a) => sum + a.letzte_24h.resolved,
    0,
  );
  const escalated24h = kiAgents.reduce(
    (sum, a) => sum + a.letzte_24h.escalated,
    0,
  );
  const offene_rechnungen = rechnungen
    .filter((r) => r.status !== "bezahlt")
    .reduce((sum, r) => sum + r.betrag_brutto, 0);
  const kritische_fristen = akten
    .flatMap((a) => a.fristen.filter((f) => f.kritisch).map((f) => ({ ...f, akte: a })));

  const recent = konversationen
    .slice()
    .sort((a, b) => b.zeitpunkt.localeCompare(a.zeitpunkt))
    .slice(0, 5);

  const todayIso = new Date().toISOString().slice(0, 10);
  const upcomingTermine = termine
    .filter((t) => t.start_at >= todayIso)
    .slice()
    .sort((a, b) => a.start_at.localeCompare(b.start_at))
    .slice(0, 4);

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground">
            Guten Morgen, {tenant.inhaber_name.split(" ").pop()}.
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {new Date().toLocaleDateString("de-DE", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}{" "}
            · Plattform-Status:{" "}
            <span className="text-emerald-600 font-medium">Alle Systeme grün</span>
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-xs font-medium">
          <Activity className="h-3.5 w-3.5" />
          {aiHandled24h} KI-Aktionen in 24h
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi
          icon={Phone}
          label="KI-Anrufe heute"
          value="47"
          delta="+18%"
          trend="up"
          link="/dashboard/voice"
        />
        <Kpi
          icon={Inbox}
          label="Mails heute"
          value="142"
          delta="119 auto"
          trend="up"
          link="/dashboard/inbox"
        />
        <Kpi
          icon={Users}
          label="Aktive Mandanten"
          value={tenant.mandanten_count.toLocaleString("de-DE")}
          delta="+12 / Mo"
          trend="up"
          link="/dashboard/mandanten"
        />
        <Kpi
          icon={Receipt}
          label="Offene Forderungen"
          value={`${offene_rechnungen.toLocaleString("de-DE")}€`}
          delta={`${rechnungen.filter((r) => r.status !== "bezahlt").length} Rechnungen`}
          trend="down"
          link="/dashboard/mahnwesen"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="glass-card p-6 border-border/50">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-display font-bold text-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-accent" />
                  Was Ihre KI in den letzten 24h erledigt hat
                  <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-emerald-700 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full ml-2">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500/60" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                    </span>
                    Live
                  </span>
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {aiHandled24h} automatisch · {escalated24h} an Sie eskaliert
                </p>
              </div>
              <Link
                to="/dashboard/voice"
                className="text-xs text-accent font-medium hover:text-gold-dark"
              >
                Alle ansehen →
              </Link>
            </div>

            <div className="space-y-2">
              {recent.length === 0 && (
                <div className="p-6 rounded-xl border border-dashed border-border/50 bg-muted/10 text-center">
                  <p className="text-xs text-muted-foreground">
                    Noch keine Konversationen. Sobald die KI Anrufe oder
                    Nachrichten beantwortet, erscheinen sie hier.
                  </p>
                </div>
              )}
              {recent.map((k) => {
                const md = findMandant(k.mandant_id);
                const escalated = k.status === "escalated";
                return (
                  <div
                    key={k.id}
                    className={`p-4 rounded-xl border transition-colors ${
                      escalated
                        ? "border-amber-500/30 bg-amber-500/[0.04]"
                        : "border-border/50 bg-muted/20 hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          k.kanal === "voice"
                            ? "bg-emerald-500/15 text-emerald-600"
                            : k.kanal === "whatsapp"
                            ? "bg-green-500/15 text-green-700"
                            : k.kanal === "email"
                            ? "bg-sky-500/15 text-sky-700"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {k.kanal === "voice" ? (
                          <Phone className="h-4 w-4" />
                        ) : (
                          <Inbox className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span className="text-sm font-semibold text-foreground">
                            {md ? mandantName(md) : "Unbekannter Anrufer"}
                          </span>
                          <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-mono">
                            {k.kanal}
                          </span>
                          {escalated && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-500/15 px-2 py-0.5 rounded">
                              eskaliert
                            </span>
                          )}
                          {k.ai_handled && !escalated && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-500/15 px-2 py-0.5 rounded flex items-center gap-1">
                              <CheckCircle2 className="h-2.5 w-2.5" />
                              KI gelöst
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground leading-snug">
                          {k.preview}
                        </p>
                        <span className="text-[10px] text-muted-foreground/60 mt-1 inline-block">
                          {new Date(k.zeitpunkt).toLocaleString("de-DE", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="glass-card p-6 border-border/50">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-display font-bold text-foreground flex items-center gap-2">
                  <CalendarClock className="h-4 w-4 text-accent" />
                  Anstehende Termine
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Nächste 4 Termine — von KI-Koordinator gepflegt
                </p>
              </div>
              <Link
                to="/dashboard/termine"
                className="text-xs text-accent font-medium hover:text-gold-dark"
              >
                Kalender öffnen →
              </Link>
            </div>

            <div className="space-y-2">
              {upcomingTermine.length === 0 && (
                <div className="p-6 rounded-xl border border-dashed border-border/50 bg-muted/10 text-center">
                  <p className="text-xs text-muted-foreground">
                    Keine anstehenden Termine.
                  </p>
                </div>
              )}
              {upcomingTermine.map((t) => {
                const u = findUser(t.anwalt_id);
                const d = new Date(t.start_at);
                return (
                  <div
                    key={t.id}
                    className="flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors"
                  >
                    <div className="w-14 h-14 rounded-xl bg-accent/10 flex flex-col items-center justify-center shrink-0">
                      <span className="text-[10px] uppercase font-semibold text-accent">
                        {d.toLocaleDateString("de-DE", { month: "short" })}
                      </span>
                      <span className="text-lg font-display font-bold text-foreground tabular-nums">
                        {d.getDate()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-foreground truncate">
                        {t.titel}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {d.toLocaleTimeString("de-DE", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        Uhr · {u?.name ?? "—"}
                        {t.ort && ` · ${t.ort}`}
                      </div>
                    </div>
                    {!t.bestaetigt && (
                      <span className="text-[10px] uppercase tracking-wider font-bold text-amber-700 bg-amber-500/15 px-2 py-1 rounded shrink-0">
                        Unbestätigt
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="glass-card p-6 border-amber-500/30 bg-amber-500/[0.03]">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <h3 className="text-sm font-display font-bold text-foreground">
                  Kritische Fristen
                </h3>
                <p className="text-xs text-muted-foreground">
                  Innerhalb der nächsten 14 Tage
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {kritische_fristen.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Keine kritischen Fristen.
                </p>
              ) : (
                kritische_fristen.map((f, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg border border-amber-500/20 bg-background/40"
                  >
                    <div className="text-xs font-semibold text-foreground">
                      {f.titel}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {f.akte.aktenzeichen} ·{" "}
                      <span className="text-amber-700 font-bold">
                        {new Date(f.datum).toLocaleDateString("de-DE")}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="glass-card p-6 border-border/50">
            <h3 className="text-sm font-display font-bold text-foreground mb-4 flex items-center gap-2">
              <Clock className="h-4 w-4 text-accent" />
              Telefon-Guthaben
            </h3>
            <div className="text-3xl font-display font-black text-foreground tabular-nums mb-1">
              184<span className="text-lg text-muted-foreground">€</span>
            </div>
            <div className="text-xs text-muted-foreground mb-4">
              ~610 Restminuten · reicht für 12 Tage
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-4">
              <div
                className="h-full bg-gradient-to-r from-accent to-gold-dark"
                style={{ width: "61%" }}
              />
            </div>
            <Link
              to="/dashboard/abrechnung"
              className="block w-full text-center text-xs font-medium text-accent hover:text-gold-dark py-2 rounded-lg border border-accent/30 hover:border-accent/50 transition-colors"
            >
              Guthaben aufladen
            </Link>
          </section>

          <section className="glass-card p-6 border-border/50">
            <h3 className="text-sm font-display font-bold text-foreground mb-4">
              KI-Performance heute
            </h3>
            <div className="space-y-3">
              {kiAgents.slice(0, 4).map((a) => {
                const total = a.letzte_24h.resolved + a.letzte_24h.escalated;
                const pct = total > 0 ? (a.letzte_24h.resolved / total) * 100 : 100;
                return (
                  <div key={a.slug}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-foreground font-medium truncate">
                        {a.name}
                      </span>
                      <span className="text-muted-foreground tabular-nums">
                        {pct.toFixed(0)}% auto
                      </span>
                    </div>
                    <div className="h-1 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <Link
              to="/dashboard/agenten"
              className="text-xs text-accent font-medium hover:text-gold-dark mt-4 inline-flex items-center gap-1"
            >
              Alle Agenten konfigurieren <ArrowUpRight className="h-3 w-3" />
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
};

const Kpi = ({
  icon: Icon,
  label,
  value,
  delta,
  trend,
  link,
}: {
  icon: typeof Phone;
  label: string;
  value: string;
  delta: string;
  trend: "up" | "down";
  link: string;
}) => (
  <Link
    to={link}
    className="glass-card p-5 border-border/50 hover:border-accent/30 transition-all duration-300 group"
  >
    <div className="flex items-start justify-between mb-3">
      <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
        <Icon className="h-5 w-5 text-accent" />
      </div>
      <ArrowUpRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-accent transition-colors" />
    </div>
    <div className="text-2xl font-display font-black text-foreground tabular-nums">
      {value}
    </div>
    <div className="flex items-center gap-1.5 mt-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={`text-[10px] font-semibold tabular-nums ${
          trend === "up" ? "text-emerald-600" : "text-amber-600"
        } flex items-center gap-0.5`}
      >
        <TrendingUp className={`h-2.5 w-2.5 ${trend === "down" ? "rotate-180" : ""}`} />
        {delta}
      </span>
    </div>
  </Link>
);

export default OverviewPage;
