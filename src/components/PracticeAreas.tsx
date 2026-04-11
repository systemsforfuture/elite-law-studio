import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { Scale, Briefcase, FileText, Heart, Building, Gavel } from "lucide-react";

const practices = [
  {
    icon: Heart,
    title: "Familienrecht",
    description: "Scheidung, Sorgerecht, Unterhalt – wir begleiten Sie sensibel durch schwierige Zeiten.",
  },
  {
    icon: Briefcase,
    title: "Arbeitsrecht",
    description: "Kündigungsschutz, Abfindungen und Arbeitsverträge – Ihr Recht als Arbeitnehmer und Arbeitgeber.",
  },
  {
    icon: FileText,
    title: "Vertragsrecht",
    description: "Prüfung, Gestaltung und Durchsetzung von Verträgen aller Art.",
  },
  {
    icon: Scale,
    title: "Erbrecht",
    description: "Testamente, Erbstreitigkeiten und Nachlassplanung – vorausschauend und kompetent.",
  },
  {
    icon: Building,
    title: "Immobilienrecht",
    description: "Kaufverträge, Mietrecht und Baurecht – umfassende Beratung rund um Ihre Immobilie.",
  },
  {
    icon: Gavel,
    title: "Strafrecht",
    description: "Verteidigung Ihrer Rechte im Strafverfahren – engagiert und diskret.",
  },
];

const PracticeAreas = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section id="rechtsgebiete" className="py-24 bg-card">
      <div className="container mx-auto px-6" ref={ref}>
        <div className="text-center mb-16">
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Unsere Expertise</span>
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground mt-3 mb-4">Rechtsgebiete</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Wir bieten Ihnen umfassende rechtliche Beratung in allen wichtigen Rechtsgebieten.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {practices.map((practice, i) => (
            <div
              key={practice.title}
              className={`group p-8 rounded-xl border border-border bg-card hover:border-accent/40 hover:shadow-lg transition-all duration-500 cursor-pointer ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-5 group-hover:bg-accent/20 transition-colors">
                <practice.icon className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-serif font-semibold text-foreground mb-3">{practice.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{practice.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PracticeAreas;
