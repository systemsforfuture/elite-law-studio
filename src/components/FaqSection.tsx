import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { useState } from "react";
import { ChevronDown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const faqs = [
  {
    q: "Was kostet eine Erstberatung?",
    a: "Die Erstberatung bei uns ist kostenlos und unverbindlich. Wir analysieren Ihren Fall und geben Ihnen eine ehrliche Einschätzung – ohne versteckte Kosten.",
  },
  {
    q: "Wie schnell bekomme ich einen Termin?",
    a: "In dringenden Fällen können wir oft noch am selben Tag einen Termin anbieten. Reguläre Erstberatungen sind innerhalb von 48 Stunden möglich.",
  },
  {
    q: "Übernimmt meine Rechtsschutzversicherung die Kosten?",
    a: "In den meisten Fällen ja. Wir prüfen vorab kostenlos, ob Ihre Versicherung die Kosten übernimmt und kümmern uns um die Deckungszusage.",
  },
  {
    q: "Kann ich auch Online-Beratung nutzen?",
    a: "Selbstverständlich. Über unser digitales Mandanten-Portal können Sie Termine per Video wahrnehmen, Dokumente austauschen und den Status Ihres Falls jederzeit einsehen.",
  },
  {
    q: "Wie ist die Erfolgsquote Ihrer Kanzlei?",
    a: "Wir erreichen eine Erfolgsquote von 97% – ob durch außergerichtliche Einigungen oder Gerichtsverfahren. Jeder Fall wird individuell mit einer maßgeschneiderten Strategie bearbeitet.",
  },
  {
    q: "Wie funktioniert das Mandanten-Portal?",
    a: "Nach Beauftragung erhalten Sie Zugang zu unserem sicheren Portal. Dort können Sie Dokumente hochladen, Nachrichten an Ihren Anwalt senden, Termine vereinbaren und den Fortschritt Ihres Falls in Echtzeit verfolgen.",
  },
];

const FaqSection = () => {
  const { ref, isVisible } = useScrollAnimation();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-32 bg-background relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="container mx-auto px-6" ref={ref}>
        <div className="grid lg:grid-cols-5 gap-16">
          <div className={`lg:col-span-2 transition-all duration-1000 ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"}`}>
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-accent mb-4">
              <span className="w-8 h-px bg-accent/50" />
              FAQ
            </span>
            <h2 className="text-4xl md:text-5xl font-display font-black text-foreground mt-3 mb-6 tracking-[-0.03em]">
              Häufig gestellte <span className="text-gradient-gold">Fragen</span>
            </h2>
            <p className="text-muted-foreground text-lg font-light leading-relaxed mb-8">
              Antworten auf die wichtigsten Fragen – transparent und ehrlich.
            </p>
            <a href="#kontakt">
              <Button variant="gold" className="rounded-2xl group">
                Individuelle Frage stellen
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </a>
          </div>

          <div className="lg:col-span-3 space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className={`rounded-2xl border border-border/50 overflow-hidden transition-all duration-700 ${
                  openIndex === i ? "bg-card shadow-lg shadow-accent/[0.03] border-accent/20" : "bg-transparent hover:bg-card/50"
                } ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
                style={{ transitionDelay: `${200 + i * 80}ms` }}
              >
                <button
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="w-full flex items-center justify-between p-6 text-left group"
                >
                  <span className={`text-sm font-medium pr-4 transition-colors duration-300 ${openIndex === i ? "text-accent" : "text-foreground group-hover:text-foreground/80"}`}>{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-accent shrink-0 transition-transform duration-300 ${
                      openIndex === i ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-500 ${
                    openIndex === i ? "max-h-40 pb-6" : "max-h-0"
                  }`}
                >
                  <p className="px-6 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FaqSection;
