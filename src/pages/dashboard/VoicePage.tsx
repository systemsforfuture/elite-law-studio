import { useMemo, useState } from "react";
import {
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneOff,
  ArrowLeft,
  Mic,
  AlertTriangle,
  Check,
  Settings as SettingsIcon,
  Sparkles,
  Activity,
} from "lucide-react";
import { findMandant, mandantName, kiAgents } from "@/data/mockData";
import type { Konversation } from "@/data/types";
import { useKonversationenQuery } from "@/lib/queries/use-konversationen";
import { useTenant } from "@/contexts/TenantContext";
import { Button } from "@/components/ui/button";
import { SkeletonRow } from "@/components/dashboard/SkeletonLoaders";
import VoiceTestDialog from "@/components/dashboard/VoiceTestDialog";
import VoiceRecordingPlayer from "@/components/dashboard/VoiceRecordingPlayer";
import { isSameDay, isWithinLastDays } from "@/lib/date-utils";

type CallFilter = "all" | "ai" | "escalated" | "spam";

const formatDuration = (sec: number) => {
  if (!sec || sec < 0) return "—";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const VoicePage = () => {
  const { tenant } = useTenant();
  const [tab, setTab] = useState<"calls" | "config">("calls");
  const [selected, setSelected] = useState<Konversation | null>(null);
  const [callFilter, setCallFilter] = useState<CallFilter>("all");
  const voiceAgent = kiAgents.find((a) => a.slug === "voice_receptionist")!;
  const { data: konversationen = [], isLoading } = useKonversationenQuery();
  const voiceCalls = useMemo(
    () => konversationen.filter((k) => k.kanal === "voice"),
    [konversationen],
  );
  const [testOpen, setTestOpen] = useState(false);

  const stats = useMemo(() => {
    const today = voiceCalls.filter((k) => isSameDay(k.zeitpunkt));
    const yesterdayRef = new Date();
    yesterdayRef.setDate(yesterdayRef.getDate() - 1);
    const yesterday = voiceCalls.filter((k) => isSameDay(k.zeitpunkt, yesterdayRef));
    const todayAi = today.filter((k) => k.ai_handled).length;
    const todayEsc = today.filter((k) => k.status === "escalated").length;
    const aiPct = today.length === 0 ? 0 : Math.round((todayAi / today.length) * 100);
    // Δ vs Vortag, in 7-Tage-Fenster gemittelt für Stabilität bei kleinen Volumen.
    const last7 = voiceCalls.filter((k) => isWithinLastDays(k.zeitpunkt, 7)).length / 7;
    const delta = last7 === 0 ? 0 : Math.round(((today.length - last7) / last7) * 100);
    const deltaLabel =
      yesterday.length === 0 && today.length === 0
        ? "—"
        : delta > 0
        ? `+${delta}% vs. Ø Woche`
        : `${delta}% vs. Ø Woche`;
    const durations = today
      .map((k) => k.dauer_sek ?? 0)
      .filter((s) => s > 0);
    const avgDuration =
      durations.length === 0
        ? 0
        : durations.reduce((a, b) => a + b, 0) / durations.length;
    return {
      todayCount: today.length,
      todayAi,
      todayEsc,
      aiPct,
      deltaLabel,
      avgDuration,
    };
  }, [voiceCalls]);

  const filteredCalls = useMemo(() => {
    return voiceCalls.filter((c) => {
      if (callFilter === "ai") return c.ai_handled && c.status !== "escalated";
      if (callFilter === "escalated") return c.status === "escalated";
      if (callFilter === "spam") return c.intent === "spam_robocall";
      return true;
    });
  }, [voiceCalls, callFilter]);

  if (selected) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelected(null)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück zur Anrufliste
        </button>

        <div className="grid lg:grid-cols-[1.5fr_1fr] gap-6">
          <div className="space-y-6">
            <div className="glass-card p-6 border-border/50">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        selected.richtung === "inbound"
                          ? "status-success"
                          : "status-info"
                      }`}
                    >
                      {selected.richtung === "inbound" ? (
                        <PhoneIncoming className="h-4 w-4" />
                      ) : (
                        <PhoneOutgoing className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <h2 className="font-display font-bold text-foreground">
                        {findMandant(selected.mandant_id)
                          ? mandantName(findMandant(selected.mandant_id))
                          : "Unbekannter Anrufer"}
                      </h2>
                      <span className="text-xs text-muted-foreground">
                        {new Date(selected.zeitpunkt).toLocaleString("de-DE")}{" "}
                        · {selected.dauer_sek}s
                      </span>
                    </div>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-lg text-xs font-medium ${
                    selected.status === "automated"
                      ? "status-success"
                      : "status-warning"
                  }`}
                >
                  {selected.status === "automated" ? "KI gelöst" : "Eskaliert"}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-muted/30 border border-border/40 mb-4">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-semibold mb-2">
                  Erkannter Intent
                </div>
                <div className="font-mono text-sm text-foreground">
                  {selected.intent ?? "—"}
                </div>
              </div>

              <VoiceRecordingPlayer
                url={selected.recording_url ?? null}
                durationSec={selected.dauer_sek ?? null}
              />

              {/* Cost + Structured-Data (kommt aus Vapi analysisPlan) */}
              {(selected.cost_eur != null || selected.structured_data) && (
                <div className="mt-4 grid sm:grid-cols-3 gap-3">
                  {selected.cost_eur != null && (
                    <div className="rounded-xl border border-border/50 bg-muted/20 p-3">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Anruf-Kosten
                      </div>
                      <div className="text-base font-display font-bold text-foreground tabular-nums mt-1">
                        {selected.cost_eur.toLocaleString("de-DE", {
                          style: "currency",
                          currency: "EUR",
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 4,
                        })}
                      </div>
                    </div>
                  )}
                  {selected.structured_data?.urgency && (
                    <div className="rounded-xl border border-border/50 bg-muted/20 p-3">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Dringlichkeit
                      </div>
                      <div
                        className={`text-base font-display font-bold tabular-nums mt-1 ${
                          selected.structured_data.urgency === "critical"
                            ? "text-critical"
                            : selected.structured_data.urgency === "high"
                              ? "text-warning"
                              : selected.structured_data.urgency === "medium"
                                ? "text-foreground"
                                : "text-success"
                        }`}
                      >
                        {selected.structured_data.urgency}
                      </div>
                    </div>
                  )}
                  {selected.structured_data?.lead_quality &&
                    selected.structured_data.lead_quality !== "n/a" && (
                      <div className="rounded-xl border border-border/50 bg-muted/20 p-3">
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          Lead-Qualität
                        </div>
                        <div className="text-base font-display font-bold text-foreground tabular-nums mt-1 capitalize">
                          {selected.structured_data.lead_quality}
                        </div>
                      </div>
                    )}
                </div>
              )}

              {selected.structured_data?.next_step && (
                <div className="mt-4 p-4 rounded-xl bg-accent/[0.05] border border-accent/20">
                  <div className="text-[10px] uppercase tracking-wider text-accent font-semibold mb-1">
                    Nächster Schritt (KI-Empfehlung)
                  </div>
                  <p className="text-sm text-foreground">
                    {selected.structured_data.next_step}
                  </p>
                </div>
              )}

              {selected.escalation_reason && (
                <div className="mt-4 p-4 rounded-xl bg-[hsl(var(--status-critical))]/10 border border-[hsl(var(--status-critical))]/30">
                  <div className="text-[10px] uppercase tracking-wider text-critical font-semibold mb-1 flex items-center gap-1.5">
                    <AlertTriangle className="h-3 w-3" />
                    Eskaliert · {selected.escalation_urgency ?? "—"}
                  </div>
                  <p className="text-sm text-foreground">
                    {selected.escalation_reason}
                  </p>
                </div>
              )}
            </div>

            <div className="glass-card p-6 border-border/50">
              <h3 className="text-sm font-display font-bold text-foreground mb-4 flex items-center gap-2">
                <Mic className="h-4 w-4 text-accent" />
                Transcript
              </h3>
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {(selected.transcript ?? []).map((line, i) => (
                  <div
                    key={i}
                    className={`flex gap-3 ${
                      line.speaker === "ai" ? "" : "flex-row-reverse"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-bold shrink-0 ${
                        line.speaker === "ai"
                          ? "bg-accent/15 text-accent"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {line.speaker === "ai" ? "KI" : "M"}
                    </div>
                    <div
                      className={`flex-1 p-3 rounded-xl text-sm ${
                        line.speaker === "ai"
                          ? "bg-accent/[0.06] border border-accent/15"
                          : "bg-muted/40"
                      }`}
                    >
                      <div className="text-[10px] text-muted-foreground mb-1 font-mono">
                        {line.speaker === "ai" ? "Anna (KI)" : "Anrufer"} ·{" "}
                        {line.ts}
                      </div>
                      <div className="text-foreground">{line.text}</div>
                    </div>
                  </div>
                ))}
                {(!selected.transcript || selected.transcript.length === 0) && (
                  <p className="text-sm text-muted-foreground italic">
                    Kein Transcript verfügbar.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="glass-card p-5 border-border/50">
              <h3 className="text-sm font-display font-bold text-foreground mb-3">
                KI-Aktionen
              </h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-success shrink-0 mt-0.5" />
                  <span className="text-foreground">
                    Mandant qualifiziert
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-success shrink-0 mt-0.5" />
                  <span className="text-foreground">Termin gebucht</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-success shrink-0 mt-0.5" />
                  <span className="text-foreground">
                    Bestätigungsmail gesendet
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-success shrink-0 mt-0.5" />
                  <span className="text-foreground">
                    Mandanten-Datensatz angelegt
                  </span>
                </li>
              </ul>
            </div>

            <div className="glass-card p-5 border-accent/30 bg-accent/[0.03]">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-accent" />
                <h3 className="text-sm font-display font-bold text-foreground">
                  Konfidenz-Score
                </h3>
              </div>
              <div className="text-3xl font-display font-black text-accent tabular-nums mb-1">
                94%
              </div>
              <div className="text-xs text-muted-foreground">
                Über Threshold ({voiceAgent.konfidenz_threshold * 100}%) — keine
                Eskalation nötig
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full rounded-xl"
              disabled
              title="Nachträgliche Eskalation eines beendeten Anrufs ist aktuell nicht möglich. Eskalation passiert während des Anrufs durch die KI selbst (Tool-Call escalate_to_lawyer)."
            >
              An Anwalt eskalieren
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 border-b border-border/50">
        {[
          { v: "calls" as const, label: "Anrufprotokoll" },
          { v: "config" as const, label: "Konfiguration" },
        ].map((t) => (
          <button
            key={t.v}
            onClick={() => setTab(t.v)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-all ${
              tab === t.v
                ? "border-accent text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "calls" && (
        <>
          <div className="grid sm:grid-cols-4 gap-4">
            <Stat
              label="Anrufe heute"
              value={stats.todayCount.toString()}
              sub={stats.deltaLabel}
            />
            <Stat
              label="KI-gelöst"
              value={stats.todayAi.toString()}
              sub={stats.todayCount === 0 ? "—" : `${stats.aiPct}% Auto-Quote`}
              accent="emerald"
            />
            <Stat
              label="Eskaliert"
              value={stats.todayEsc.toString()}
              sub={stats.todayEsc === 0 ? "Keine offen" : "An Anwalt weitergegeben"}
              accent="amber"
            />
            <Stat
              label="Ø Dauer"
              value={formatDuration(stats.avgDuration)}
              sub="min:sek"
            />
          </div>

          <div className="flex justify-end">
            <Button
              variant="gold"
              size="sm"
              className="rounded-xl glow-sm-gold"
              onClick={() => setTestOpen(true)}
            >
              <PhoneIncoming className="mr-2 h-3.5 w-3.5" />
              Test-Anruf simulieren
            </Button>
          </div>

          <VoiceTestDialog open={testOpen} onOpenChange={setTestOpen} />

          <div className="glass-card border-border/50 overflow-hidden">
            <div className="p-5 border-b border-border/50 flex items-center justify-between">
              <h3 className="font-display font-bold text-foreground">
                Anrufprotokoll
              </h3>
              <div className="flex gap-2">
                {(
                  [
                    { v: "all" as const, label: "Alle" },
                    { v: "ai" as const, label: "KI" },
                    { v: "escalated" as const, label: "Eskaliert" },
                    { v: "spam" as const, label: "Spam" },
                  ]
                ).map((f) => (
                  <button
                    key={f.v}
                    onClick={() => setCallFilter(f.v)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      callFilter === f.v
                        ? "bg-navy text-primary-foreground"
                        : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="divide-y divide-border/40">
              {isLoading && voiceCalls.length === 0 && (
                <>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <SkeletonRow key={i} />
                  ))}
                </>
              )}
              {!isLoading && voiceCalls.length === 0 && (
                <div className="p-12 text-center">
                  <Phone className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-sm text-foreground font-medium">
                    Keine Anrufe protokolliert
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto mb-4">
                    Sobald jemand auf Ihrer Kanzlei-Nummer anruft, übernimmt
                    der Voice-Receptionist und Sie sehen das Protokoll hier.
                  </p>
                  <a
                    href="/dashboard/integrationen"
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-accent border border-accent/30 hover:bg-accent/[0.04] transition-colors"
                  >
                    KI-Telefon einrichten →
                  </a>
                </div>
              )}
              {!isLoading && voiceCalls.length > 0 && filteredCalls.length === 0 && (
                <div className="p-10 text-center text-xs text-muted-foreground">
                  Keine Anrufe in diesem Filter.
                </div>
              )}
              {filteredCalls.map((c) => {
                const md = findMandant(c.mandant_id);
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelected(c)}
                    className="w-full text-left p-5 hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          c.intent === "spam_robocall"
                            ? "bg-muted text-muted-foreground"
                            : c.richtung === "inbound"
                            ? "status-success"
                            : "status-info"
                        }`}
                      >
                        {c.intent === "spam_robocall" ? (
                          <PhoneOff className="h-4 w-4" />
                        ) : c.richtung === "inbound" ? (
                          <PhoneIncoming className="h-4 w-4" />
                        ) : (
                          <PhoneOutgoing className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-sm font-semibold text-foreground">
                            {md ? mandantName(md) : "Unbekannte Nummer"}
                          </span>
                          <span className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground/70">
                            {c.intent}
                          </span>
                          {c.status === "escalated" && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-warning bg-[hsl(var(--status-warning))]/15 px-2 py-0.5 rounded">
                              eskaliert
                            </span>
                          )}
                          {c.status === "pending" && !c.ended_at && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-critical bg-[hsl(var(--status-critical))]/15 px-2 py-0.5 rounded flex items-center gap-1">
                              <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[hsl(var(--status-critical))]/60" />
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[hsl(var(--status-critical))]" />
                              </span>
                              live
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {c.preview}
                        </p>
                      </div>
                      <div className="text-right text-xs text-muted-foreground shrink-0">
                        <div className="font-mono">
                          {c.dauer_sek
                            ? `${Math.floor(c.dauer_sek / 60)}:${String(c.dauer_sek % 60).padStart(2, "0")}`
                            : c.status === "pending" && !c.ended_at
                              ? "live"
                              : "—"}
                        </div>
                        <div className="text-[10px] mt-0.5">
                          {new Date(c.zeitpunkt).toLocaleString("de-DE", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {tab === "config" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="glass-card p-6 border-border/50 space-y-5">
            <div>
              <h3 className="font-display font-bold text-foreground flex items-center gap-2 mb-1">
                <Phone className="h-4 w-4 text-accent" />
                Telefonnummer
              </h3>
              <div className="font-mono text-2xl font-bold text-foreground">
                +49 30 555 99 88
              </div>
              <div className="text-xs text-muted-foreground">
                SYSTEMS Voice-Engine · 24/7 verfügbar
              </div>
            </div>
            <div className="border-t border-border/40 pt-5">
              <h4 className="text-sm font-semibold text-foreground mb-3">
                Begrüßung
              </h4>
              <div className="p-4 rounded-xl border border-border/50 bg-muted/20 text-sm text-foreground italic">
                „{tenant.branding_config.greeting}"
              </div>
            </div>
            <div className="border-t border-border/40 pt-5">
              <h4 className="text-sm font-semibold text-foreground mb-3">
                Stimme
              </h4>
              <div className="flex items-center justify-between p-4 rounded-xl border border-accent/30 bg-accent/[0.04] flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <Mic className="h-5 w-5 text-accent" />
                  <div>
                    <div className="text-sm font-semibold text-foreground">
                      SYSTEMS Anna · Deutsche KI-Stimme
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Studio-Qualität · natürliches Sprechtempo · konfigurierbar
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg"
                  onClick={() => setTestOpen(true)}
                >
                  Test-Anruf
                </Button>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 border-border/50 space-y-5">
            <div>
              <h3 className="font-display font-bold text-foreground flex items-center gap-2 mb-1">
                <SettingsIcon className="h-4 w-4 text-accent" />
                Routing & Eskalation
              </h3>
              <p className="text-xs text-muted-foreground">
                Wann übernimmt der Mensch?
              </p>
            </div>

            <div className="space-y-3">
              {[
                {
                  label: "Bei Notfall (Stichworte: Verhaftung, Notfall, dringend)",
                  on: true,
                },
                { label: "Bei juristischer Frage (Confidence < 90%)", on: true },
                { label: "Bei Bestandsmandant", on: true },
                { label: "Bei wiederholten Anrufen (3+/Stunde)", on: true },
                { label: "Außerhalb Bürozeiten — alles eskalieren", on: false },
              ].map((rule, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-muted/20"
                >
                  <span
                    className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 ${
                      rule.on ? "bg-accent justify-end" : "bg-muted justify-start"
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full bg-background shadow-sm" />
                  </span>
                  <span className="text-sm text-foreground flex-1">
                    {rule.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-[hsl(var(--status-warning))]/[0.04] border border-[hsl(var(--status-warning))]/30">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                <div className="text-xs text-foreground">
                  <strong>Notfall-Hotline:</strong> {tenant.notfall_nummer}
                  <div className="text-muted-foreground mt-1">
                    Wird bei Notfall-Eskalation sofort angerufen.
                  </div>
                </div>
              </div>
            </div>

            <Button variant="gold" className="w-full rounded-xl" asChild>
              <a href="/dashboard/branding" aria-label="Tonalität und Begrüßung in Branding bearbeiten">
                <Sparkles className="mr-2 h-4 w-4" />
                Tonalität & Begrüßung anpassen
              </a>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

const Stat = ({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent?: "emerald" | "amber";
}) => {
  const accentClass =
    accent === "emerald"
      ? "text-success"
      : accent === "amber"
      ? "text-warning"
      : "text-foreground";
  return (
    <div className="glass-card p-5 border-border/50">
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
        {label}
      </div>
      <div className={`text-3xl font-display font-black tabular-nums ${accentClass}`}>
        {value}
      </div>
      <div className="text-xs text-muted-foreground mt-1">{sub}</div>
    </div>
  );
};

export default VoicePage;
