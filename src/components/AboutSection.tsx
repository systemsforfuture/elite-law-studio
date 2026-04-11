import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { CheckCircle } from "lucide-react";

const AboutSection = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section id="ueber-uns" className="py-24 bg-background">
      <div className="container mx-auto px-6" ref={ref}>
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className={`${isVisible ? "animate-slide-in-left" : "opacity-0"}`}>
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Über uns</span>
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground mt-3 mb-6">
              Vertrauen durch <span className="text-accent">Kompetenz</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8">
              Seit über 25 Jahren stehen wir für exzellente Rechtsberatung. Unser Team aus 
              erfahrenen Anwälten verbindet juristische Expertise mit persönlichem Engagement.
              Jeder Fall ist einzigartig – und genau so behandeln wir ihn.
            </p>

            <div className="space-y-4">
              {[
                "Über 25 Jahre Erfahrung in allen Rechtsgebieten",
                "Persönliche Betreuung durch feste Ansprechpartner",
                "Transparente Kostenstruktur ohne versteckte Gebühren",
                "Digitales Mandanten-Portal für volle Transparenz",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-accent mt-0.5 shrink-0" />
                  <span className="text-sm text-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={`${isVisible ? "animate-slide-in-right" : "opacity-0"}`}>
            <div className="relative">
              <div className="bg-navy rounded-2xl p-10 text-primary-foreground">
                <div className="text-6xl font-serif font-bold text-accent mb-2">25+</div>
                <div className="text-sm text-primary-foreground/60 uppercase tracking-wider mb-8">Jahre Erfahrung</div>
                
                <div className="grid grid-cols-2 gap-6">
                  {[
                    { value: "12", label: "Anwälte" },
                    { value: "5.000+", label: "Mandate" },
                    { value: "97%", label: "Erfolgsquote" },
                    { value: "4.9★", label: "Bewertung" },
                  ].map(({ value, label }) => (
                    <div key={label}>
                      <div className="text-2xl font-serif font-bold">{value}</div>
                      <div className="text-xs text-primary-foreground/50 uppercase tracking-wider">{label}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 w-full h-full rounded-2xl border-2 border-accent/20 -z-10" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
