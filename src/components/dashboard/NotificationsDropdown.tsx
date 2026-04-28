import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  Phone,
  Mail,
  MessageCircle,
  AlertTriangle,
  CheckCircle2,
  Receipt,
  ScanLine,
  Sparkles,
  Brain,
  Calendar,
  FileText,
  type LucideIcon,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useKonversationenQuery, useMarkAllKonversationenRead } from "@/lib/queries/use-konversationen";
import { useActivitiesQuery } from "@/lib/queries/use-activities";
import { findMandant, mandantName } from "@/data/mockData";
import { toast } from "sonner";
import type { ActivityType } from "@/data/types";

const typeIcon: Record<ActivityType, LucideIcon> = {
  voice_call: Phone,
  email_in: Mail,
  email_out: Mail,
  whatsapp: MessageCircle,
  document_upload: FileText,
  document_analyzed: ScanLine,
  termin_created: Calendar,
  termin_completed: CheckCircle2,
  rechnung_sent: Receipt,
  rechnung_paid: CheckCircle2,
  mahnung_sent: Receipt,
  akte_status_change: Sparkles,
  ai_strategy_generated: Brain,
  anwalt_note: FileText,
  mandant_status_change: Sparkles,
};

const NotificationsDropdown = () => {
  const [open, setOpen] = useState(false);
  const { data: konversationen = [] } = useKonversationenQuery();
  const { data: activities = [] } = useActivitiesQuery();
  const markAllRead = useMarkAllKonversationenRead();

  const handleMarkAllRead = async () => {
    try {
      const res = await markAllRead.mutateAsync();
      toast.success(
        res.updated === 0
          ? "Keine ungelesenen Konversationen"
          : `${res.updated} Konversation${res.updated === 1 ? "" : "en"} als gelesen markiert`,
      );
    } catch (e) {
      toast.error("Konnte nicht markieren", {
        description: e instanceof Error ? e.message : String(e),
      });
    }
  };

  const eskalierte = konversationen.filter(
    (k) => k.status === "escalated" && k.ungelesen,
  );
  const ungelesen = konversationen.filter((k) => k.ungelesen).length;

  // Letzte 8 Activities, neueste zuerst
  const recentActivities = activities
    .slice()
    .sort((a, b) => b.ts.localeCompare(a.ts))
    .slice(0, 8);

  // eskalierte ist Subset von ungelesen — nur ungelesen zählen damit nicht doppelt
  const totalCount = ungelesen;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all">
          <Bell className="h-5 w-5" />
          {totalCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-accent text-accent-foreground text-[9px] font-bold rounded-full ring-2 ring-background flex items-center justify-center">
              {totalCount > 9 ? "9+" : totalCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[380px] p-0 max-h-[520px] overflow-hidden flex flex-col"
        align="end"
      >
        <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between gap-2">
          <h3 className="font-display font-bold text-sm text-foreground">
            Benachrichtigungen
          </h3>
          <div className="flex items-center gap-2">
            {totalCount > 0 && (
              <span className="text-[10px] uppercase font-bold text-muted-foreground">
                {totalCount} neu
              </span>
            )}
            {totalCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={markAllRead.isPending}
                className="text-[10px] font-medium text-accent hover:text-gold-dark disabled:opacity-50 disabled:pointer-events-none"
              >
                Alle gelesen
              </button>
            )}
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          {eskalierte.length > 0 && (
            <div className="px-4 pt-3 pb-2">
              <div className="text-[10px] uppercase tracking-wider font-bold text-amber-700 mb-2 flex items-center gap-1.5">
                <AlertTriangle className="h-3 w-3" />
                Eskaliert · braucht Sie
              </div>
              <div className="space-y-1.5">
                {eskalierte.map((k) => {
                  const md = findMandant(k.mandant_id);
                  const Icon =
                    k.kanal === "voice"
                      ? Phone
                      : k.kanal === "whatsapp"
                        ? MessageCircle
                        : Mail;
                  return (
                    <Link
                      key={k.id}
                      to="/dashboard/inbox"
                      onClick={() => setOpen(false)}
                      className="block p-2.5 rounded-xl border border-amber-500/30 bg-amber-500/[0.04] hover:bg-amber-500/[0.08] transition-colors"
                    >
                      <div className="flex items-start gap-2.5">
                        <Icon className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-foreground truncate">
                            {md ? mandantName(md) : "Unbekannt"}
                          </div>
                          <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                            {k.preview}
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {recentActivities.length > 0 && (
            <div className="px-4 pt-3 pb-3">
              <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/70 mb-2">
                Letzte Aktivität
              </div>
              <div className="space-y-1">
                {recentActivities.map((a) => {
                  const Icon = typeIcon[a.type] ?? Sparkles;
                  return (
                    <div
                      key={a.id}
                      className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-muted/30 transition-colors"
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          a.actor === "ai"
                            ? "bg-accent/15 text-accent"
                            : a.actor === "anwalt"
                              ? "bg-navy/10 text-navy"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-foreground">
                          {a.title}
                        </div>
                        {a.detail && (
                          <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                            {a.detail}
                          </p>
                        )}
                        <span className="text-[9px] text-muted-foreground/60 mt-0.5 inline-block">
                          {new Date(a.ts).toLocaleString("de-DE", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {totalCount === 0 && recentActivities.length === 0 && (
            <div className="p-12 text-center">
              <Bell className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Alles ruhig hier.</p>
            </div>
          )}
        </div>

        <div className="border-t border-border/50 p-2">
          <Link
            to="/dashboard/audit"
            onClick={() => setOpen(false)}
            className="block px-3 py-2 text-xs text-center text-accent hover:text-gold-dark font-medium rounded-lg hover:bg-accent/[0.04] transition-colors"
          >
            Audit-Log öffnen →
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationsDropdown;
