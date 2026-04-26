import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { useState } from "react";
import { ChevronDown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const faqs = [
  {
    q: "Ist das mit dem anwaltlichen Berufsgeheimnis vereinbar?",
    a: "Ja. §43e BRAO erlaubt Cloud-Nutzung explizit, wenn Verschlüsselung und Vertraulichkeit gewährleistet sind. Wir hosten ausschließlich in Deutschland (Frankfurt), verschlüsseln Ihre Daten mit einem eigenen Schlüssel pro Kanzlei, schließen den Auftragsverarbeitungs-Vertrag mit Ihnen ab und legen die Daten so ab, dass keine Behörde direkten Zugriff bekommt (Beschlagnahmefreiheit).",
  },
  {
    q: "Wie schnell sind wir live?",
    a: "24 Stunden ab Vertragsabschluss bis zum ersten echten Anruf. Persönliche Begleitung durch unser Customer-Success-Team. Datenmigration aus RA-MICRO, DATEV, Advoware oder Excel ist im Setup enthalten.",
  },
  {
    q: "Was passiert bei juristischen Fragen — entscheidet die KI selbständig?",
    a: "Niemals. Die KI ist auf Empfangs- und Verwaltungs-Aufgaben begrenzt. Bei juristischen Fragen, Notfällen oder unsicheren Situationen eskaliert sie automatisch an den zuständigen Anwalt — per Push, SMS oder Anruf. Sie entscheiden, was eskaliert wird.",
  },
  {
    q: "Bleiben unsere Telefonnummer und unser Branding erhalten?",
    a: "Komplett. Sie behalten Ihre Telefonnummer, Ihre Domain, Ihr Logo, Ihre Farben. Premium-Tarif: Klonen Ihrer eigenen Stimme — Mandanten hören Sie selbst antworten, auch wenn die KI im Hintergrund läuft.",
  },
  {
    q: "Was kostet die Telefonie zusätzlich?",
    a: "Im Tarif-Preis sind Telefon-Minuten inkludiert (Foundation 200, Growth 500, Premium 1.500). Darüber hinaus Pre-Paid-Aufladung. Volle Transparenz im Dashboard — Sie laden Guthaben einmalig auf, der Rest läuft automatisch.",
  },
  {
    q: "Was, wenn wir nach 14 Tagen merken, dass es nichts ist?",
    a: "Dann zahlen Sie nichts. Setup-Fee wird erst bei Live-Schaltung fällig. Kommen wir nicht ans Ziel — kein Cent. Die ersten 14 Tage volle Plattform inklusive. Faire Sache.",
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
              Antworten auf die wichtigsten Fragen — transparent, ehrlich, ohne Marketing-Sprech.
            </p>
            <a href="#contact">
              <Button variant="gold" className="rounded-2xl group">
                Andere Frage? Sprechen Sie mit uns
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
                  className={`grid transition-all duration-500 ${
                    openIndex === i ? "grid-rows-[1fr] opacity-100 pb-6" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <p className="px-6 text-sm text-muted-foreground leading-relaxed overflow-hidden">{faq.a}</p>
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
