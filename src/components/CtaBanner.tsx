import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { Button } from "@/components/ui/button";
import { ArrowRight, Phone } from "lucide-react";

const CtaBanner = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Full-width gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-navy-dark via-navy to-navy-dark" />
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `linear-gradient(hsl(42 80% 55% / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(42 80% 55% / 0.3) 1px, transparent 1px)`,
        backgroundSize: '40px 40px'
      }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/[0.06] rounded-full blur-[150px]" />

      <div className="container mx-auto px-6 relative" ref={ref}>
        <div className={`text-center max-w-3xl mx-auto ${isVisible ? "animate-blur-in" : "opacity-0"}`}>
          <h2 className="text-4xl md:text-6xl font-serif font-bold text-primary-foreground mb-6">
            Lassen Sie uns Ihr <span className="text-gradient-gold">Recht durchsetzen</span>
          </h2>
          <p className="text-lg text-primary-foreground/50 font-light mb-10 max-w-xl mx-auto">
            Kostenlose Erstberatung. Keine versteckten Kosten. Wir kämpfen für Ihr Recht – garantiert.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a href="#kontakt">
              <Button variant="hero" className="rounded-2xl glow-gold group">
                Kostenlose Erstberatung
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </a>
            <a href="tel:+493012345678">
              <Button variant="hero-outline" className="rounded-2xl group">
                <Phone className="mr-2 h-4 w-4" />
                +49 30 123 456 78
              </Button>
            </a>
          </div>
          <p className="text-xs text-primary-foreground/30 mt-8">
            ✓ Kostenlos  ·  ✓ Unverbindlich  ·  ✓ Sofort-Termin möglich
          </p>
        </div>
      </div>
    </section>
  );
};

export default CtaBanner;
