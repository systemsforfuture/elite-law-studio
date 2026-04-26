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
} from "lucide-react";
import { akten, findMandant, findUser, mandantName } from "@/data/mockData";
import type { Akte, AktenStufe } from "@/data/types";
import { Button } from "@/components/ui/button";

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

const AktenPage = () => {
  const [selected, setSelected] = useState<Akte | null>(null);

  if (selected) {
    const md = findMandant(selected.mandant_id);
    const anwalt = findUser(selected.zugewiesener_anwalt_id);
    const stufeIdx = stufenSeq.indexOf(selected.stufe);

    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelected(null)}
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
          <p className="text-sm text-foreground/80 mt-4">
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
                      className={`h-px flex-1 mx-3 -mt-7 ${
                        done ? "bg-navy" : "bg-border"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

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
                      {f.kritisch ? "Kritisch" : "Standard"}
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
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-4 gap-4">
        <Stat label="Aktive Akten" value={String(akten.filter((a) => a.status === "in_bearbeitung").length)} sub="In Bearbeitung" />
        <Stat label="Offene Fristen" value="6" sub="2 kritisch" accent="amber" />
        <Stat label="Streitwert gesamt" value="266k€" sub="Aktive Akten" />
        <Stat label="Ø Bearbeitungszeit" value="14 Tage" sub="Pro Stufe" />
      </div>

      <div className="space-y-3">
        {akten.map((a) => {
          const md = findMandant(a.mandant_id);
          const anwalt = findUser(a.zugewiesener_anwalt_id);
          const kritisch = a.fristen.some((f) => f.kritisch);
          return (
            <div
              key={a.id}
              onClick={() => setSelected(a)}
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
  accent?: "amber";
}) => (
  <div className="glass-card p-5 border-border/50">
    <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
      {label}
    </div>
    <div
      className={`text-3xl font-display font-black tabular-nums ${
        accent === "amber" ? "text-amber-600" : "text-foreground"
      }`}
    >
      {value}
    </div>
    <div className="text-xs text-muted-foreground mt-1">{sub}</div>
  </div>
);

export default AktenPage;
