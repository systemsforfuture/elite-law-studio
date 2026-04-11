import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { Button } from "@/components/ui/button";
import { Phone, Mail, MapPin, Clock, ArrowRight } from "lucide-react";

const ContactSection = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section id="kontakt" className="py-28 bg-background relative overflow-hidden">
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-accent/[0.03] rounded-full blur-[100px]" />
      
      <div className="container mx-auto px-6" ref={ref}>
        <div className="grid lg:grid-cols-2 gap-20">
          <div className={`${isVisible ? "animate-slide-in-left" : "opacity-0"}`}>
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-accent mb-4">
              <span className="w-8 h-px bg-accent/50" />
              Kontakt
            </span>
            <h2 className="text-4xl md:text-6xl font-serif font-bold text-foreground mt-3 mb-6">
              Erstberatung{" "}
              <span className="text-gradient-gold">vereinbaren</span>
            </h2>
            <p className="text-muted-foreground mb-12 text-lg font-light">
              Vereinbaren Sie jetzt Ihre kostenlose Erstberatung. Wir nehmen uns Zeit für Ihr Anliegen.
            </p>

            <div className="space-y-5">
              {[
                { icon: Phone, label: "+49 30 123 456 78" },
                { icon: Mail, label: "info@kanzlei-bergmann.de" },
                { icon: MapPin, label: "Friedrichstraße 123, 10117 Berlin" },
                { icon: Clock, label: "Mo–Fr: 09:00 – 18:00 Uhr" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-4 group cursor-pointer">
                  <div className="w-12 h-12 rounded-2xl bg-accent/[0.08] flex items-center justify-center group-hover:bg-accent/15 transition-all duration-300">
                    <Icon className="h-5 w-5 text-accent" />
                  </div>
                  <span className="text-sm text-foreground group-hover:text-accent transition-colors duration-300">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={`${isVisible ? "animate-slide-in-right" : "opacity-0"}`}>
            <div className="glass-card p-10 shadow-2xl shadow-navy/5">
              <h3 className="text-2xl font-serif font-semibold text-foreground mb-8">Nachricht senden</h3>
              <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Vorname"
                    className="w-full px-4 py-3.5 rounded-xl border border-border/50 bg-background/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/30 transition-all placeholder:text-muted-foreground/50"
                  />
                  <input
                    type="text"
                    placeholder="Nachname"
                    className="w-full px-4 py-3.5 rounded-xl border border-border/50 bg-background/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/30 transition-all placeholder:text-muted-foreground/50"
                  />
                </div>
                <input
                  type="email"
                  placeholder="E-Mail"
                  className="w-full px-4 py-3.5 rounded-xl border border-border/50 bg-background/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/30 transition-all placeholder:text-muted-foreground/50"
                />
                <input
                  type="tel"
                  placeholder="Telefon"
                  className="w-full px-4 py-3.5 rounded-xl border border-border/50 bg-background/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/30 transition-all placeholder:text-muted-foreground/50"
                />
                <textarea
                  rows={4}
                  placeholder="Ihr Anliegen"
                  className="w-full px-4 py-3.5 rounded-xl border border-border/50 bg-background/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/30 transition-all resize-none placeholder:text-muted-foreground/50"
                />
                <Button variant="gold" className="w-full rounded-xl group" size="lg">
                  Anfrage absenden
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
