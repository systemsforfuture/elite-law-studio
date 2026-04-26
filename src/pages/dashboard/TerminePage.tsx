import { useMemo, useState } from "react";
import {
  Calendar as CalIcon,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  User,
  Sparkles,
  Bell,
} from "lucide-react";
import { findMandant, findUser, mandantName } from "@/data/mockData";
import type { TerminTyp } from "@/data/types";
import { useTermineQuery } from "@/lib/queries/use-termine";
import { useAktenQuery } from "@/lib/queries/use-akten";
import { useTenant } from "@/contexts/TenantContext";
import { Button } from "@/components/ui/button";

const typLabel: Record<TerminTyp, string> = {
  erstgespraech: "Erstgespräch",
  gerichtstermin: "Gerichtstermin",
  wiedervorlage: "Wiedervorlage",
  intern: "Intern",
  telefon: "Telefon",
};
const typColor: Record<TerminTyp, string> = {
  erstgespraech: "bg-emerald-500/15 text-emerald-700",
  gerichtstermin: "bg-rose-500/15 text-rose-700",
  wiedervorlage: "bg-amber-500/15 text-amber-700",
  intern: "bg-sky-500/15 text-sky-700",
  telefon: "bg-purple-500/15 text-purple-700",
};

const TerminePage = () => {
  const [refMonth, setRefMonth] = useState(new Date(2026, 4, 1));
  const { data: termine = [] } = useTermineQuery();
  const { data: akten = [] } = useAktenQuery();
  const { tenant } = useTenant();

  const monthStart = new Date(refMonth.getFullYear(), refMonth.getMonth(), 1);
  const monthEnd = new Date(refMonth.getFullYear(), refMonth.getMonth() + 1, 0);
  const startWeekday = (monthStart.getDay() + 6) % 7;
  const daysInMonth = monthEnd.getDate();
  const cells = useMemo(() => {
    const arr: { date: Date | null }[] = [];
    for (let i = 0; i < startWeekday; i++) arr.push({ date: null });
    for (let i = 1; i <= daysInMonth; i++) {
      arr.push({
        date: new Date(refMonth.getFullYear(), refMonth.getMonth(), i),
      });
    }
    return arr;
  }, [refMonth, startWeekday, daysInMonth]);

  const upcomingFristen = akten.flatMap((a) =>
    a.fristen.map((f) => ({ ...f, akte: a })),
  );

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-4 gap-4">
        <Stat label="Termine diese Woche" value="8" sub="3 KI-gebucht" />
        <Stat label="No-Show-Rate" value="4%" sub="−80% durch Reminder" accent="emerald" />
        <Stat label="Offene Wiedervorlagen" value="11" sub="3 fällig heute" accent="amber" />
        <Stat label="Frist-Eskalationen" value="2" sub="Diese Woche" accent="rose" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="glass-card p-6 border-border/50 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display font-bold text-foreground">
              {refMonth.toLocaleDateString("de-DE", {
                month: "long",
                year: "numeric",
              })}
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setRefMonth(
                    new Date(refMonth.getFullYear(), refMonth.getMonth() - 1, 1),
                  )
                }
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setRefMonth(new Date(2026, 4, 1))}
                className="text-xs px-3 py-1.5 rounded-lg hover:bg-muted transition-colors"
              >
                Heute
              </button>
              <button
                onClick={() =>
                  setRefMonth(
                    new Date(refMonth.getFullYear(), refMonth.getMonth() + 1, 1),
                  )
                }
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <Button variant="gold" size="sm" className="rounded-xl ml-2">
                <Plus className="mr-2 h-3.5 w-3.5" />
                Neu
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((d) => (
              <div
                key={d}
                className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/70 py-2"
              >
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((c, i) => {
              if (!c.date) {
                return <div key={i} className="aspect-square" />;
              }
              const dateStr = c.date.toISOString().slice(0, 10);
              const dayTermine = termine.filter((t) =>
                t.start_at.startsWith(dateStr),
              );
              const isToday = dateStr === "2026-04-26";
              return (
                <div
                  key={i}
                  className={`aspect-square p-1.5 rounded-lg text-xs flex flex-col gap-1 transition-colors ${
                    isToday
                      ? "bg-accent/10 border border-accent/30"
                      : "border border-border/30 bg-muted/10 hover:bg-muted/30"
                  }`}
                >
                  <span
                    className={`font-semibold tabular-nums ${
                      isToday ? "text-accent" : "text-foreground"
                    }`}
                  >
                    {c.date.getDate()}
                  </span>
                  <div className="flex flex-col gap-0.5 flex-1 overflow-hidden">
                    {dayTermine.slice(0, 2).map((t) => (
                      <div
                        key={t.id}
                        className={`text-[9px] px-1 py-0.5 rounded truncate ${typColor[t.typ]}`}
                      >
                        {t.titel}
                      </div>
                    ))}
                    {dayTermine.length > 2 && (
                      <div className="text-[9px] text-muted-foreground">
                        +{dayTermine.length - 2}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-5 border-border/50">
            <h3 className="text-sm font-display font-bold text-foreground mb-4 flex items-center gap-2">
              <CalIcon className="h-4 w-4 text-accent" />
              Anstehend
            </h3>
            <div className="space-y-3">
              {termine
                .slice()
                .sort((a, b) => a.start_at.localeCompare(b.start_at))
                .slice(0, 5)
                .map((t) => {
                  const md = findMandant(t.mandant_id);
                  const u = findUser(t.anwalt_id);
                  return (
                    <div
                      key={t.id}
                      className="p-3 rounded-xl border border-border/50 bg-muted/20"
                    >
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${typColor[t.typ]}`}
                        >
                          {typLabel[t.typ]}
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-foreground">
                        {t.titel}
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-1.5 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(t.start_at).toLocaleString("de-DE", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {u && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {u.name}
                          </span>
                        )}
                        {t.ort && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {t.ort}
                          </span>
                        )}
                      </div>
                      {md && (
                        <div className="text-[10px] text-muted-foreground mt-1">
                          {mandantName(md)}
                        </div>
                      )}
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          const { downloadIcs } = await import(
                            "@/lib/generate-ics"
                          );
                          downloadIcs({
                            termin: t,
                            anwalt: u,
                            mandant: md,
                            kanzlei_name: tenant.kanzlei_name,
                          });
                        }}
                        className="text-[10px] text-accent hover:text-gold-dark mt-2 flex items-center gap-1"
                      >
                        <CalendarPlus className="h-3 w-3" /> .ics herunterladen
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>

          <div className="glass-card p-5 border-amber-500/30 bg-amber-500/[0.03]">
            <h3 className="text-sm font-display font-bold text-foreground mb-3 flex items-center gap-2">
              <Bell className="h-4 w-4 text-amber-600" />
              Fristen-Wiedervorlage
            </h3>
            <div className="space-y-2">
              {upcomingFristen.slice(0, 4).map((f, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-lg border border-amber-500/15 bg-background/40"
                >
                  <div className="text-xs font-semibold text-foreground">
                    {f.titel}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5 flex justify-between">
                    <span>{f.akte.aktenzeichen}</span>
                    <span
                      className={`tabular-nums font-bold ${f.kritisch ? "text-amber-700" : "text-foreground"}`}
                    >
                      {new Date(f.datum).toLocaleDateString("de-DE")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-5 border-accent/20 bg-accent/[0.03]">
            <h3 className="text-sm font-display font-bold text-foreground mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" />
              KI-Termin-Koordinator
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              Letzte 24h: 31 Termine konfliktfrei gebucht, 0 Fehler.
            </p>
            <div className="text-[10px] text-muted-foreground">
              Erinnerungen 24h und 1h vorher · Re-Scheduling automatisch
            </div>
          </div>
        </div>
      </div>
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
  accent?: "emerald" | "amber" | "rose";
}) => {
  const cls =
    accent === "emerald"
      ? "text-emerald-600"
      : accent === "amber"
      ? "text-amber-600"
      : accent === "rose"
      ? "text-rose-600"
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

export default TerminePage;
