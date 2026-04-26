import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { X, Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const without = [
  "30–40% aller Erstanrufer in der Mailbox",
  "Standard-Mails kosten 90 Min/Tag manuell",
  "Fristen in Excel und Outlook = Haftungsrisiko",
  "Mahnwesen wird liegen gelassen — 12k€ pro Jahr abgeschrieben",
  "Mandanten warten Tage auf Termin-Bestätigung",
  "Keine Sicht auf KPIs und Pipeline",
];

const with_lawyer = [
  "Voice-Agent fängt 100% der Anrufe ab — auch nachts",
  "KI-Triagist beantwortet Standard-Mails in Sekunden",
  "Fristenkontrolle automatisch, mit Eskalations-Logik",
  "Mahnwesen Stufe 1–4 vollautomatisch",
  "Mandanten buchen selbst — konfliktfreie Slots",
  "Live-KPIs: Pipeline, Auslastung, Forderungen, Mandate",
];

const ComparisonSection = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section className="py-32 bg-background relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="container mx-auto px-6" ref={ref}>
        <div className={`text-center mb-16 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-accent mb-4">
            <span className="w-8 h-px bg-accent/50" />
            Der Unterschied
            <span className="w-8 h-px bg-accent/50" />
          </span>
          <h2 className="text-4xl md:text-6xl font-display font-black text-foreground mt-3 mb-5 tracking-[-0.03em]">
            Mit oder ohne <span className="text-gradient-gold">SYSTEMS</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg font-light">
            Konkret. Messbar. Was sich für Ihre Kanzlei verändert.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-5 max-w-4xl mx-auto">
          {/* Without */}
          <div
            className={`p-8 rounded-2xl border border-destructive/20 bg-destructive/[0.02] transition-all duration-700 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"
            }`}
            style={{ transitionDelay: "200ms" }}
          >
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-destructive/15">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                <X className="h-5 w-5 text-destructive" />
              </div>
              <h3 className="text-lg font-display font-bold text-foreground">Ohne SYSTEMS — Status quo</h3>
            </div>
            <ul className="space-y-4">
              {without.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <X className="h-4 w-4 text-destructive/70 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* With */}
          <div
            className={`p-8 rounded-2xl border border-accent/30 bg-accent/[0.03] shadow-2xl shadow-accent/[0.08] transition-all duration-700 relative ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10"
            }`}
            style={{ transitionDelay: "300ms" }}
          >
            <div className="absolute -top-3 right-6 px-3 py-1 rounded-full bg-accent text-accent-foreground text-[10px] font-bold uppercase tracking-wider shadow-lg shadow-accent/30">
              Empfohlen
            </div>
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-accent/20">
              <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
                <Check className="h-5 w-5 text-accent" />
              </div>
              <h3 className="text-lg font-display font-bold text-foreground">Mit SYSTEMS™ Plattform</h3>
            </div>
            <ul className="space-y-4">
              {with_lawyer.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-foreground/80">
                  <Check className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className={`text-center mt-16 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`} style={{ transitionDelay: "600ms" }}>
          <a href="#preise">
            <Button variant="gold" className="rounded-2xl group" size="lg">
              Tarife ansehen
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
};

export default ComparisonSection;
