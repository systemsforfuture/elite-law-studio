import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { Button } from "@/components/ui/button";
import { ArrowRight, Phone, Shield, Clock, CheckCircle } from "lucide-react";

const CtaBanner = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section className="py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-navy-dark via-navy to-navy-dark" />
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `linear-gradient(hsl(42 80% 55% / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(42 80% 55% / 0.3) 1px, transparent 1px)`,
        backgroundSize: '40px 40px'
      }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/[0.06] rounded-full blur-[150px]" />

      <div className="container mx-auto px-6 relative" ref={ref}>
        <div className={`text-center max-w-3xl mx-auto ${isVisible ? "animate-blur-in" : "opacity-0"}`}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400/60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
            </span>
            <span className="text-xs text-accent font-medium">Noch heute einen Termin sichern</span>
          </div>

          <h2 className="text-4xl md:text-6xl font-display font-bold text-primary-foreground mb-6">
            Lassen Sie uns Ihr <span className="text-gradient-gold">Recht durchsetzen</span>
          </h2>
          <p className="text-lg text-primary-foreground/50 font-light mb-10 max-w-xl mx-auto">
            Jeder Tag ohne anwaltliche Vertretung kann Sie Geld kosten. Handeln Sie jetzt – wir sind bereit.
          </p>

          <div className="flex flex-wrap gap-4 justify-center mb-8">
            <a href="#kontakt">
              <Button variant="hero" className="rounded-2xl glow-gold group text-base px-8 py-6">
                Kostenlose Erstberatung anfordern
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </a>
            <a href="tel:+493012345678">
              <Button variant="hero-outline" className="rounded-2xl group text-base px-8 py-6">
                <Phone className="mr-2 h-5 w-5" />
                Sofort anrufen
              </Button>
            </a>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center gap-6 text-primary-foreground/30 text-xs">
            <span className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" /> 100% vertraulich</span>
            <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Antwort in 2h</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5" /> Keine versteckten Kosten</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CtaBanner;
