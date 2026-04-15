import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { Linkedin, Mail } from "lucide-react";
import teamBergmann from "@/assets/team-bergmann.jpg";
import teamWeber from "@/assets/team-weber.jpg";
import teamRichter from "@/assets/team-richter.jpg";
import teamMueller from "@/assets/team-mueller.jpg";

const team = [
  {
    name: "Dr. Alexander Bergmann",
    role: "Gründungspartner · Fachanwalt für Handelsrecht",
    image: teamBergmann,
    specialties: ["Unternehmensrecht", "M&A", "Gesellschaftsrecht"],
    quote: "Ihr Recht ist keine Verhandlungssache.",
  },
  {
    name: "Dr. Katharina Weber",
    role: "Partnerin · Fachanwältin für Familienrecht",
    image: teamWeber,
    specialties: ["Familienrecht", "Erbrecht", "Mediation"],
    quote: "Familien verdienen Lösungen, keine Schlachtfelder.",
  },
  {
    name: "Maximilian Richter",
    role: "Senior Associate · Fachanwalt für Arbeitsrecht",
    image: teamRichter,
    specialties: ["Arbeitsrecht", "Kündigungsschutz", "Abfindungen"],
    quote: "Kein Arbeitnehmer sollte Unrecht hinnehmen.",
  },
  {
    name: "Dr. Sophie Müller",
    role: "Partnerin · Fachanwältin für Strafrecht",
    image: teamMueller,
    specialties: ["Strafrecht", "Wirtschaftsstrafrecht", "Compliance"],
    quote: "Jeder verdient eine Verteidigung auf Augenhöhe.",
  },
];

const TeamSection = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section id="team" className="py-32 bg-background relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="container mx-auto px-6" ref={ref}>
        <div className="text-center mb-20">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-accent mb-4">
            <span className="w-8 h-px bg-accent/50" />
            Unser Team
            <span className="w-8 h-px bg-accent/50" />
          </span>
          <h2 className="text-4xl md:text-6xl font-display font-bold text-foreground mt-3 mb-5">
            Die <span className="text-gradient-gold">Köpfe</span> hinter Ihrem Recht
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg font-light">
            Erfahrene Fachanwälte mit Leidenschaft für Gerechtigkeit – und einer gemeinsamen Mission: Ihr Recht durchzusetzen.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {team.map((member, i) => (
            <div
              key={member.name}
              className={`group relative rounded-2xl overflow-hidden cursor-pointer ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${i * 150}ms`, transitionDuration: "800ms", transitionProperty: "all" }}
            >
              <div className="aspect-[3/4] overflow-hidden">
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                  width={512}
                  height={640}
                />
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-navy-dark via-navy-dark/40 to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-500" />

              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h3 className="text-base font-display font-bold text-primary-foreground mb-1">{member.name}</h3>
                <p className="text-xs text-primary-foreground/50 mb-2 leading-relaxed">{member.role}</p>

                {/* Quote - always visible */}
                <p className="text-xs text-accent/80 italic mb-3 font-display">„{member.quote}"</p>

                {/* Specialties - show on hover */}
                <div className="flex flex-wrap gap-1.5 mb-4 max-h-0 group-hover:max-h-20 overflow-hidden transition-all duration-500">
                  {member.specialties.map((s) => (
                    <span key={s} className="text-[10px] px-2 py-1 rounded-full bg-accent/10 text-accent border border-accent/20">
                      {s}
                    </span>
                  ))}
                </div>

                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-accent/20 transition-colors">
                    <Linkedin className="h-3.5 w-3.5 text-primary-foreground/70" />
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-accent/20 transition-colors">
                    <Mail className="h-3.5 w-3.5 text-primary-foreground/70" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TeamSection;
