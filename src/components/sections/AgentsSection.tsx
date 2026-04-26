import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import {
  Mic,
  Inbox,
  MessageCircle,
  ScanText,
  CalendarDays,
  AlertOctagon,
  Network,
} from "lucide-react";
import { useState } from "react";

const agents = [
  {
    icon: Mic,
    name: "Voice-Receptionist",
    role: "Anrufannahme & Termin-Buchung",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    detail:
      "Beantwortet Anrufe, qualifiziert Mandanten (Erstkontakt / Bestand / Notfall), bucht Termine im Kalender, eskaliert Notfälle sofort an die Notfallnummer.",
    confidence: 0.94,
  },
  {
    icon: Inbox,
    name: "Email-Triagist",
    role: "Mail-Triage & Standard-Antworten",
    color: "text-sky-400",
    bg: "bg-sky-500/10",
    border: "border-sky-500/30",
    detail:
      "Liest jede eingehende Mail. Kategorisiert: Mandantenanfrage / Behörde / Werbung / Spam. Antwortet auf Standardfragen, eskaliert juristische Themen.",
    confidence: 0.88,
  },
  {
    icon: MessageCircle,
    name: "WhatsApp-Conversationalist",
    role: "Empathische Erstaufnahme",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    detail:
      "Spezialist für emotionale Themen — Familienrecht, Trennung, Sorgerecht. Erkennt Krisen-Signale und kann angemessen reagieren oder sofort eskalieren.",
    confidence: 0.92,
  },
  {
    icon: ScanText,
    name: "Dokumenten-Analyst",
    role: "Vertrags- und Aktenanalyse",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    detail:
      "Extrahiert Vertragsparteien, Fristen, kritische Klauseln. Risikobewertung pro Klausel. Schreibt strukturierte Zusammenfassung mit Konfidenz-Score.",
    confidence: 0.89,
  },
  {
    icon: CalendarDays,
    name: "Termin-Koordinator",
    role: "Kalender & Wiedervorlage",
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
    detail:
      "Plant konfliktfrei. Sendet Erinnerungen 24h und 1h vorher. Re-scheduling bei Mandanten-Anfrage automatisch.",
    confidence: 0.96,
  },
  {
    icon: AlertOctagon,
    name: "Mahnungs-Eskalator",
    role: "Forderungsmanagement",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    detail:
      "Generiert Mahnungen Stufe 1–3 mit korrekten juristischen Formulierungen. Übergibt Stufe 4 ans gerichtliche Mahnverfahren.",
    confidence: 0.91,
  },
];

const AgentsSection = () => {
  const { ref, isVisible } = useScrollAnimation();
  const [active, setActive] = useState(0);

  return (
    <section id="agenten" className="py-32 bg-navy-dark relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-accent/[0.05] rounded-full blur-[180px]" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/[0.05] rounded-full blur-[150px]" />
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(hsl(42 80% 55% / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(42 80% 55% / 0.3) 1px, transparent 1px)`,
          backgroundSize: "80px 80px",
        }}
      />

      <div className="container mx-auto px-6 relative" ref={ref}>
        <div
          className={`text-center mb-16 transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-accent mb-4">
            <Network className="h-3 w-3" />
            Master-Orchestrator
            <Network className="h-3 w-3" />
          </span>
          <h2 className="text-4xl md:text-6xl font-display font-black text-primary-foreground mt-3 mb-5 tracking-[-0.03em]">
            Sechs KI-Agenten,{" "}
            <span className="text-gradient-gold">orchestriert</span>.
          </h2>
          <p className="text-primary-foreground/40 max-w-2xl mx-auto text-lg font-light">
            Jeder Agent ist Spezialist. Ein Master-Orchestrator entscheidet, wer
            wann übernimmt — und wann eskaliert wird. Built on Claude Sonnet
            4.7.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1fr_1.4fr] gap-8 items-start">
          <div className="space-y-3">
            {agents.map((a, i) => (
              <button
                key={a.name}
                onClick={() => setActive(i)}
                className={`w-full text-left p-5 rounded-2xl border transition-all duration-500 ${
                  active === i
                    ? `glass-dark ${a.border} shadow-2xl`
                    : "border-white/[0.06] hover:border-white/15 bg-white/[0.02]"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-11 h-11 rounded-xl ${a.bg} flex items-center justify-center shrink-0`}
                  >
                    <a.icon className={`h-5 w-5 ${a.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-display font-bold text-primary-foreground">
                      {a.name}
                    </div>
                    <div className="text-xs text-primary-foreground/40 truncate">
                      {a.role}
                    </div>
                  </div>
                  {active === i && (
                    <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="glass-dark p-8 lg:p-10 sticky top-24">
            {(() => {
              const a = agents[active];
              const Icon = a.icon;
              return (
                <>
                  <div className="flex items-start gap-5 mb-6">
                    <div
                      className={`w-16 h-16 rounded-2xl ${a.bg} flex items-center justify-center shrink-0`}
                    >
                      <Icon className={`h-7 w-7 ${a.color}`} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-display font-bold text-primary-foreground mb-1">
                        {a.name}
                      </h3>
                      <p className={`text-sm ${a.color}`}>{a.role}</p>
                    </div>
                  </div>

                  <p className="text-primary-foreground/60 leading-relaxed mb-8">
                    {a.detail}
                  </p>

                  <div className="grid sm:grid-cols-2 gap-3 mb-6">
                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <div className="text-[10px] uppercase tracking-wider text-primary-foreground/40 mb-1">
                        Modell
                      </div>
                      <div className="font-mono text-sm text-primary-foreground/90">
                        claude-sonnet-4-7
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <div className="text-[10px] uppercase tracking-wider text-primary-foreground/40 mb-1">
                        Confidence-Threshold
                      </div>
                      <div className="font-mono text-sm text-primary-foreground/90">
                        {(a.confidence * 100).toFixed(0)}% · Auto-Eskalation darunter
                      </div>
                    </div>
                  </div>

                  <div className="p-5 rounded-xl bg-accent/[0.04] border border-accent/[0.15]">
                    <div className="text-[10px] uppercase tracking-wider text-accent mb-2 font-semibold">
                      Anti-Halluzinations-Stack
                    </div>
                    <ul className="space-y-1.5 text-sm text-primary-foreground/60">
                      <li>· Constitutional Constraints im System-Prompt</li>
                      <li>· Tool-Use bei Faktenfragen statt Generierung</li>
                      <li>· Confidence-Threshold + Auto-Eskalation</li>
                      <li>· Audit-Log jeder Entscheidung (DSGVO)</li>
                    </ul>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AgentsSection;
