// SYSTEMS™ — Unified-Timeline für Mandant-Detail
//
// Alle Mandant-Events (Aktivitäten + Konversationen + Termine + Rechnungen)
// chronologisch in einem Stream. Voice-Anrufe sind expandable mit
// Transcript-Auszug + Audio-Player inline. Filter nach Quelle (KI / Anwalt /
// Mandant) + Typ.
//
// Layout-Vorbild: Linear Activity-Feed — viel Whitespace, type-spezifische
// Icons, dezent eingerückte Sub-Items wenn expandiert.

import { useMemo, useState } from "react";
import {
  Phone,
  Mail,
  MessageCircle,
  Calendar,
  Receipt,
  FileText,
  CheckCircle2,
  Bot,
  User,
  Cog,
  ChevronDown,
  ChevronRight,
  AlertOctagon,
  Brain,
  StickyNote,
  ScanLine,
} from "lucide-react";
import type {
  Activity,
  ActivityType,
  Konversation,
  Rechnung,
  Termin,
} from "@/data/types";
import VoiceRecordingPlayer from "@/components/dashboard/VoiceRecordingPlayer";

// ─────────────────────────────────────────────────────────────────
// Vereinheitlichtes Event-Modell
// ─────────────────────────────────────────────────────────────────

type UnifiedEvent =
  | {
      kind: "activity";
      ts: string;
      activity: Activity;
    }
  | {
      kind: "konversation";
      ts: string;
      konversation: Konversation;
    }
  | {
      kind: "termin";
      ts: string;
      termin: Termin;
    }
  | {
      kind: "rechnung";
      ts: string;
      rechnung: Rechnung;
    };

const activityMeta: Record<
  ActivityType,
  { icon: typeof Phone; tone: string; label: string }
> = {
  voice_call: { icon: Phone, tone: "text-success", label: "Anruf" },
  email_in: { icon: Mail, tone: "text-info", label: "E-Mail" },
  email_out: { icon: Mail, tone: "text-info", label: "E-Mail" },
  whatsapp: { icon: MessageCircle, tone: "text-success", label: "WhatsApp" },
  document_upload: { icon: FileText, tone: "text-muted-foreground", label: "Dokument" },
  document_analyzed: { icon: ScanLine, tone: "text-info", label: "KI-Analyse" },
  termin_created: { icon: Calendar, tone: "text-warning", label: "Termin" },
  termin_completed: { icon: CheckCircle2, tone: "text-success", label: "Termin" },
  rechnung_sent: { icon: Receipt, tone: "text-info", label: "Rechnung" },
  rechnung_paid: { icon: Receipt, tone: "text-success", label: "Zahlung" },
  mahnung_sent: { icon: AlertOctagon, tone: "text-warning", label: "Mahnung" },
  akte_status_change: { icon: FileText, tone: "text-muted-foreground", label: "Akte" },
  ai_strategy_generated: { icon: Brain, tone: "text-info", label: "KI-Strategie" },
  anwalt_note: { icon: StickyNote, tone: "text-warning", label: "Notiz" },
  mandant_status_change: { icon: Cog, tone: "text-muted-foreground", label: "Status" },
};

const kanalMeta = {
  voice: { icon: Phone, label: "Anruf" },
  email: { icon: Mail, label: "E-Mail" },
  whatsapp: { icon: MessageCircle, label: "WhatsApp" },
  sms: { icon: MessageCircle, label: "SMS" },
} as const;

const actorIcon = { ai: Bot, anwalt: User, mandant: User, system: Cog } as const;

const groupByDay = (events: UnifiedEvent[]): Array<[string, UnifiedEvent[]]> => {
  const map = new Map<string, UnifiedEvent[]>();
  for (const e of events) {
    const day = e.ts.slice(0, 10);
    const arr = map.get(day) ?? [];
    arr.push(e);
    map.set(day, arr);
  }
  return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
};

const dayLabel = (iso: string): string => {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  if (iso === today) return "Heute";
  if (iso === yesterday) return "Gestern";
  return new Date(iso).toLocaleDateString("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
};

// ─────────────────────────────────────────────────────────────────
// Hauptkomponente
// ─────────────────────────────────────────────────────────────────

interface Props {
  activities: Activity[];
  konversationen: Konversation[];
  termine: Termin[];
  rechnungen: Rechnung[];
}

type SourceFilter = "all" | "calls" | "emails" | "termine" | "rechnungen";

const MandantUnifiedTimeline = ({
  activities,
  konversationen,
  termine,
  rechnungen,
}: Props) => {
  const [filter, setFilter] = useState<SourceFilter>("all");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const events = useMemo<UnifiedEvent[]>(() => {
    // Activities sind oft Duplikate von Konversationen (z.B. voice_call). Wir
    // nutzen die Konversation als ground-truth wenn vorhanden, und schließen
    // Activities mit gleicher link_to.id aus.
    const linkedKonvIds = new Set(
      activities
        .filter((a) => a.link_to?.module === "voice")
        .map((a) => a.link_to?.id)
        .filter(Boolean) as string[],
    );

    const all: UnifiedEvent[] = [
      ...konversationen.map<UnifiedEvent>((k) => ({
        kind: "konversation",
        ts: k.zeitpunkt,
        konversation: k,
      })),
      ...termine.map<UnifiedEvent>((t) => ({
        kind: "termin",
        ts: t.start_at,
        termin: t,
      })),
      ...rechnungen.map<UnifiedEvent>((r) => ({
        kind: "rechnung",
        ts: r.rechnungsdatum,
        rechnung: r,
      })),
      ...activities
        .filter((a) => {
          // Skip activities die schon als konversation auftauchen
          if (a.link_to?.module === "voice" && linkedKonvIds.has(a.link_to.id))
            return false;
          return true;
        })
        .map<UnifiedEvent>((a) => ({
          kind: "activity",
          ts: a.ts,
          activity: a,
        })),
    ];

    return all.sort((a, b) => (b.ts ?? "").localeCompare(a.ts ?? ""));
  }, [activities, konversationen, termine, rechnungen]);

  const filtered = useMemo(() => {
    if (filter === "all") return events;
    return events.filter((e) => {
      if (filter === "calls") {
        if (e.kind === "konversation") return e.konversation.kanal === "voice";
        if (e.kind === "activity") return e.activity.type === "voice_call";
        return false;
      }
      if (filter === "emails") {
        if (e.kind === "konversation")
          return ["email", "whatsapp"].includes(e.konversation.kanal);
        if (e.kind === "activity")
          return ["email_in", "email_out", "whatsapp"].includes(e.activity.type);
        return false;
      }
      if (filter === "termine") return e.kind === "termin";
      if (filter === "rechnungen") return e.kind === "rechnung";
      return true;
    });
  }, [events, filter]);

  const groups = useMemo(() => groupByDay(filtered), [filtered]);

  if (events.length === 0) {
    return (
      <div className="surface p-12 text-center">
        <p className="text-sm text-muted-foreground">
          Noch keine Aktivität bei diesem Mandanten.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-1.5 flex-wrap">
        {(
          [
            { v: "all" as const, label: "Alle", count: events.length },
            {
              v: "calls" as const,
              label: "Anrufe",
              count: events.filter(
                (e) =>
                  (e.kind === "konversation" && e.konversation.kanal === "voice") ||
                  (e.kind === "activity" && e.activity.type === "voice_call"),
              ).length,
            },
            {
              v: "emails" as const,
              label: "Nachrichten",
              count: events.filter(
                (e) =>
                  (e.kind === "konversation" &&
                    ["email", "whatsapp"].includes(e.konversation.kanal)) ||
                  (e.kind === "activity" &&
                    ["email_in", "email_out", "whatsapp"].includes(
                      e.activity.type,
                    )),
              ).length,
            },
            {
              v: "termine" as const,
              label: "Termine",
              count: events.filter((e) => e.kind === "termin").length,
            },
            {
              v: "rechnungen" as const,
              label: "Rechnungen",
              count: events.filter((e) => e.kind === "rechnung").length,
            },
          ]
        ).map((f) => (
          <button
            key={f.v}
            onClick={() => setFilter(f.v)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
              filter === f.v
                ? "bg-foreground text-background"
                : "bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            {f.label}
            <span
              className={`tabular-nums ${
                filter === f.v ? "opacity-70" : "opacity-50"
              }`}
            >
              {f.count}
            </span>
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {groups.map(([day, items]) => (
          <div key={day}>
            <div className="text-[10px] uppercase tracking-[0.18em] font-semibold text-muted-foreground/70 mb-2.5">
              {dayLabel(day)}
            </div>
            <div className="space-y-1.5">
              {items.map((e) => (
                <EventRow
                  key={`${e.kind}-${
                    e.kind === "activity"
                      ? e.activity.id
                      : e.kind === "konversation"
                        ? e.konversation.id
                        : e.kind === "termin"
                          ? e.termin.id
                          : e.rechnung.id
                  }`}
                  event={e}
                  expanded={expanded}
                  toggle={toggle}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// Event-Row
// ─────────────────────────────────────────────────────────────────

const EventRow = ({
  event,
  expanded,
  toggle,
}: {
  event: UnifiedEvent;
  expanded: Set<string>;
  toggle: (id: string) => void;
}) => {
  const time = new Date(event.ts).toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (event.kind === "konversation") {
    return (
      <KonversationRow
        k={event.konversation}
        time={time}
        expanded={expanded.has(event.konversation.id)}
        onToggle={() => toggle(event.konversation.id)}
      />
    );
  }
  if (event.kind === "termin") {
    return <TerminRow t={event.termin} time={time} />;
  }
  if (event.kind === "rechnung") {
    return <RechnungRow r={event.rechnung} />;
  }
  return <ActivityRow a={event.activity} time={time} />;
};

const KonversationRow = ({
  k,
  time,
  expanded,
  onToggle,
}: {
  k: Konversation;
  time: string;
  expanded: boolean;
  onToggle: () => void;
}) => {
  const km = kanalMeta[k.kanal] ?? kanalMeta.email;
  const KIcon = km.icon;
  const isVoice = k.kanal === "voice";
  const expandable =
    isVoice && (k.transcript?.length || k.recording_url || k.inhalt);

  return (
    <div className="surface px-4 py-3 hover:border-foreground/15 transition-colors">
      <button
        type="button"
        onClick={expandable ? onToggle : undefined}
        className={`w-full text-left flex items-start gap-3 ${
          expandable ? "cursor-pointer" : "cursor-default"
        }`}
        aria-expanded={expanded}
      >
        <div className="h-7 w-7 rounded-md bg-muted/40 flex items-center justify-center shrink-0 mt-0.5">
          <KIcon className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground/80">
              {km.label}
            </span>
            {k.status === "escalated" && (
              <span className="status-pill status-critical text-[9px]">
                Eskaliert
              </span>
            )}
            {k.status === "automated" && k.ai_handled && (
              <span className="status-pill status-success text-[9px]">
                KI-bearbeitet
              </span>
            )}
            {k.structured_data?.urgency &&
              k.structured_data.urgency !== "low" && (
                <span
                  className="status-pill text-[9px]"
                  style={{
                    color:
                      k.structured_data.urgency === "critical"
                        ? "hsl(var(--status-critical))"
                        : "hsl(var(--status-warning))",
                    background:
                      k.structured_data.urgency === "critical"
                        ? "hsl(var(--status-critical-soft))"
                        : "hsl(var(--status-warning-soft))",
                  }}
                >
                  {k.structured_data.urgency}
                </span>
              )}
            {typeof k.cost_eur === "number" && k.cost_eur > 0 && (
              <span className="text-[10px] text-muted-foreground/70 font-mono">
                · {k.cost_eur.toFixed(2)} €
              </span>
            )}
            {k.dauer_sek != null && k.dauer_sek > 0 && (
              <span className="text-[10px] text-muted-foreground/70 font-mono">
                · {Math.floor(k.dauer_sek / 60)}:{String(k.dauer_sek % 60).padStart(2, "0")} min
              </span>
            )}
            <span className="text-[10px] text-muted-foreground/60 font-mono ml-auto shrink-0">
              {time}
            </span>
          </div>
          <p className="text-sm text-foreground leading-snug">{k.preview}</p>
          {k.structured_data?.next_step && (
            <p className="text-[11px] text-muted-foreground mt-1">
              <span className="font-semibold">Nächster Schritt: </span>
              {k.structured_data.next_step}
            </p>
          )}
        </div>
        {expandable && (
          <span className="text-muted-foreground/50 shrink-0 mt-1">
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </span>
        )}
      </button>

      {expandable && expanded && (
        <div className="mt-3 pt-3 border-t border-border/40 space-y-3 pl-10">
          {k.recording_url && (
            <VoiceRecordingPlayer
              url={k.recording_url}
              durationSec={k.dauer_sek ?? null}
            />
          )}
          {k.transcript && k.transcript.length > 0 ? (
            <div className="space-y-2 max-h-[320px] overflow-y-auto">
              {k.transcript.map((line, i) => (
                <div
                  key={i}
                  className={`flex gap-2 ${
                    line.speaker === "ai" ? "" : "flex-row-reverse"
                  }`}
                >
                  <div className="w-6 h-6 rounded bg-muted/40 flex items-center justify-center text-[9px] font-semibold shrink-0 text-muted-foreground">
                    {line.speaker === "ai" ? "KI" : "M"}
                  </div>
                  <div
                    className={`flex-1 text-xs px-3 py-2 rounded-md ${
                      line.speaker === "ai"
                        ? "bg-muted/20"
                        : "bg-muted/40"
                    }`}
                  >
                    <div className="text-[10px] text-muted-foreground font-mono mb-0.5">
                      {line.speaker === "ai" ? "Anna" : "Anrufer"} · {line.ts}
                    </div>
                    <div className="text-foreground">{line.text}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : k.inhalt ? (
            <div className="text-xs text-foreground/85 leading-relaxed whitespace-pre-line p-3 rounded-md bg-muted/20">
              {k.inhalt}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

const TerminRow = ({ t, time }: { t: Termin; time: string }) => (
  <div className="surface px-4 py-3 flex items-start gap-3">
    <div className="h-7 w-7 rounded-md bg-muted/40 flex items-center justify-center shrink-0 mt-0.5">
      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
        <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground/80">
          Termin
        </span>
        {!t.bestaetigt && (
          <span className="status-pill status-warning text-[9px]">
            unbestätigt
          </span>
        )}
        <span className="text-[10px] text-muted-foreground/60 font-mono ml-auto shrink-0">
          {time}
        </span>
      </div>
      <p className="text-sm text-foreground">{t.titel}</p>
      {t.notiz && (
        <p className="text-[11px] text-muted-foreground mt-0.5">{t.notiz}</p>
      )}
    </div>
  </div>
);

const RechnungRow = ({ r }: { r: Rechnung }) => (
  <div className="surface px-4 py-3 flex items-start gap-3">
    <div className="h-7 w-7 rounded-md bg-muted/40 flex items-center justify-center shrink-0 mt-0.5">
      <Receipt className="h-3.5 w-3.5 text-muted-foreground" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
        <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground/80">
          Rechnung
        </span>
        <span
          className={`status-pill text-[9px] ${
            r.status === "bezahlt"
              ? "status-success"
              : r.status.startsWith("mahnung") || r.status === "gerichtlich"
                ? "status-critical"
                : r.status === "ueberfaellig"
                  ? "status-warning"
                  : "status-neutral"
          }`}
        >
          {r.status}
        </span>
        <span className="text-[10px] text-muted-foreground/70 font-mono">
          · {r.rechnungsnummer}
        </span>
        <span className="ml-auto text-sm font-semibold tabular-nums text-foreground">
          {r.betrag_brutto.toLocaleString("de-DE")} €
        </span>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Fällig{" "}
        {new Date(r.faelligkeit).toLocaleDateString("de-DE", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })}
        {r.bezahlt_am
          ? ` · bezahlt ${new Date(r.bezahlt_am).toLocaleDateString("de-DE")}`
          : ""}
      </p>
    </div>
  </div>
);

const ActivityRow = ({ a, time }: { a: Activity; time: string }) => {
  const m = activityMeta[a.type];
  const Icon = m.icon;
  const Actor = actorIcon[a.actor];
  return (
    <div className="surface px-4 py-3 flex items-start gap-3">
      <div className="h-7 w-7 rounded-md bg-muted/40 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className={`h-3.5 w-3.5 ${m.tone}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground/80">
            {m.label}
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/70 font-mono">
            <Actor className="h-2.5 w-2.5" />
            {a.actor_name}
          </span>
          <span className="text-[10px] text-muted-foreground/60 font-mono ml-auto shrink-0">
            {time}
          </span>
        </div>
        <p className="text-sm text-foreground">{a.title}</p>
        {a.detail && (
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
            {a.detail}
          </p>
        )}
      </div>
    </div>
  );
};

export default MandantUnifiedTimeline;
