import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Mail, Sparkles, Check } from "lucide-react";

const SalesCTASection = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section id="contact" className="py-32 bg-background relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/[0.06] rounded-full blur-[200px]" />
      </div>

      <div className="container mx-auto px-6 relative" ref={ref}>
        <div
          className={`max-w-4xl mx-auto text-center transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-accent mb-4">
            <Sparkles className="h-3 w-3" />
            Bereit?
            <Sparkles className="h-3 w-3" />
          </span>
          <h2 className="text-4xl md:text-6xl font-display font-black text-foreground mb-6 tracking-[-0.03em] leading-[1.05]">
            Ihre Kanzlei läuft <span className="text-gradient-gold">in 24h</span> autonom.
            <br />
            Oder Sie zahlen <span className="text-gradient-gold">nichts</span>.
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg font-light mb-10">
            14 Tage volle Plattform testen. Kein Setup-Fee bis zur Live-Schaltung.
            Kommen wir nicht ans Ziel — kostet Sie keinen Cent.
          </p>

          <div className="flex flex-wrap gap-4 justify-center mb-12">
            <Link to="/onboarding">
              <Button variant="hero" className="rounded-2xl glow-gold group text-base px-10 py-6">
                <Sparkles className="mr-2 h-5 w-5" />
                Live-Demo starten
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <a href="tel:+493012345678">
              <Button variant="hero-outline" className="rounded-2xl group text-base px-10 py-6">
                <Phone className="mr-2 h-4 w-4" />
                +49 30 123 456 78
              </Button>
            </a>
          </div>

          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground/60">
            {[
              "DSGVO · EU-Hosting Frankfurt",
              "Auftragsverarbeitungs-Vertrag inklusive",
              "§43e BRAO konform",
              "Beschlagnahmefrei",
            ].map((label) => (
              <span key={label} className="inline-flex items-center gap-1.5">
                <Check className="h-3 w-3 text-accent" />
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SalesCTASection;
