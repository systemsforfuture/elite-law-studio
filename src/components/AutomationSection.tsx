import { useScrollAnimation, useCountUp } from "@/hooks/use-scroll-animation";
import { Zap, Clock, Users, FileCheck, MessageSquare, Calendar, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  { icon: FileCheck, title: "Digitale Aktenführung", desc: "Alle Mandantenakten zentral, durchsuchbar und DSGVO-konform – kein Papierchaos mehr." },
  { icon: MessageSquare, title: "Sichere Kommunikation", desc: "Ende-zu-Ende-verschlüsselter Chat mit Mandanten. Nachrichten, Dokumente, Updates an einem Ort." },
  { icon: Calendar, title: "Termin-Automatisierung", desc: "Mandanten buchen verfügbare Slots selbst. Automatische Erinnerungen reduzieren No-Shows um 80%." },
  { icon: Users, title: "Mandanten-Self-Service", desc: "Statusabfragen, Dokumentenabruf, Rechnungen – Mandanten erledigen Routineanfragen selbst." },
];

const AutomationSection = () => {
  const { ref, isVisible } = useScrollAnimation();
  const hours = useCountUp(15, 2000, isVisible);
  const efficiency = useCountUp(40, 2000, isVisible);

  return (
    <section id="mandanten" className="py-32 bg-card relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/[0.04] rounded-full blur-[150px]" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-navy/[0.03] rounded-full blur-[120px]" />

      <div className="container mx-auto px-6 relative" ref={ref}>
        <div className={`text-center mb-16 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-accent mb-4">
            <Sparkles className="h-3 w-3" />
            Mehr Mandanten · Weniger Aufwand
            <Sparkles className="h-3 w-3" />
          </span>
          <h2 className="text-4xl md:text-6xl font-display font-black text-foreground mt-3 mb-5 tracking-[-0.03em]">
            Ihre Kanzlei, <span className="text-gradient-gold">automatisiert</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg font-light">
            Konzentrieren Sie sich auf Mandate – nicht auf Verwaltung. Unser Mandanten-Portal automatisiert Routine-Aufgaben und schafft Zeit für das Wesentliche.
          </p>
        </div>

        {/* Stat highlight */}
        <div className={`grid sm:grid-cols-2 gap-5 max-w-3xl mx-auto mb-16 transition-all duration-700 delay-200 ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
          <div className="glass-card p-8 text-center border-accent/10">
            <Clock className="h-6 w-6 text-accent mx-auto mb-3" />
            <div className="text-5xl font-display font-black text-gradient-gold tabular-nums">{hours}h</div>
            <div className="text-xs text-muted-foreground mt-2 uppercase tracking-wider">eingesparte Verwaltung pro Woche</div>
          </div>
          <div className="glass-card p-8 text-center border-accent/10">
            <Zap className="h-6 w-6 text-accent mx-auto mb-3" />
            <div className="text-5xl font-display font-black text-gradient-gold tabular-nums">+{efficiency}%</div>
            <div className="text-xs text-muted-foreground mt-2 uppercase tracking-wider">mehr Mandate bei gleichem Team</div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-5 mb-16">
          {features.map((f, i) => (
            <div
              key={f.title}
              className={`group p-8 rounded-2xl border border-border/50 bg-background/50 backdrop-blur-sm hover:border-accent/30 hover:shadow-2xl hover:shadow-accent/[0.05] transition-all duration-700 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
              style={{ transitionDelay: `${400 + i * 100}ms` }}
            >
              <div className="flex items-start gap-5">
                <div className="w-12 h-12 rounded-2xl bg-accent/[0.08] flex items-center justify-center shrink-0 group-hover:bg-accent/15 group-hover:scale-110 transition-all duration-500">
                  <f.icon className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h3 className="text-base font-display font-bold text-foreground mb-2 group-hover:text-accent transition-colors duration-300">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={`text-center transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`} style={{ transitionDelay: "900ms" }}>
          <a href="/login">
            <Button variant="gold" className="rounded-2xl group" size="lg">
              Portal-Demo ansehen
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </a>
          <p className="text-xs text-muted-foreground mt-5">
            Bereits über 500 Kanzleien nutzen unsere Lösung
          </p>
        </div>
      </div>
    </section>
  );
};

export default AutomationSection;
