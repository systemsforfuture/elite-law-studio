import { useMemo, useState } from "react";
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
  Search,
  Filter,
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
import { useDecryptedSections } from "@/lib/queries/use-encrypted-strategie";
import type { Akte, AktenStufe, AktenStatus } from "@/data/types";
import { Button } from "@/components/ui/button";
import ActivityTimeline from "@/components/dashboard/ActivityTimeline";
import EmptyState from "@/components/dashboard/EmptyState";
import EncryptionUnlockDialog from "@/components/dashboard/EncryptionUnlockDialog";
import { Lock } from "lucide-react";
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

const formatStreitwert = (eur: number): string => {
  if (eur === 0) return "0€";
  if (eur >= 1_000_000) return `${(eur / 1_000_000).toFixed(1)}M€`;
  if (eur >= 1_000) return `${Math.round(eur / 1_000)}k€`;
  return `${eur}€`;
};

const AktenPage = () => {
  const [selected, setSelected] = useState<Akte | null>(null);
  const [tab, setTab] = useState<DetailTab>("ueberblick");
  const [iterationPrompt, setIterationPrompt] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<AktenStatus | "all">("all");
  const [unlockOpen, setUnlockOpen] = useState(false);
  const { data: akten = [] } = useAktenQuery();
  const { data: strategie } = useStrategieQuery(selected?.id);
  const decryption = useDecryptedSections(strategie ?? null);
  const { data: allStrategien = [] } = useStrategienQuery();
  const { data: acts = [] } = useActivitiesForAkte(selected?.id);
  const generateStrategie = useGenerateStrategie();
  const iterating = generateStrategie.isPending;

  const filtered = useMemo(() => {
    return akten.filter((a) => {
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      if (!query.trim()) return true;
      const q = query.trim().toLowerCase();
      const md = findMandant(a.mandant_id);
      return (
        a.titel.toLowerCase().includes(q) ||
        a.aktenzeichen.toLowerCase().includes(q) ||
        (a.rechtsgebiet ?? "").toLowerCase().includes(q) ||
        (md ? mandantName(md).toLowerCase().includes(q) : false)
      );
    });
  }, [akten, query, statusFilter]);

  const aktiveAkten = akten.filter(
    (a) => a.status === "in_bearbeitung" || a.status === "neu" || a.status === "wartend",
  );
  const offeneFristen = aktiveAkten.reduce(
    (acc, a) => {
      acc.total += a.fristen.length;
      acc.kritisch += a.fristen.filter((f) => f.kritisch).length;
      return acc;
    },
    { total: 0, kritisch: 0 },
  );
  const streitwertSum = aktiveAkten.reduce(
    (s, a) => s + (a.streitwert_eur ?? 0),
    0,
  );
  const strategieReview = allStrategien.filter((s) => s.status === "review").length;

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

        <div className="surface p-5">
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
            <div className="surface p-5">
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

            <div className="surface p-5">
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
              <div className="surface p-10 border-accent/30 text-center">
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
                  title="Premium-KI (Opus 4.7) erstellt strukturierte Subsumtion · ~30 Sek · zählt zum monatlichen Tier-Limit"
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
                <div className="surface p-5 border-accent/30">
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
                                ? "status-success"
                                : strategie.status === "review"
                                ? "status-warning"
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
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl"
                        disabled
                        title="Manuelle Bearbeitung der KI-Strategie kommt in einer kommenden Version. Aktuell: »Iterations-Wunsch« unten nutzen oder neue Version generieren."
                      >
                        <FileEdit className="mr-2 h-3.5 w-3.5" />
                        Manuell bearbeiten
                      </Button>
                      <Button
                        variant="gold"
                        size="sm"
                        className="rounded-xl"
                        disabled
                        title="Strategie-Freigabe-Workflow kommt in einer kommenden Version. Aktuell: jede neue Version startet im Status »review« — eine explizite Freigabe ist noch nicht implementiert."
                      >
                        Freigeben
                      </Button>
                    </div>
                  </div>
                </div>

                {decryption.encrypted && (
                  <div className="surface-info p-3 flex items-center gap-2 text-xs">
                    <Lock className="h-3.5 w-3.5 text-info shrink-0" />
                    <span className="text-foreground/85">
                      Diese Strategie ist Mandatsgeheimnis-verschlüsselt.
                      {decryption.sections ? " Sichtbar nur in dieser Session." : null}
                    </span>
                  </div>
                )}

                {decryption.locked && (
                  <div className="surface-warning p-5 text-center space-y-3">
                    <Lock className="h-6 w-6 text-warning mx-auto" />
                    <div>
                      <div className="text-sm font-semibold text-foreground">
                        Strategie ist verschlüsselt
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Bitte entsperren Sie die Verschlüsselung mit Ihrer
                        Passphrase, um den Inhalt zu sehen.
                      </p>
                    </div>
                    <Button size="sm" onClick={() => setUnlockOpen(true)}>
                      Entsperren
                    </Button>
                  </div>
                )}

                {decryption.failed && (
                  <div className="surface-critical p-5 text-center">
                    <div className="text-sm font-semibold text-foreground mb-1">
                      Entschlüsselung fehlgeschlagen
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Der DEK passt nicht zu dieser Strategie. Eventuell mit
                      einem anderen Tenant verschlüsselt, oder Daten korrumpiert.
                    </p>
                  </div>
                )}

                {decryption.sections && (<>

                <Section title="Sachverhalt">
                  <p className="text-sm text-foreground/85 leading-relaxed">
                    {decryption.sections.sachverhalt}
                  </p>
                </Section>

                <Section title="Rechtliche Einordnung">
                  <p className="text-sm text-foreground/85 leading-relaxed">
                    {decryption.sections.rechtliche_einordnung}
                  </p>
                </Section>

                <Section title="Risiken">
                  <div className="space-y-2">
                    {decryption.sections.risiken.map((r, i) => (
                      <div
                        key={i}
                        className="p-4 rounded-xl border border-border/50 bg-muted/20"
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded shrink-0 mt-0.5 ${
                              r.risiko === "high"
                                ? "status-critical"
                                : r.risiko === "medium"
                                ? "status-warning"
                                : "status-info"
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
                    {decryption.sections.handlungsoptionen.map((o, i) => (
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
                            <div className="text-[10px] uppercase tracking-wider font-semibold text-success mb-1.5">
                              Pro
                            </div>
                            <ul className="space-y-1 text-xs text-foreground">
                              {o.pros.map((p) => (
                                <li key={p} className="flex gap-2">
                                  <span className="text-success">+</span>
                                  {p}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <div className="text-[10px] uppercase tracking-wider font-semibold text-critical mb-1.5">
                              Contra
                            </div>
                            <ul className="space-y-1 text-xs text-foreground">
                              {o.cons.map((c) => (
                                <li key={c} className="flex gap-2">
                                  <span className="text-critical">−</span>
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
                    {decryption.sections.empfohlene_strategie}
                  </p>
                </Section>

                {decryption.sections.schriftsatz_skizze && (
                  <Section title="Schriftsatz-Skizze">
                    <pre className="text-xs text-foreground/85 leading-relaxed whitespace-pre-wrap font-sans">
                      {decryption.sections.schriftsatz_skizze}
                    </pre>
                  </Section>
                )}

                <Section title="Nächste Schritte">
                  <div className="space-y-2">
                    {decryption.sections.naechste_schritte.map((s, i) => (
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

                </>)}

                <div className="surface p-5">
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
          <div className="surface p-5">
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
                      ? "surface-warning"
                      : "border-border/50 bg-muted/20"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {f.kritisch && (
                      <AlertTriangle className="h-4 w-4 text-warning" />
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
                      f.kritisch ? "text-warning" : "text-foreground"
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat
          label="Aktive Akten"
          value={String(akten.filter((a) => a.status === "in_bearbeitung").length)}
          sub="In Bearbeitung"
        />
        <Stat
          label="Offene Fristen"
          value={String(offeneFristen.total)}
          sub={offeneFristen.kritisch === 0 ? "keine kritisch" : `${offeneFristen.kritisch} kritisch`}
          severity={offeneFristen.kritisch > 0 ? "warning" : undefined}
        />
        <Stat
          label="Streitwert gesamt"
          value={formatStreitwert(streitwertSum)}
          sub="aktive Akten"
        />
        <Stat
          label="KI-Strategien"
          value={String(strategieReview)}
          sub={strategieReview === 0 ? "keine im Review" : "im Review"}
          severity={strategieReview > 0 ? "info" : undefined}
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
      <>
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            type="search"
            aria-label="Akten, Aktenzeichen oder Mandant durchsuchen"
            placeholder="Akte, Aktenzeichen oder Mandant suchen…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border/50 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <Filter className="h-4 w-4 text-muted-foreground" />
          {(
            [
              { v: "all" as const, label: "Alle" },
              { v: "neu" as const, label: "Neu" },
              { v: "in_bearbeitung" as const, label: "In Bearbeitung" },
              { v: "wartend" as const, label: "Wartend" },
              { v: "abgeschlossen" as const, label: "Abgeschlossen" },
            ]
          ).map((s) => (
            <button
              key={s.v}
              onClick={() => setStatusFilter(s.v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === s.v
                  ? "bg-navy text-primary-foreground"
                  : "bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        {filtered.length !== akten.length && (
          <span className="text-xs text-muted-foreground">
            {filtered.length}/{akten.length}
          </span>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="surface p-8 text-center text-sm text-muted-foreground">
          Keine Akten in diesem Filter.
        </div>
      ) : (
      <div className="space-y-2">
        {filtered.map((a) => {
          const md = findMandant(a.mandant_id);
          const anwalt = findUser(a.zugewiesener_anwalt_id);
          const kritisch = a.fristen.some((f) => f.kritisch);
          const hasStrategy = allStrategien.some((s) => s.akte_id === a.id);
          const stufenIndex =
            (["fallaufnahme", "strategie", "verfahren", "abschluss"] as const).indexOf(a.stufe);
          const updateDays = Math.floor(
            (Date.now() - new Date(a.last_update).getTime()) / 86_400_000,
          );
          const open = () => {
            setSelected(a);
            setTab("ueberblick");
          };
          return (
            <div
              key={a.id}
              role="button"
              tabIndex={0}
              aria-label={`Akte ${a.titel} öffnen`}
              onClick={open}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  open();
                }
              }}
              className="surface px-4 py-3.5 hover:border-foreground/20 transition-colors cursor-pointer group focus:outline-none focus:bg-muted/20"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-lg bg-muted/40 border border-border/50 flex items-center justify-center shrink-0">
                    <FolderOpen className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium text-foreground truncate">
                        {a.titel}
                      </h3>
                      {kritisch && (
                        <span className="status-pill status-warning text-[9px]">
                          Frist kritisch
                        </span>
                      )}
                      {hasStrategy && (
                        <span className="status-pill status-info text-[9px] gap-1">
                          <Brain className="h-2.5 w-2.5" />
                          KI-Strategie
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                      <span className="font-mono">{a.aktenzeichen}</span> ·{" "}
                      {a.rechtsgebiet} · {mandantName(md)}
                      {anwalt?.name && ` · ${anwalt.name}`}
                    </div>
                  </div>
                </div>

                {/* Stufen-Funnel: 4 Dots */}
                <div className="hidden md:flex items-center gap-1 shrink-0" title={`Stufe: ${stufeLabel[a.stufe]}`}>
                  {[0, 1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className={`h-1.5 w-4 rounded-full ${
                        i <= stufenIndex
                          ? "bg-foreground/70"
                          : "bg-muted"
                      }`}
                    />
                  ))}
                  <span className="text-[10px] text-muted-foreground ml-2 tabular-nums uppercase tracking-wider w-20">
                    {stufeLabel[a.stufe]}
                  </span>
                </div>

                <div className="text-right shrink-0 min-w-[90px]">
                  <div className="text-sm font-medium text-foreground tabular-nums">
                    {a.streitwert_eur
                      ? `${a.streitwert_eur.toLocaleString("de-DE")} €`
                      : "—"}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {updateDays <= 0
                      ? "heute"
                      : updateDays === 1
                        ? "gestern"
                        : updateDays < 30
                          ? `vor ${updateDays} T`
                          : `vor ${Math.floor(updateDays / 30)} Mon`}
                  </div>
                </div>

                <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-foreground transition-colors shrink-0" />
              </div>
            </div>
          );
        })}
      </div>
      )}
      </>
      )}
      <EncryptionUnlockDialog open={unlockOpen} onOpenChange={setUnlockOpen} />
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
    className={`surface p-5 ${highlight ? "border-accent/40 bg-accent/[0.04]" : ""}`}
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
  severity,
}: {
  label: string;
  value: string;
  sub: string;
  severity?: "warning" | "info" | "success" | "critical";
}) => {
  const colorVar =
    severity === "warning"
      ? "hsl(var(--status-warning))"
      : severity === "info"
        ? "hsl(var(--status-info))"
        : severity === "success"
          ? "hsl(var(--status-success))"
          : severity === "critical"
            ? "hsl(var(--status-critical))"
            : "hsl(var(--foreground))";
  return (
    <div className="surface p-4">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">
        {label}
      </div>
      <div
        className="text-[22px] font-display font-bold tabular-nums leading-none tracking-tight"
        style={{ color: colorVar }}
      >
        {value}
      </div>
      <div className="text-[11px] text-muted-foreground/80 mt-1">{sub}</div>
    </div>
  );
};

export default AktenPage;
