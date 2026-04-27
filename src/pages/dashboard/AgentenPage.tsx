import { useMemo, useState } from "react";
import {
  Mic,
  Inbox,
  MessageCircle,
  ScanText,
  CalendarDays,
  AlertOctagon,
  PauseCircle,
  PlayCircle,
  Sparkles,
  Activity,
  Network,
} from "lucide-react";
import type { AgentSlug, KIAgent, Tonalitaet } from "@/data/types";
import { Button } from "@/components/ui/button";
import { useAgentsQuery, useUpdateAgentConfig } from "@/lib/queries/use-agent-config";
import { useKonversationenQuery } from "@/lib/queries/use-konversationen";
import { useDokumenteQuery } from "@/lib/queries/use-dokumente";
import { useRechnungenQuery } from "@/lib/queries/use-rechnungen";
import { isWithinLastHours } from "@/lib/date-utils";
import { toast } from "sonner";

const slugToKanal: Partial<Record<AgentSlug, "voice" | "email" | "whatsapp">> = {
  voice_receptionist: "voice",
  email_triagist: "email",
  whatsapp_conversationalist: "whatsapp",
};

const iconMap: Record<AgentSlug, typeof Mic> = {
  voice_receptionist: Mic,
  email_triagist: Inbox,
  whatsapp_conversationalist: MessageCircle,
  dokumenten_analyst: ScanText,
  termin_koordinator: CalendarDays,
  mahnungs_eskalator: AlertOctagon,
};

const colorMap: Record<AgentSlug, { color: string; bg: string }> = {
  voice_receptionist: { color: "text-emerald-600", bg: "bg-emerald-500/10" },
  email_triagist: { color: "text-sky-600", bg: "bg-sky-500/10" },
  whatsapp_conversationalist: {
    color: "text-purple-600",
    bg: "bg-purple-500/10",
  },
  dokumenten_analyst: { color: "text-amber-600", bg: "bg-amber-500/10" },
  termin_koordinator: { color: "text-rose-600", bg: "bg-rose-500/10" },
  mahnungs_eskalator: { color: "text-orange-600", bg: "bg-orange-500/10" },
};

const AgentenPage = () => {
  const { data: kiAgents = [] } = useAgentsQuery();
  const updateConfig = useUpdateAgentConfig();
  const { data: konversationen = [] } = useKonversationenQuery();
  const { data: dokumente = [] } = useDokumenteQuery();
  const { data: rechnungen = [] } = useRechnungenQuery();

  // Live letzte-24h-Stats pro Agent-Slug aus echten Daten.
  const liveStats = useMemo(() => {
    const last24Konv = konversationen.filter((k) => isWithinLastHours(k.zeitpunkt, 24));
    const result: Record<AgentSlug, { resolved: number; escalated: number }> = {
      voice_receptionist: { resolved: 0, escalated: 0 },
      email_triagist: { resolved: 0, escalated: 0 },
      whatsapp_conversationalist: { resolved: 0, escalated: 0 },
      dokumenten_analyst: { resolved: 0, escalated: 0 },
      termin_koordinator: { resolved: 0, escalated: 0 },
      mahnungs_eskalator: { resolved: 0, escalated: 0 },
    };
    for (const k of last24Konv) {
      const slug = (Object.keys(slugToKanal) as AgentSlug[]).find(
        (s) => slugToKanal[s] === k.kanal,
      );
      if (!slug) continue;
      if (k.status === "escalated") result[slug].escalated++;
      else if (k.ai_handled) result[slug].resolved++;
    }
    // dokumenten_analyst: Dokumente mit ai_extracted in letzten 24h.
    result.dokumenten_analyst.resolved = dokumente.filter(
      (d) => d.ai_extracted && isWithinLastHours(d.uploaded_at, 24),
    ).length;
    // mahnungs_eskalator: Rechnungen mit mahnstufe>0 deren naechste_aktion_am in den
    // letzten 24h fiel ODER schon vorbei ist (Eskalation läuft).
    result.mahnungs_eskalator.resolved = rechnungen.filter(
      (r) =>
        r.mahnstufe > 0 &&
        r.naechste_aktion_am &&
        isWithinLastHours(r.naechste_aktion_am, 24),
    ).length;
    return result;
  }, [konversationen, dokumente, rechnungen]);
  const [activeSlug, setActiveSlug] = useState<AgentSlug>("voice_receptionist");
  const active = kiAgents.find((a) => a.slug === activeSlug) ?? kiAgents[0];
  const [draftPrompt, setDraftPrompt] = useState<string>(
    active?.custom_prompt_addition ?? "",
  );
  const [draftThreshold, setDraftThreshold] = useState<number>(
    active?.konfidenz_threshold ?? 0.85,
  );
  const [draftTonalitaet, setDraftTonalitaet] = useState<Tonalitaet>(
    active?.tonalitaet ?? "freundlich",
  );

  // Sync drafts when active changes
  if (active && active.slug !== activeSlug) {
    // No-op: state is updated on click handler below
  }

  const handleAgentSwitch = (a: KIAgent) => {
    setActiveSlug(a.slug);
    setDraftPrompt(a.custom_prompt_addition ?? "");
    setDraftThreshold(a.konfidenz_threshold);
    setDraftTonalitaet(a.tonalitaet);
  };

  const handleSave = async () => {
    if (!active) return;
    const t = toast.loading(`Konfiguration für ${active.name} wird gespeichert…`);
    try {
      await updateConfig.mutateAsync({
        slug: active.slug,
        patch: {
          konfidenz_threshold: draftThreshold,
          tonalitaet: draftTonalitaet,
          custom_prompt_addition: draftPrompt || null,
        },
      });
      toast.success("Gespeichert", {
        id: t,
        description: "Edge Functions nutzen die neuen Werte ab dem nächsten Aufruf.",
      });
    } catch (err) {
      toast.error("Speichern fehlgeschlagen", {
        id: t,
        description: err instanceof Error ? err.message : String(err),
      });
    }
  };

  const handleToggleStatus = async () => {
    if (!active) return;
    const newStatus = active.status === "aktiv" ? "pausiert" : "aktiv";
    try {
      await updateConfig.mutateAsync({
        slug: active.slug,
        patch: { status: newStatus },
      });
      toast.success(
        newStatus === "aktiv"
          ? `${active.name} aktiviert`
          : `${active.name} pausiert`,
      );
    } catch (err) {
      toast.error("Statuswechsel fehlgeschlagen", {
        description: err instanceof Error ? err.message : String(err),
      });
    }
  };

  if (!active) return null;
  const Icon = iconMap[active.slug];
  const colors = colorMap[active.slug];

  const totalActions = Object.values(liveStats).reduce(
    (s, v) => s + v.resolved + v.escalated,
    0,
  );
  const totalResolved = Object.values(liveStats).reduce((s, v) => s + v.resolved, 0);
  const autoQuotePct = totalActions === 0 ? null : (totalResolved / totalActions) * 100;

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="glass-card p-5 border-accent/20 bg-accent/[0.03]">
          <div className="flex items-center gap-2 mb-2">
            <Network className="h-4 w-4 text-accent" />
            <span className="text-xs uppercase tracking-wider font-semibold text-accent">
              Master-Orchestrator
            </span>
          </div>
          <div className="text-2xl font-display font-bold text-foreground">
            Aktiv · {kiAgents.filter((a) => a.status === "aktiv").length}/{kiAgents.length} Agenten
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Routing-Logic gesund · Multi-Provider-Fallback aktiv
          </div>
        </div>
        <div className="glass-card p-5 border-border/50">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
            Letzte 24h
          </div>
          <div className="text-3xl font-display font-black text-foreground tabular-nums">
            {totalActions}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            KI-Aktionen gesamt
          </div>
        </div>
        <div className="glass-card p-5 border-border/50">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
            Auto-Quote
          </div>
          <div className="text-3xl font-display font-black text-emerald-600 tabular-nums">
            {autoQuotePct === null ? "—" : `${autoQuotePct.toFixed(0)}%`}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {autoQuotePct === null ? "Noch keine Aktionen heute" : "Ohne Eskalation gelöst"}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_2fr] gap-6">
        <div className="space-y-2">
          {kiAgents.map((a) => {
            const AgentIcon = iconMap[a.slug];
            const c = colorMap[a.slug];
            const isActive = active.slug === a.slug;
            return (
              <button
                key={a.slug}
                onClick={() => handleAgentSwitch(a)}
                className={`w-full text-left p-4 rounded-2xl border transition-all ${
                  isActive
                    ? "border-accent/40 bg-accent/[0.04] shadow-lg"
                    : "border-border/50 bg-card hover:border-accent/20"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={`w-9 h-9 rounded-xl ${c.bg} flex items-center justify-center`}
                  >
                    <AgentIcon className={`h-4 w-4 ${c.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-foreground">
                      {a.name}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      SYSTEMS-KI · Deutsches Recht
                    </div>
                  </div>
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      a.status === "aktiv"
                        ? "bg-emerald-500 animate-pulse"
                        : "bg-muted"
                    }`}
                  />
                </div>
                <div className="flex gap-3 text-[10px] text-muted-foreground">
                  <span>{liveStats[a.slug].resolved} gelöst</span>
                  <span>{liveStats[a.slug].escalated} eskaliert</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6 border-border/50">
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-4">
                <div
                  className={`w-14 h-14 rounded-2xl ${colors.bg} flex items-center justify-center`}
                >
                  <Icon className={`h-6 w-6 ${colors.color}`} />
                </div>
                <div>
                  <h2 className="text-xl font-display font-bold text-foreground">
                    {active.name}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {active.beschreibung}
                  </p>
                </div>
              </div>
              <Button
                variant={active.status === "aktiv" ? "outline" : "gold"}
                size="sm"
                className="rounded-xl"
                onClick={handleToggleStatus}
                disabled={updateConfig.isPending}
              >
                {active.status === "aktiv" ? (
                  <>
                    <PauseCircle className="mr-2 h-3.5 w-3.5" /> Pausieren
                  </>
                ) : (
                  <>
                    <PlayCircle className="mr-2 h-3.5 w-3.5" /> Aktivieren
                  </>
                )}
              </Button>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <Mini
                label="Spezialisiert auf"
                value="DE-Recht"
                sub="Trainiert auf BGB · BAG · BGH"
              />
              <Mini
                label="Sicherheits-Schwelle"
                value={`${(active.konfidenz_threshold * 100).toFixed(0)}%`}
                sub="darunter Eskalation"
              />
              <Mini
                label="Tonalität"
                value={active.tonalitaet}
                sub="Pro Kanzlei einstellbar"
              />
            </div>
          </div>

          <div className="glass-card p-6 border-border/50">
            <h3 className="font-display font-bold text-foreground mb-4 flex items-center gap-2">
              <Activity className="h-4 w-4 text-accent" />
              Letzte 24h
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <Big
                label="Aktionen"
                value={String(liveStats[active.slug].resolved + liveStats[active.slug].escalated)}
              />
              <Big
                label="Auto-gelöst"
                value={String(liveStats[active.slug].resolved)}
                accent="emerald"
              />
              <Big
                label="Eskaliert"
                value={String(liveStats[active.slug].escalated)}
                accent="amber"
              />
            </div>
          </div>

          <div className="glass-card p-6 border-border/50">
            <h3 className="font-display font-bold text-foreground mb-4 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" />
              Konfiguration
            </h3>

            <div className="space-y-5">
              <div>
                <label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground/70 block mb-2">
                  Tonalität
                </label>
                <div className="flex gap-2 flex-wrap">
                  {(["formal", "freundlich", "empathisch", "direkt"] as Tonalitaet[]).map(
                    (t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setDraftTonalitaet(t)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                          draftTonalitaet === t
                            ? "bg-accent/15 text-accent border border-accent/30"
                            : "bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted"
                        }`}
                      >
                        {t}
                      </button>
                    ),
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground/70 block mb-2">
                  Confidence-Threshold
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0.5"
                    max="0.99"
                    step="0.01"
                    value={draftThreshold}
                    onChange={(e) => setDraftThreshold(parseFloat(e.target.value))}
                    className="flex-1 accent-accent"
                  />
                  <span className="text-sm font-bold text-foreground tabular-nums w-12">
                    {(draftThreshold * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1.5">
                  Unter diesem Wert eskaliert der Agent automatisch.
                </p>
              </div>

              <div>
                <label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground/70 block mb-2">
                  Custom Prompt-Erweiterung
                </label>
                <textarea
                  rows={4}
                  value={draftPrompt}
                  onChange={(e) => setDraftPrompt(e.target.value)}
                  placeholder="Optional: zusätzliche Anweisungen, die diesem Agenten injiziert werden …"
                  className="w-full px-4 py-3 rounded-xl border border-border/50 bg-background/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 font-mono"
                />
              </div>

              <Button
                variant="gold"
                className="w-full rounded-xl"
                onClick={handleSave}
                disabled={updateConfig.isPending}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {updateConfig.isPending ? "Speichere…" : "Konfiguration speichern"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Mini = ({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) => (
  <div className="p-3 rounded-xl border border-border/40 bg-muted/20">
    <div className="text-[10px] uppercase tracking-wider text-muted-foreground/70 mb-0.5">
      {label}
    </div>
    <div className="text-sm font-bold text-foreground capitalize">{value}</div>
    <div className="text-[10px] text-muted-foreground">{sub}</div>
  </div>
);

const Big = ({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "emerald" | "amber";
}) => {
  const cls =
    accent === "emerald"
      ? "text-emerald-600"
      : accent === "amber"
      ? "text-amber-600"
      : "text-foreground";
  return (
    <div className="text-center p-4 rounded-xl bg-muted/20 border border-border/40">
      <div className={`text-3xl font-display font-black tabular-nums ${cls}`}>
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
        {label}
      </div>
    </div>
  );
};

export default AgentenPage;
