import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { PhoneOff, Mail, Receipt, Clock4, TrendingDown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const painPoints = [
  {
    icon: PhoneOff,
    problem: "Verlorene Mandanten am Telefon",
    detail:
      "30-40% aller Erstanrufer landen in der Mailbox — und rufen nie wieder an. Jeder Anruf außerhalb der Sprechzeiten ist verlorenes Geschäft.",
    stat: "8.400€",
    statLabel: "verlorenes Mandat pro Monat (Ø Studie 2025)",
  },
  {
    icon: Mail,
    problem: "Email-Flut, die niemand schafft",
    detail:
      "Standard-Anfragen, Terminwünsche, Rückfragen, Werbung — Sie verbringen 90 Minuten täglich mit Mail-Triage statt mit Mandaten.",
    stat: "22h",
    statLabel: "Verwaltung pro Anwalt und Woche (Ø DAV-Studie)",
  },
  {
    icon: Receipt,
    problem: "Mahnwesen wird liegen gelassen",
    detail:
      "Offene Honorarforderungen schmerzen — aber das Mahnverfahren ist lästig. Jede zweite Kanzlei lässt 4-stellige Beträge einfach liegen.",
    stat: "12.000€",
    statLabel: "Forderungen werden Ø pro Kanzlei abgeschrieben",
  },
  {
    icon: Clock4,
    problem: "Fristen, Wiedervorlagen, Termine — manuell",
    detail:
      "Ein verpasster Stichtag = ein Haftungsfall. Excel, Outlook und Post-its sind keine Fristenkontrolle.",
    stat: "1 von 8",
    statLabel: "Kanzleien hatte 2024 einen Fristenfehler",
  },
];

const PainPointsSection = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section id="plattform" className="py-32 bg-navy-dark relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-navy-dark via-navy-dark to-navy-dark" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-destructive/[0.03] rounded-full blur-[200px]" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/[0.02] rounded-full blur-[150px]" />

      <div className="container mx-auto px-6 relative" ref={ref}>
        <div
          className={`text-center mb-6 transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-destructive/80 mb-4">
            <span className="w-8 h-px bg-destructive/40" />
            Das Problem
            <span className="w-8 h-px bg-destructive/40" />
          </span>
          <h2 className="text-4xl md:text-6xl font-display font-black text-primary-foreground mt-3 mb-5 tracking-[-0.03em]">
            Sie sind <span className="text-destructive">Anwalt</span>. Nicht Sekretariat.
          </h2>
          <p className="text-primary-foreground/40 max-w-2xl mx-auto text-lg font-light">
            70% Ihrer Arbeitszeit geht für Verwaltung drauf, die längst eine
            Maschine erledigen kann. Wir nehmen sie Ihnen ab.
          </p>
        </div>

        <div className="flex justify-center mb-16">
          <div className="glass-dark px-6 py-3 flex items-center gap-3 border-destructive/20">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive/60" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-destructive" />
            </span>
            <span className="text-sm text-primary-foreground/60">
              <strong className="text-primary-foreground">Heute</strong> verlieren deutsche Kanzleien ~3.4 Mio. € an verpassten Anrufen
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-5 mb-16">
          {painPoints.map((p, i) => (
            <div
              key={p.problem}
              className={`group glass-dark p-8 hover:border-accent/20 transition-all duration-700 cursor-default ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
              style={{ transitionDelay: `${300 + i * 120}ms` }}
            >
              <div className="flex items-start gap-5">
                <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center shrink-0 group-hover:bg-accent/10 group-hover:scale-110 transition-all duration-500">
                  <p.icon className="h-6 w-6 text-destructive group-hover:text-accent transition-colors duration-500" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-display font-bold text-primary-foreground mb-2 group-hover:text-accent transition-colors duration-300">
                    {p.problem}
                  </h3>
                  <p className="text-sm text-primary-foreground/50 leading-relaxed mb-4">
                    {p.detail}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-display font-bold text-accent">
                      {p.stat}
                    </span>
                    <span className="text-xs text-primary-foreground/30">
                      {p.statLabel}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div
          className={`text-center transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
          style={{ transitionDelay: "800ms" }}
        >
          <div className="inline-flex items-center gap-3 mb-6 text-sm text-primary-foreground/40">
            <TrendingDown className="h-4 w-4 text-destructive" />
            <span>
              Status quo kostet Sie nicht nur Zeit — er kostet Sie Mandanten.
            </span>
          </div>
          <a href="#module">
            <Button variant="hero" className="rounded-2xl glow-gold group text-base px-10 py-6">
              So lösen wir das Problem
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
};

export default PainPointsSection;
