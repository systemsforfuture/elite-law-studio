import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { Phone, FileSearch, Handshake, Trophy } from "lucide-react";

const steps = [
  {
    icon: Phone,
    step: "01",
    title: "Kostenlose Erstberatung",
    description: "In einem unverbindlichen Gespräch analysieren wir Ihre Situation und zeigen Ihnen Ihre Optionen auf.",
  },
  {
    icon: FileSearch,
    step: "02",
    title: "Fallanalyse & Strategie",
    description: "Unsere Experten prüfen Ihren Fall im Detail und entwickeln eine maßgeschneiderte Strategie.",
  },
  {
    icon: Handshake,
    step: "03",
    title: "Aktive Vertretung",
    description: "Wir setzen Ihre Rechte konsequent durch – außergerichtlich oder vor Gericht.",
  },
  {
    icon: Trophy,
    step: "04",
    title: "Erfolgreicher Abschluss",
    description: "97% Erfolgsquote: Wir kämpfen bis zum bestmöglichen Ergebnis für Sie.",
  },
];

const ProcessSection = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section className="py-32 bg-background relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
      <div className="absolute bottom-1/3 right-0 w-[400px] h-[400px] bg-accent/[0.02] rounded-full blur-[120px]" />

      <div className="container mx-auto px-6" ref={ref}>
        <div className="text-center mb-20">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-accent mb-4">
            <span className="w-8 h-px bg-accent/50" />
            Unser Prozess
            <span className="w-8 h-px bg-accent/50" />
          </span>
          <h2 className="text-4xl md:text-6xl font-serif font-bold text-foreground mt-3 mb-5">
            In 4 Schritten zum <span className="text-gradient-gold">Erfolg</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg font-light">
            Transparent, effizient und auf Ihr Ziel ausgerichtet.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-8 relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-16 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-accent/0 via-accent/20 to-accent/0" />

          {steps.map((s, i) => (
            <div
              key={s.step}
              className={`relative text-center group ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${i * 200}ms`, transitionDuration: "800ms", transitionProperty: "all" }}
            >
              <div className="relative mx-auto w-32 h-32 rounded-3xl bg-card border border-border/50 flex items-center justify-center mb-8 group-hover:border-accent/30 group-hover:shadow-xl group-hover:shadow-accent/[0.08] transition-all duration-500">
                <s.icon className="h-8 w-8 text-accent transition-transform duration-500 group-hover:scale-110" />
                <span className="absolute -top-3 -right-3 w-8 h-8 rounded-xl bg-accent text-accent-foreground text-xs font-bold flex items-center justify-center shadow-lg shadow-accent/30">
                  {s.step}
                </span>
              </div>
              <h3 className="text-lg font-serif font-semibold text-foreground mb-3 group-hover:text-accent transition-colors">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-[250px] mx-auto">{s.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProcessSection;
