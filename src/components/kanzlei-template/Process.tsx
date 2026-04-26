import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { Phone, FileSearch, Handshake, Trophy, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const steps = [
  {
    icon: Phone,
    step: "01",
    title: "Kostenlose Erstberatung",
    description: "In einem unverbindlichen Gespräch analysieren wir Ihre Situation und zeigen Ihnen Ihre Optionen auf.",
    highlight: "Kostenlos & unverbindlich",
  },
  {
    icon: FileSearch,
    step: "02",
    title: "Fallanalyse & Strategie",
    description: "Unsere Experten prüfen Ihren Fall im Detail und entwickeln eine maßgeschneiderte Strategie.",
    highlight: "Innerhalb von 48h",
  },
  {
    icon: Handshake,
    step: "03",
    title: "Aktive Vertretung",
    description: "Wir setzen Ihre Rechte konsequent durch – außergerichtlich oder vor Gericht.",
    highlight: "Laufende Updates via Portal",
  },
  {
    icon: Trophy,
    step: "04",
    title: "Erfolgreicher Abschluss",
    description: "97% Erfolgsquote: Wir kämpfen bis zum bestmöglichen Ergebnis für Sie.",
    highlight: "97% Erfolgsquote",
  },
];

const ProcessSection = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section className="py-32 bg-background relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent" />

      <div className="container mx-auto px-6" ref={ref}>
        <div className={`text-center mb-20 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-accent mb-4">
            <span className="w-8 h-px bg-accent/50" />
            Unser Prozess
            <span className="w-8 h-px bg-accent/50" />
          </span>
          <h2 className="text-4xl md:text-6xl font-display font-black text-foreground mt-3 mb-5 tracking-[-0.03em]">
            In 4 Schritten zum <span className="text-gradient-gold">Erfolg</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg font-light">
            Transparent, effizient und auf Ihr Ziel ausgerichtet.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-6 relative">
          {/* Connecting line */}
          <div className={`hidden md:block absolute top-16 left-[12.5%] right-[12.5%] h-px transition-all duration-1500 ${isVisible ? "bg-gradient-to-r from-accent/0 via-accent/20 to-accent/0 scale-x-100" : "scale-x-0"}`} style={{ transitionDelay: "400ms" }} />

          {steps.map((s, i) => (
            <div
              key={s.step}
              className={`relative text-center group transition-all duration-700 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
              style={{ transitionDelay: `${300 + i * 200}ms` }}
            >
              <div className="relative mx-auto w-32 h-32 rounded-3xl bg-card border border-border/50 flex items-center justify-center mb-8 group-hover:border-accent/30 group-hover:shadow-xl group-hover:shadow-accent/[0.08] transition-all duration-500">
                <s.icon className="h-8 w-8 text-accent transition-all duration-500 group-hover:scale-110" />
                <span className="absolute -top-3 -right-3 w-8 h-8 rounded-xl bg-accent text-accent-foreground text-xs font-bold flex items-center justify-center shadow-lg shadow-accent/30">
                  {s.step}
                </span>
              </div>
              <h3 className="text-base font-display font-bold text-foreground mb-2 group-hover:text-accent transition-colors">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-[250px] mx-auto mb-3">{s.description}</p>
              <span className="inline-block text-[10px] text-accent font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-accent/5 border border-accent/10">{s.highlight}</span>
            </div>
          ))}
        </div>

        {/* CTA below process */}
        <div className={`text-center mt-20 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`} style={{ transitionDelay: "1200ms" }}>
          <a href="#kontakt">
            <Button variant="gold" className="rounded-2xl group" size="lg">
              Jetzt Schritt 1 starten – kostenlos
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
};

export default ProcessSection;
