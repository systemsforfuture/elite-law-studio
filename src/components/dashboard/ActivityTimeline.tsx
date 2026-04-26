import {
  Phone,
  Mail,
  MessageCircle,
  FileText,
  ScanLine,
  Calendar,
  CheckCircle2,
  Receipt,
  CreditCard,
  AlertOctagon,
  Brain,
  StickyNote,
  RefreshCw,
  ArrowRight,
  Bot,
  User,
  Cog,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { Activity, ActivityType } from "@/data/types";
import { useMemo, useState } from "react";

const meta: Record<
  ActivityType,
  { icon: typeof Phone; cls: string; bg: string }
> = {
  voice_call: {
    icon: Phone,
    cls: "text-emerald-600",
    bg: "bg-emerald-500/10",
  },
  email_in: { icon: Mail, cls: "text-sky-600", bg: "bg-sky-500/10" },
  email_out: { icon: Mail, cls: "text-sky-700", bg: "bg-sky-500/15" },
  whatsapp: {
    icon: MessageCircle,
    cls: "text-green-600",
    bg: "bg-green-500/10",
  },
  document_upload: {
    icon: FileText,
    cls: "text-rose-600",
    bg: "bg-rose-500/10",
  },
  document_analyzed: {
    icon: ScanLine,
    cls: "text-purple-600",
    bg: "bg-purple-500/10",
  },
  termin_created: {
    icon: Calendar,
    cls: "text-amber-600",
    bg: "bg-amber-500/10",
  },
  termin_completed: {
    icon: CheckCircle2,
    cls: "text-emerald-700",
    bg: "bg-emerald-500/15",
  },
  rechnung_sent: {
    icon: Receipt,
    cls: "text-sky-700",
    bg: "bg-sky-500/15",
  },
  rechnung_paid: {
    icon: CreditCard,
    cls: "text-emerald-700",
    bg: "bg-emerald-500/15",
  },
  mahnung_sent: {
    icon: AlertOctagon,
    cls: "text-orange-600",
    bg: "bg-orange-500/10",
  },
  akte_status_change: {
    icon: RefreshCw,
    cls: "text-foreground",
    bg: "bg-muted",
  },
  ai_strategy_generated: {
    icon: Brain,
    cls: "text-accent",
    bg: "bg-accent/15",
  },
  anwalt_note: {
    icon: StickyNote,
    cls: "text-amber-700",
    bg: "bg-amber-500/15",
  },
  mandant_status_change: {
    icon: Cog,
    cls: "text-muted-foreground",
    bg: "bg-muted",
  },
};

const actorIcon = {
  ai: Bot,
  anwalt: User,
  mandant: User,
  system: Cog,
} as const;

interface Props {
  activities: Activity[];
  emptyText?: string;
}

const ActivityTimeline = ({ activities, emptyText }: Props) => {
  const [filter, setFilter] = useState<"all" | "ai" | "anwalt" | "mandant">(
    "all",
  );

  const filtered = useMemo(
    () => activities.filter((a) => filter === "all" || a.actor === filter),
    [activities, filter],
  );

  const groups = useMemo(() => {
    const map = new Map<string, Activity[]>();
    for (const a of filtered) {
      const day = a.ts.slice(0, 10);
      const arr = map.get(day) ?? [];
      arr.push(a);
      map.set(day, arr);
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  if (activities.length === 0) {
    return (
      <div className="glass-card p-12 border-border/50 text-center">
        <p className="text-sm text-muted-foreground">
          {emptyText ?? "Noch keine Aktivität."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 flex-wrap">
        {(
          [
            { v: "all" as const, label: "Alle" },
            { v: "ai" as const, label: "KI" },
            { v: "anwalt" as const, label: "Anwalt" },
            { v: "mandant" as const, label: "Mandant" },
          ]
        ).map((f) => (
          <button
            key={f.v}
            onClick={() => setFilter(f.v)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === f.v
                ? "bg-navy text-primary-foreground"
                : "bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {f.label}
          </button>
        ))}
        <span className="text-xs text-muted-foreground ml-auto">
          {filtered.length} Events
        </span>
      </div>

      <div className="space-y-6">
        {groups.map(([day, items]) => {
          const d = new Date(day);
          const today = new Date().toISOString().slice(0, 10);
          const yesterday = new Date(Date.now() - 86400000)
            .toISOString()
            .slice(0, 10);
          const label =
            day === today
              ? "Heute"
              : day === yesterday
              ? "Gestern"
              : d.toLocaleDateString("de-DE", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                });
          return (
            <div key={day}>
              <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground/70 mb-3 px-2">
                {label}
              </div>
              <div className="space-y-2">
                {items.map((a) => {
                  const m = meta[a.type];
                  const Icon = m.icon;
                  const ActorIcon = actorIcon[a.actor];
                  return (
                    <div
                      key={a.id}
                      className="flex gap-4 p-4 rounded-xl border border-border/50 bg-card/40 hover:bg-card/70 transition-colors"
                    >
                      <div
                        className={`w-10 h-10 rounded-xl ${m.bg} flex items-center justify-center shrink-0`}
                      >
                        <Icon className={`h-4 w-4 ${m.cls}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-foreground">
                            {a.title}
                          </span>
                          <span className="text-[10px] text-muted-foreground/70 inline-flex items-center gap-1 font-mono">
                            <ActorIcon className="h-2.5 w-2.5" />
                            {a.actor_name}
                          </span>
                        </div>
                        {a.detail && (
                          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                            {a.detail}
                          </p>
                        )}
                        {a.link_to && (
                          <Link
                            to={`/dashboard/${a.link_to.module}`}
                            className="inline-flex items-center gap-1 text-xs text-accent hover:text-gold-dark mt-2"
                          >
                            Details öffnen
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        )}
                      </div>
                      <div className="text-[10px] text-muted-foreground shrink-0 font-mono">
                        {new Date(a.ts).toLocaleTimeString("de-DE", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ActivityTimeline;
