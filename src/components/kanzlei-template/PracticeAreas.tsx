import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { Scale, Briefcase, FileText, Heart, Building, Gavel, ArrowUpRight } from "lucide-react";

const practices = [
  {
    icon: Heart,
    title: "Familienrecht",
    description: "Scheidung, Sorgerecht, Unterhalt – wir begleiten Sie sensibel durch schwierige Zeiten.",
    cases: "1.200+",
  },
  {
    icon: Briefcase,
    title: "Arbeitsrecht",
    description: "Kündigungsschutz, Abfindungen und Arbeitsverträge – Ihr Recht als Arbeitnehmer und Arbeitgeber.",
    cases: "2.400+",
  },
  {
    icon: FileText,
    title: "Vertragsrecht",
    description: "Prüfung, Gestaltung und Durchsetzung von Verträgen aller Art.",
    cases: "890+",
  },
  {
    icon: Scale,
    title: "Erbrecht",
    description: "Testamente, Erbstreitigkeiten und Nachlassplanung – vorausschauend und kompetent.",
    cases: "750+",
  },
  {
    icon: Building,
    title: "Immobilienrecht",
    description: "Kaufverträge, Mietrecht und Baurecht – umfassende Beratung rund um Ihre Immobilie.",
    cases: "620+",
  },
  {
    icon: Gavel,
    title: "Strafrecht",
    description: "Verteidigung Ihrer Rechte im Strafverfahren – engagiert und diskret.",
    cases: "430+",
  },
];

const PracticeAreas = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section id="rechtsgebiete" className="py-32 bg-background relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-accent/[0.03] rounded-full blur-[120px]" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-navy/[0.03] rounded-full blur-[80px]" />
      
      <div className="container mx-auto px-6" ref={ref}>
        <div className={`text-center mb-20 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-accent mb-4">
            <span className="w-8 h-px bg-accent/50" />
            Unsere Expertise
            <span className="w-8 h-px bg-accent/50" />
          </span>
          <h2 className="text-4xl md:text-6xl font-display font-black text-foreground mt-3 mb-5 tracking-[-0.03em]">Rechtsgebiete</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg font-light">
            Spezialisierte Fachanwälte für jedes Rechtsgebiet – mit nachweisbarer Erfolgsbilanz.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {practices.map((practice, i) => (
            <div
              key={practice.title}
              className={`group relative p-8 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card hover:border-accent/30 hover:shadow-2xl hover:shadow-accent/[0.05] transition-all duration-700 cursor-pointer ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
              style={{ transitionDelay: `${200 + i * 100}ms` }}
            >
              <div className="flex items-start justify-between mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent/15 to-accent/5 flex items-center justify-center group-hover:from-accent/25 group-hover:to-accent/10 group-hover:scale-110 transition-all duration-500">
                  <practice.icon className="h-6 w-6 text-accent" />
                </div>
                <ArrowUpRight className="h-5 w-5 text-muted-foreground/0 group-hover:text-accent transition-all duration-300 group-hover:-translate-y-1 group-hover:translate-x-1" />
              </div>
              <h3 className="text-xl font-display font-bold text-foreground mb-3 group-hover:text-accent transition-colors duration-300">{practice.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">{practice.description}</p>
              <div className="pt-4 border-t border-border/30">
                <span className="text-xs text-accent font-semibold">{practice.cases} erfolgreiche Fälle</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PracticeAreas;
