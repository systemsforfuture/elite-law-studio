import { useState } from "react";
import {
  FolderOpen,
  ChevronRight,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Circle,
  Calendar,
  Sparkles,
  RefreshCw,
  FileEdit,
  ListChecks,
  Brain,
  Activity as ActivityIcon,
} from "lucide-react";
import {
  findMandant,
  findUser,
  mandantName,
} from "@/data/mockData";
import {
  useAktenQuery,
  useGenerateStrategie,
  useStrategieQuery,
  useStrategienQuery,
} from "@/lib/queries/use-akten";
import { useActivitiesForAkte } from "@/lib/queries/use-activities";
import type { Akte, AktenStufe } from "@/data/types";
import { Button } from "@/components/ui/button";
import ActivityTimeline from "@/components/dashboard/ActivityTimeline";
import EmptyState from "@/components/dashboard/EmptyState";
import { toast } from "sonner";

const stufenSeq: AktenStufe[] = [
  "fallaufnahme",
  "strategie",
  "verfahren",
  "abschluss",
];
const stufeLabel: Record<AktenStufe, string> = {
  fallaufnahme: "Fallaufnahme",
  strategie: "Strategie",
  verfahren: "Verfahren",
  abschluss: "Abschluss",
};

type DetailTab = "ueberblick" | "strategie" | "fristen" | "aktivitaet";

const AktenPage = () => {
  const [selected, setSelected] = useState<Akte | null>(null);
  const [tab, setTab] = useState<DetailTab>("ueberblick");
  const [iterationPrompt, setIterationPrompt] = useState("");
  const { data: akten = [] } = useAktenQuery();
  const { data: strategie } = useStrategieQuery(selected?.id);
  const { data: allStrategien = [] } = useStrategienQuery();
  const { data: acts = [] } = useActivitiesForAkte(selected?.id);
  const generateStrategie = useGenerateStrategie();
  const iterating = generateStrategie.isPending;

  const triggerGenerate = async (akteId: string, prompt?: string) => {
    const t = toast.loading(
      prompt ? "SYSTEMS-KI verfeinert die Strategie…" : "SYSTEMS-KI analysiert die Akte…",
      { description: "Sachverhalt · Risiken · Handlungsoptionen werden ausgearbeitet" },
    );
    try {
      await generateStrategie.mutateAsync({ akte_id: akteId, iteration_prompt: prompt });
      toast.success("Neue Strategie-Version steht zur Review bereit", { id: t });
      setIterationPrompt("");
    } catch (e) {
      toast.error("Strategie-Generierung fehlgeschlagen", {
        id: t,
        description: e instanceof Error ? e.message : String(e),
      });
    }
  };

  if (selected) {
    const md = findMandant(selected.mandant_id);
    const anwalt = findUser(selected.zugewiesener_anwalt_id);
    const stufeIdx = stufenSeq.indexOf(selected.stufe);

    return (
      <div className="space-y-6">
        <button
          onClick={() => {
            setSelected(null);
            setTab("ueberblick");
          }}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück zur Aktenliste
        </button>

        <div className="glass-card p-6 border-border/50">
          <div className="flex items-start justify-between mb-2 flex-wrap gap-3">
            <div>
              <h2 className="text-xl font-display font-bold text-foreground">
                {selected.titel}
              </h2>
              <div className="text-xs text-muted-foreground mt-1">
                {selected.aktenzeichen} · {selected.rechtsgebiet} ·{" "}
                {mandantName(md)} · {anwalt?.name}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Streitwert
              </div>
              <div className="text-2xl font-display font-bold text-foreground tabular-nums">
                {selected.streitwert_eur?.toLocaleString("de-DE") ?? 0}€
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 border-b border-border/50 overflow-x-auto">
          {(
            [
              { v: "ueberblick" as const, label: "Überblick", icon: FolderOpen },
              { v: "strategie" as const, label: "KI-Strategie", icon: Brain, badge: strategie ? `v${strategie.version}` : "Neu" },
              { v: "fristen" as const, label: "Fristen", icon: Calendar },
              { v: "aktivitaet" as const, label: "Aktivität", icon: ActivityIcon },
            ]
          ).map((t) => {
            const TabIcon = t.icon;
            const active = tab === t.v;
            return (
              <button
                key={t.v}
                onClick={() => setTab(t.v)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                  active
                    ? "border-accent text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <TabIcon className="h-4 w-4" />
                {t.label}
                {"badge" in t && t.badge && (
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                      active ? "bg-accent/15 text-accent" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {t.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {tab === "ueberblick" && (
          <>
            <div className="glass-card p-6 border-border/50">
              <p className="text-sm text-foreground/80">
                {selected.beschreibung}
              </p>
              {selected.next_step && (
                <div className="mt-4 p-4 rounded-xl bg-accent/[0.04] border border-accent/15">
                  <div className="text-[10px] uppercase tracking-wider text-accent font-semibold mb-1">
                    Nächster Schritt
                  </div>
                  <div className="text-sm text-foreground">{selected.next_step}</div>
                </div>
              )}
            </div>

            <div className="glass-card p-6 border-border/50">
              <h3 className="font-display font-bold text-foreground mb-6">
                Fortschritt
              </h3>
              <div className="flex items-center justify-between">
                {stufenSeq.map((st, i) => {
                  const done = i < stufeIdx;
                  const current = i === stufeIdx;
                  return (
                    <div key={st} className="flex items-center flex-1">
                      <div className="flex flex-col items-center text-center flex-1">
                        <div
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-3 ${
                            done
                              ? "bg-navy text-primary-foreground"
                              : current
                              ? "bg-accent/15 text-accent ring-4 ring-accent/10"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {done ? (
                            <CheckCircle2 className="h-5 w-5" />
                          ) : current ? (
                            <Clock className="h-5 w-5" />
                          ) : (
                            <Circle className="h-5 w-5" />
                          )}
                        </div>
                        <span className="text-xs font-semibold text-foreground">
                          {stufeLabel[st]}
                        </span>
                      </div>
                      {i < stufenSeq.length - 1 && (
                        <div
                          className={`h-px flex-1 mx-3 -mt-7 ${done ? "bg-navy" : "bg-border"}`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {tab === "strategie" && (
          <>
            {!strategie ? (
              <div className="glass-card p-12 border-accent/30 bg-accent/[0.03] text-center">
                <Brain className="h-14 w-14 text-accent mx-auto mb-4" />
                <h3 className="text-xl font-display font-bold text-foreground mb-2">
                  Noch keine Strategie generiert
                </h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                  Die SYSTEMS-KI analysiert Akte, Dokumente und Mandanten-Historie und
                  schlägt eine vollständige Anwalts-Strategie vor — mit
                  Risiko-Bewertung, Handlungsoptionen und Schriftsatz-Skizze.
                </p>
                <Button
                  variant="gold"
                  size="lg"
                  className="rounded-xl glow-sm-gold"
                  disabled={iterating}
                  onClick={() => selected && triggerGenerate(selected.id)}
                >
                  {iterating ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      KI denkt nach…
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Strategie jetzt generieren
                    </>
                  )}
                </Button>
                <div className="text-[11px] text-muted-foreground/60 mt-3">
                  ~12 Sek · SYSTEMS Strategie-KI · im Tarif inklusive
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="glass-card p-6 border-accent/30 bg-accent/[0.03]">
                  <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-accent/15 flex items-center justify-center">
                        <Brain className="h-5 w-5 text-accent" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-display font-bold text-foreground">
                            Anwalts-Strategie v{strategie.version}
                          </h3>
                          <span
                            className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                              strategie.status === "freigegeben"
                                ? "bg-emerald-500/15 text-emerald-700"
                                : strategie.status === "review"
                                ? "bg-amber-500/15 text-amber-700"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {strategie.status}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {strategie.modell} ·{" "}
                          {new Date(strategie.generated_at).toLocaleString("de-DE")} · Konfidenz{" "}
                          {strategie.konfidenz
                            ? (strategie.konfidenz * 100).toFixed(0)
                            : "—"}
                          %
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="rounded-xl">
                        <FileEdit className="mr-2 h-3.5 w-3.5" />
                        Manuell bearbeiten
                      </Button>
                      <Button variant="gold" size="sm" className="rounded-xl">
                        Freigeben
                      </Button>
                    </div>
                  </div>
                </div>

                <Section title="Sachverhalt">
                  <p className="text-sm text-foreground/85 leading-relaxed">
                    {strategie.sections.sachverhalt}
                  </p>
                </Section>

                <Section title="Rechtliche Einordnung">
                  <p className="text-sm text-foreground/85 leading-relaxed">
                    {strategie.sections.rechtliche_einordnung}
                  </p>
                </Section>

                <Section title="Risiken">
                  <div className="space-y-2">
                    {strategie.sections.risiken.map((r, i) => (
                      <div
                        key={i}
                        className="p-4 rounded-xl border border-border/50 bg-muted/20"
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded shrink-0 mt-0.5 ${
                              r.risiko === "high"
                                ? "bg-rose-500/15 text-rose-700"
                                : r.risiko === "medium"
                                ? "bg-amber-500/15 text-amber-700"
                                : "bg-sky-500/15 text-sky-700"
                            }`}
                          >
                            {r.risiko}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-foreground">
                              {r.titel}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {r.detail}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>

                <Section title="Handlungsoptionen">
                  <div className="space-y-3">
                    {strategie.sections.handlungsoptionen.map((o, i) => (
                      <div
                        key={i}
                        className={`p-5 rounded-2xl border ${
                          o.empfehlung
                            ? "border-accent/40 bg-accent/[0.04] shadow-lg"
                            : "border-border/50 bg-muted/20 opacity-80"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                          <h4 className="font-semibold text-foreground">
                            {o.titel}
                          </h4>
                          {o.empfehlung && (
                            <span className="text-[10px] uppercase font-bold text-accent bg-accent/15 px-2 py-0.5 rounded">
                              Empfehlung
                            </span>
                          )}
                        </div>
                        <div className="grid sm:grid-cols-2 gap-3">
                          <div>
                            <div className="text-[10px] uppercase tracking-wider font-semibold text-emerald-700 mb-1.5">
                              Pro
                            </div>
                            <ul className="space-y-1 text-xs text-foreground">
                              {o.pros.map((p) => (
                                <li key={p} className="flex gap-2">
                                  <span className="text-emerald-600">+</span>
                                  {p}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <div className="text-[10px] uppercase tracking-wider font-semibold text-rose-700 mb-1.5">
                              Contra
                            </div>
                            <ul className="space-y-1 text-xs text-foreground">
                              {o.cons.map((c) => (
                                <li key={c} className="flex gap-2">
                                  <span className="text-rose-600">−</span>
                                  {c}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>

                <Section title="Empfohlene Strategie" highlight>
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                    {strategie.sections.empfohlene_strategie}
                  </p>
                </Section>

                {strategie.sections.schriftsatz_skizze && (
                  <Section title="Schriftsatz-Skizze">
                    <pre className="text-xs text-foreground/85 leading-relaxed whitespace-pre-wrap font-sans">
                      {strategie.sections.schriftsatz_skizze}
                    </pre>
                  </Section>
                )}

                <Section title="Nächste Schritte">
                  <div className="space-y-2">
                    {strategie.sections.naechste_schritte.map((s, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20"
                      >
                        <div className="flex items-center gap-3">
                          <ListChecks className="h-4 w-4 text-accent" />
                          <span className="text-sm text-foreground">
                            {s.titel}
                          </span>
                        </div>
                        <span className="text-xs font-bold tabular-nums text-foreground">
                          {new Date(s.bis).toLocaleDateString("de-DE")}
                        </span>
                      </div>
                    ))}
                  </div>
                </Section>

                <div className="glass-card p-6 border-border/50">
                  <div className="flex items-center gap-2 mb-3">
                    <RefreshCw className="h-4 w-4 text-accent" />
                    <h3 className="font-display font-bold text-foreground">
                      Strategie verfeinern
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Sagen Sie der KI, was anders werden soll — z.B. „Mehr Fokus
                    auf Vergleichsverhandlung, weniger auf Klage" oder „Berücksichtige aktuelle
                    BAG-Rechtsprechung von 2025".
                  </p>
                  <textarea
                    value={iterationPrompt}
                    onChange={(e) => setIterationPrompt(e.target.value)}
                    rows={3}
                    placeholder="Ihre Anpassungswünsche…"
                    className="w-full px-4 py-3 rounded-xl border border-border/50 bg-background/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 mb-3"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="gold"
                      size="sm"
                      className="rounded-xl"
                      disabled={!iterationPrompt.trim() || iterating}
                      onClick={() => {
                        if (selected) triggerGenerate(selected.id, iterationPrompt);
                      }}
                    >
                      {iterating ? (
                        <>
                          <RefreshCw className="mr-2 h-3.5 w-3.5 animate-spin" />
                          Generiere v{strategie.version + 1}…
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-3.5 w-3.5" />
                          Neue Version generieren
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {tab === "fristen" && (
          <div className="glass-card p-6 border-border/50">
            <h3 className="font-display font-bold text-foreground mb-4 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-accent" />
              Fristen
            </h3>
            <div className="space-y-2">
              {selected.fristen.map((f, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between p-4 rounded-xl border ${
                    f.kritisch
                      ? "border-amber-500/30 bg-amber-500/[0.03]"
                      : "border-border/50 bg-muted/20"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {f.kritisch && (
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                    )}
                    <div>
                      <div className="text-sm font-semibold text-foreground">
                        {f.titel}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {f.kritisch ? "Kritisch · KI-Eskalation aktiv" : "Standard"}
                      </div>
                    </div>
                  </div>
                  <div
                    className={`text-sm font-bold tabular-nums ${
                      f.kritisch ? "text-amber-700" : "text-foreground"
                    }`}
                  >
                    {new Date(f.datum).toLocaleDateString("de-DE")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "aktivitaet" && (
          <ActivityTimeline activities={acts} emptyText="Keine Aktivitäten zu dieser Akte." />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-4 gap-4">
        <Stat
          label="Aktive Akten"
          value={String(akten.filter((a) => a.status === "in_bearbeitung").length)}
          sub="In Bearbeitung"
        />
        <Stat label="Offene Fristen" value="6" sub="2 kritisch" accent="amber" />
        <Stat label="Streitwert gesamt" value="266k€" sub="Aktive Akten" />
        <Stat
          label="KI-Strategien"
          value="1"
          sub="Im Review"
          accent="purple"
        />
      </div>

      {akten.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="Noch keine Akten"
          description="Akten entstehen automatisch aus Erstgesprächen oder werden manuell beim Mandanten angelegt. Sobald Sie Mandanten haben, erscheinen ihre Akten hier."
          hint="KI-Strategie-Generator wartet auf Ihre erste Akte"
        />
      ) : (
      <div className="space-y-3">
        {akten.map((a) => {
          const md = findMandant(a.mandant_id);
          const anwalt = findUser(a.zugewiesener_anwalt_id);
          const kritisch = a.fristen.some((f) => f.kritisch);
          const hasStrategy = allStrategien.some((s) => s.akte_id === a.id);
          return (
            <div
              key={a.id}
              onClick={() => {
                setSelected(a);
                setTab("ueberblick");
              }}
              className="glass-card p-5 border-border/50 hover:border-accent/30 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-navy/10 flex items-center justify-center shrink-0">
                    <FolderOpen className="h-5 w-5 text-navy" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground truncate">
                        {a.titel}
                      </h3>
                      {kritisch && (
                        <span className="text-[10px] font-bold uppercase text-amber-700 bg-amber-500/15 px-2 py-0.5 rounded">
                          Kritische Frist
                        </span>
                      )}
                      {hasStrategy && (
                        <span className="text-[10px] font-bold uppercase text-accent bg-accent/15 px-2 py-0.5 rounded flex items-center gap-1">
                          <Brain className="h-2.5 w-2.5" />
                          KI-Strategie
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {a.aktenzeichen} · {a.rechtsgebiet} ·{" "}
                      {mandantName(md)} · {anwalt?.name}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Streitwert
                    </div>
                    <div className="text-sm font-bold text-foreground tabular-nums">
                      {a.streitwert_eur?.toLocaleString("de-DE") ?? 0}€
                    </div>
                  </div>
                  <span className="text-[10px] uppercase font-bold px-2 py-1 rounded bg-accent/10 text-accent">
                    {stufeLabel[a.stufe]}
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-accent group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
};

const Section = ({
  title,
  children,
  highlight,
}: {
  title: string;
  children: React.ReactNode;
  highlight?: boolean;
}) => (
  <div
    className={`glass-card p-6 ${highlight ? "border-accent/40 bg-accent/[0.04]" : "border-border/50"}`}
  >
    <h3
      className={`text-[10px] uppercase tracking-[0.2em] font-bold mb-3 ${
        highlight ? "text-accent" : "text-muted-foreground/70"
      }`}
    >
      {title}
    </h3>
    {children}
  </div>
);

const Stat = ({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent?: "amber" | "purple";
}) => {
  const cls =
    accent === "amber"
      ? "text-amber-600"
      : accent === "purple"
      ? "text-purple-600"
      : "text-foreground";
  return (
    <div className="glass-card p-5 border-border/50">
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
        {label}
      </div>
      <div className={`text-3xl font-display font-black tabular-nums ${cls}`}>
        {value}
      </div>
      <div className="text-xs text-muted-foreground mt-1">{sub}</div>
    </div>
  );
};

export default AktenPage;
