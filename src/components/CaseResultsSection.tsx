import { useScrollAnimation, useCountUp } from "@/hooks/use-scroll-animation";
import { TrendingUp, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const caseResults = [
  {
    category: "Arbeitsrecht",
    title: "Ungerechtfertigte Kündigung abgewehrt",
    result: "85.000€",
    resultLabel: "Abfindung erstritten",
    description: "Marketing-Direktorin wurde nach 12 Jahren fristlos gekündigt. Wir konnten die Kündigung vor dem Arbeitsgericht anfechten.",
    duration: "4 Wochen",
    tag: "Außergerichtlich",
  },
  {
    category: "Unternehmensrecht",
    title: "Firmenübernahme erfolgreich begleitet",
    result: "2,3 Mio.€",
    resultLabel: "Unternehmenswert gesichert",
    description: "Mittelständisches Unternehmen vor feindlicher Übernahme geschützt und strategische Neupositionierung verhandelt.",
    duration: "6 Monate",
    tag: "Verhandlung",
  },
  {
    category: "Familienrecht",
    title: "Sorgerecht & Vermögensaufteilung",
    result: "100%",
    resultLabel: "Sorgerecht erhalten",
    description: "Gemeinsames Sorgerecht durchgesetzt und eine faire Vermögensaufteilung von über 400.000€ verhandelt.",
    duration: "3 Monate",
    tag: "Mediation",
  },
  {
    category: "Strafrecht",
    title: "Betrugsvorwurf entkräftet",
    result: "Freispruch",
    resultLabel: "Alle Anklagepunkte fallen gelassen",
    description: "Geschäftsführer stand wegen angeblichem Betrug vor Gericht. Durch lückenlose Beweisführung vollständig entlastet.",
    duration: "8 Monate",
    tag: "Gerichtsverfahren",
  },
];

const CaseResultsSection = () => {
  const { ref, isVisible } = useScrollAnimation();
  const totalRecovered = useCountUp(23, 2000, isVisible);

  return (
    <section className="py-32 bg-background relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent/[0.02] rounded-full blur-[150px]" />

      <div className="container mx-auto px-6" ref={ref}>
        {/* Header with live counter */}
        <div className={`text-center mb-8 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-accent mb-4">
            <span className="w-8 h-px bg-accent/50" />
            Ergebnisse die sprechen
            <span className="w-8 h-px bg-accent/50" />
          </span>
          <h2 className="text-4xl md:text-6xl font-display font-black text-foreground mt-3 mb-5 tracking-[-0.03em]">
            Echte <span className="text-gradient-gold">Erfolge</span> für echte Menschen
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg font-light">
            Wir reden nicht nur – wir liefern. Hier sind einige unserer jüngsten Fallergebnisse.
          </p>
        </div>

        {/* Aggregate stat */}
        <div className={`flex justify-center mb-16 transition-all duration-700 delay-200 ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
          <div className="glass-card px-10 py-5 flex items-center gap-6 border-accent/10">
            <div className="text-center">
              <div className="text-4xl font-display font-black text-gradient-gold tabular-nums">{totalRecovered > 0 ? `${(totalRecovered / 10).toFixed(1)}` : "0"} Mio.€</div>
              <div className="text-xs text-muted-foreground mt-1">für Mandanten erstritten in 2024</div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-5 mb-16">
          {caseResults.map((c, i) => (
            <div
              key={c.title}
              className={`group relative rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-8 hover:border-accent/30 hover:shadow-2xl hover:shadow-accent/[0.06] transition-all duration-700 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
              style={{ transitionDelay: `${400 + i * 120}ms` }}
            >
              <div className="flex items-center justify-between mb-5">
                <span className="text-[11px] uppercase tracking-wider text-accent font-semibold px-3 py-1 rounded-full bg-accent/10 border border-accent/20">
                  {c.category}
                </span>
                <span className="text-[11px] text-muted-foreground px-3 py-1 rounded-full bg-muted/50">
                  {c.tag} · {c.duration}
                </span>
              </div>

              <h3 className="text-lg font-display font-bold text-foreground mb-3 group-hover:text-accent transition-colors duration-300">{c.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">{c.description}</p>

              <div className="flex items-end gap-3 pt-5 border-t border-border/50">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <div className="text-3xl font-display font-black text-gradient-gold">{c.result}</div>
                  <div className="text-xs text-muted-foreground">{c.resultLabel}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={`text-center transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`} style={{ transitionDelay: "900ms" }}>
          <p className="text-sm text-muted-foreground mb-6">
            <strong className="text-foreground">Jeder Fall ist einzigartig.</strong> Lassen Sie uns Ihren analysieren.
          </p>
          <a href="#kontakt">
            <Button variant="gold" className="rounded-2xl group" size="lg">
              Kostenlosen Fallcheck anfordern
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
};

export default CaseResultsSection;
