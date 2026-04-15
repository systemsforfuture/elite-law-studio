import { useState } from "react";
import { FolderOpen, ChevronRight, CheckCircle, Clock, Circle, AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Case {
  id: string;
  title: string;
  aktenzeichen: string;
  status: "active" | "pending" | "closed";
  type: string;
  lawyer: string;
  lastUpdate: string;
  description: string;
  steps: { label: string; status: "done" | "current" | "pending" }[];
  documents: { name: string; date: string }[];
  nextAppointment?: string;
}

const casesData: Case[] = [
  {
    id: "1",
    title: "Scheidungsverfahren Müller vs. Müller",
    aktenzeichen: "1234/23",
    status: "active",
    type: "Familienrecht",
    lawyer: "RA Max Bergmann",
    lastUpdate: "11. Apr 2026",
    description: "Einvernehmliches Scheidungsverfahren mit Regelung des Unterhalts und Vermögensaufteilung.",
    steps: [
      { label: "Fallaufnahme", status: "done" },
      { label: "Strategie & Vorbereitung", status: "current" },
      { label: "Verhandlung / Verfahren", status: "pending" },
      { label: "Abschluss & Erfolg", status: "pending" },
    ],
    documents: [
      { name: "Heiratsurkunde.pdf", date: "05. Mär 2026" },
      { name: "Vermögensaufstellung.pdf", date: "12. Mär 2026" },
      { name: "Unterhaltsberechnung.xlsx", date: "28. Mär 2026" },
    ],
    nextAppointment: "20. Apr 2026, 10:00 Uhr",
  },
  {
    id: "2",
    title: "Arbeitsrechtliche Kündigung Weber",
    aktenzeichen: "5678/23",
    status: "pending",
    type: "Arbeitsrecht",
    lawyer: "RA Sarah Fischer",
    lastUpdate: "08. Apr 2026",
    description: "Kündigungsschutzklage gegen fristlose Kündigung durch den Arbeitgeber.",
    steps: [
      { label: "Fallaufnahme", status: "done" },
      { label: "Klageschrift", status: "done" },
      { label: "Güteverhandlung", status: "current" },
      { label: "Urteil / Vergleich", status: "pending" },
    ],
    documents: [
      { name: "Kündigungsschreiben.pdf", date: "01. Feb 2026" },
      { name: "Arbeitsvertrag.pdf", date: "01. Feb 2026" },
    ],
    nextAppointment: "25. Apr 2026, 14:00 Uhr",
  },
  {
    id: "3",
    title: "Mietrechtsstreit Schmidt",
    aktenzeichen: "9012/22",
    status: "closed",
    type: "Mietrecht",
    lawyer: "RA Max Bergmann",
    lastUpdate: "15. Jan 2026",
    description: "Streit über Mietminderung wegen Schimmelbefall – erfolgreich beigelegt.",
    steps: [
      { label: "Fallaufnahme", status: "done" },
      { label: "Gutachten", status: "done" },
      { label: "Vergleichsverhandlung", status: "done" },
      { label: "Abschluss", status: "done" },
    ],
    documents: [
      { name: "Gutachten_Schimmel.pdf", date: "20. Nov 2025" },
      { name: "Vergleichsvereinbarung.pdf", date: "15. Jan 2026" },
    ],
  },
];

const statusConfig = {
  active: { label: "Aktiv", color: "bg-emerald-500/15 text-emerald-600", icon: Clock },
  pending: { label: "Wartend", color: "bg-amber-500/15 text-amber-600", icon: AlertCircle },
  closed: { label: "Abgeschlossen", color: "bg-muted text-muted-foreground", icon: CheckCircle },
};

const CasesView = () => {
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);

  if (selectedCase) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelectedCase(null)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück zur Übersicht
        </button>

        <div className="glass-card p-8 border-border/50">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-xl font-display font-bold text-foreground">{selectedCase.title}</h2>
              <p className="text-sm text-muted-foreground mt-1">Aktenzeichen {selectedCase.aktenzeichen} · {selectedCase.type}</p>
            </div>
            <span className={`px-3 py-1.5 rounded-lg text-xs font-medium ${statusConfig[selectedCase.status].color}`}>
              {statusConfig[selectedCase.status].label}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mb-6">{selectedCase.description}</p>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div className="glass-card p-4 border-border/50">
              <span className="text-muted-foreground">Zuständiger Anwalt</span>
              <p className="font-semibold text-foreground mt-1">{selectedCase.lawyer}</p>
            </div>
            <div className="glass-card p-4 border-border/50">
              <span className="text-muted-foreground">Letztes Update</span>
              <p className="font-semibold text-foreground mt-1">{selectedCase.lastUpdate}</p>
            </div>
            {selectedCase.nextAppointment && (
              <div className="glass-card p-4 border-border/50 sm:col-span-2">
                <span className="text-muted-foreground">Nächster Termin</span>
                <p className="font-semibold text-accent mt-1">{selectedCase.nextAppointment}</p>
              </div>
            )}
          </div>
        </div>

        {/* Progress */}
        <div className="glass-card p-8 border-border/50">
          <h3 className="text-lg font-display font-bold text-foreground mb-6">Fortschritt</h3>
          <div className="flex items-center justify-between">
            {selectedCase.steps.map((step, i) => (
              <div key={step.label} className="flex items-center flex-1">
                <div className="flex flex-col items-center text-center flex-1">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-2 transition-all ${
                    step.status === "done" ? "bg-navy text-primary-foreground" : step.status === "current" ? "bg-accent/15 text-accent ring-4 ring-accent/10" : "bg-muted text-muted-foreground"
                  }`}>
                    {step.status === "done" ? <CheckCircle className="h-4 w-4" /> : step.status === "current" ? <Clock className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                  </div>
                  <span className="text-xs font-medium text-foreground">{step.label}</span>
                </div>
                {i < selectedCase.steps.length - 1 && (
                  <div className={`h-px flex-1 mx-2 -mt-5 ${step.status === "done" ? "bg-navy" : "bg-border"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Documents */}
        <div className="glass-card p-8 border-border/50">
          <h3 className="text-lg font-display font-bold text-foreground mb-4">Dokumente</h3>
          <div className="space-y-2">
            {selectedCase.documents.map((doc) => (
              <div key={doc.name} className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <FolderOpen className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">{doc.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">{doc.date}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-display font-bold text-foreground mb-1">Meine Fälle</h2>
        <p className="text-sm text-muted-foreground">Alle Ihre Rechtsfälle auf einen Blick</p>
      </div>

      <div className="flex gap-2">
        {(["all", "active", "pending", "closed"] as const).map((filter) => (
          <button
            key={filter}
            className="px-4 py-2 rounded-xl text-xs font-medium bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-all first:bg-navy first:text-primary-foreground"
          >
            {filter === "all" ? "Alle" : statusConfig[filter].label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {casesData.map((c) => {
          const StatusIcon = statusConfig[c.status].icon;
          return (
            <div
              key={c.id}
              className="glass-card p-6 border-border/50 hover:border-accent/20 transition-all duration-300 cursor-pointer group"
              onClick={() => setSelectedCase(c)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-navy/10 flex items-center justify-center">
                    <FolderOpen className="h-5 w-5 text-navy" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{c.title}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {c.aktenzeichen} · {c.type} · {c.lawyer}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1.5 rounded-lg text-xs font-medium ${statusConfig[c.status].color}`}>
                    <StatusIcon className="h-3 w-3 inline mr-1" />
                    {statusConfig[c.status].label}
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

export default CasesView;
