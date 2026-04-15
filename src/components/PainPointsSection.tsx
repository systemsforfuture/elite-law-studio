import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { AlertTriangle, Clock, Ban, TrendingDown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const painPoints = [
  {
    icon: Clock,
    problem: "Fristen verpasst?",
    detail: "Jeden Tag ohne Anwalt kann Sie bares Geld kosten. Verjährungsfristen laufen – oft schneller als Sie denken.",
    stat: "47%",
    statLabel: "aller Ansprüche verjähren, weil zu spät gehandelt wird",
  },
  {
    icon: Ban,
    problem: "Unrechtmäßig gekündigt?",
    detail: "Ihr Arbeitgeber rechnet damit, dass Sie nichts tun. Dabei stehen Ihnen oft 5-stellige Abfindungen zu.",
    stat: "Ø 32.000€",
    statLabel: "Abfindung bei ungerechtfertigter Kündigung",
  },
  {
    icon: TrendingDown,
    problem: "Geld verloren?",
    detail: "Ob Betrug, Vertragsfallen oder Erbstreit – ohne anwaltliche Hilfe verschenken Sie Ihr Recht auf Entschädigung.",
    stat: "2,3 Mio.€",
    statLabel: "haben wir 2024 für Mandanten zurückgeholt",
  },
  {
    icon: AlertTriangle,
    problem: "Angeklagt oder beschuldigt?",
    detail: "Jede Aussage ohne Anwalt kann gegen Sie verwendet werden. Schweigen Sie – und rufen Sie uns an.",
    stat: "94%",
    statLabel: "der Verfahren mit besserem Ausgang durch frühe Vertretung",
  },
];

const PainPointsSection = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section className="py-32 bg-navy-dark relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `linear-gradient(hsl(0 70% 50% / 0.4) 1px, transparent 1px), linear-gradient(90deg, hsl(0 70% 50% / 0.4) 1px, transparent 1px)`,
        backgroundSize: '80px 80px'
      }} />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-destructive/[0.04] rounded-full blur-[200px]" />

      <div className="container mx-auto px-6" ref={ref}>
        <div className="text-center mb-6">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-destructive/80 mb-4">
            <span className="w-8 h-px bg-destructive/40" />
            Handeln Sie jetzt
            <span className="w-8 h-px bg-destructive/40" />
          </span>
          <h2 className="text-4xl md:text-6xl font-serif font-bold text-primary-foreground mt-3 mb-5">
            Warten kostet Sie <span className="text-destructive">Geld</span>
          </h2>
          <p className="text-primary-foreground/40 max-w-2xl mx-auto text-lg font-light">
            Die meisten Menschen verlieren ihre Ansprüche nicht vor Gericht – sondern weil sie zu spät handeln.
          </p>
        </div>

        {/* Urgency ticker */}
        <div className={`flex justify-center mb-16 ${isVisible ? "animate-blur-in" : "opacity-0"}`}>
          <div className="glass-dark px-6 py-3 flex items-center gap-3 border-destructive/20">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive/60" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-destructive" />
            </span>
            <span className="text-sm text-primary-foreground/60">
              <strong className="text-primary-foreground">3 Anfragen</strong> in der letzten Stunde eingegangen
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-16">
          {painPoints.map((p, i) => (
            <div
              key={p.problem}
              className={`group glass-dark p-8 hover:border-accent/20 transition-all duration-500 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${i * 120}ms`, transitionDuration: "700ms" }}
            >
              <div className="flex items-start gap-5">
                <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center shrink-0 group-hover:bg-accent/10 transition-colors duration-500">
                  <p.icon className="h-6 w-6 text-destructive group-hover:text-accent transition-colors duration-500" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-serif font-bold text-primary-foreground mb-2 group-hover:text-accent transition-colors">
                    {p.problem}
                  </h3>
                  <p className="text-sm text-primary-foreground/50 leading-relaxed mb-4">{p.detail}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-serif font-bold text-accent">{p.stat}</span>
                    <span className="text-xs text-primary-foreground/30">{p.statLabel}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Urgency CTA */}
        <div className={`text-center ${isVisible ? "animate-blur-in" : "opacity-0"}`} style={{ animationDelay: "0.6s" }}>
          <a href="#kontakt">
            <Button variant="hero" className="rounded-2xl glow-gold group text-base px-10 py-6">
              Jetzt kostenlos beraten lassen – bevor es zu spät ist
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </a>
          <p className="text-xs text-primary-foreground/25 mt-5">
            Kostenlos · Unverbindlich · Antwort innerhalb von 2 Stunden
          </p>
        </div>
      </div>
    </section>
  );
};

export default PainPointsSection;
