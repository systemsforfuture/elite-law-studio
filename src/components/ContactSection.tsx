import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { Button } from "@/components/ui/button";
import { Phone, Mail, MapPin, Clock } from "lucide-react";

const ContactSection = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section id="kontakt" className="py-24 bg-card">
      <div className="container mx-auto px-6" ref={ref}>
        <div className="grid lg:grid-cols-2 gap-16">
          <div className={`${isVisible ? "animate-slide-in-left" : "opacity-0"}`}>
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Kontakt</span>
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground mt-3 mb-6">
              Erstberatung <span className="text-accent">vereinbaren</span>
            </h2>
            <p className="text-muted-foreground mb-10">
              Vereinbaren Sie jetzt Ihre kostenlose Erstberatung. Wir nehmen uns Zeit für Ihr Anliegen.
            </p>

            <div className="space-y-6">
              {[
                { icon: Phone, label: "+49 30 123 456 78" },
                { icon: Mail, label: "info@kanzlei-bergmann.de" },
                { icon: MapPin, label: "Friedrichstraße 123, 10117 Berlin" },
                { icon: Clock, label: "Mo–Fr: 09:00 – 18:00 Uhr" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-accent" />
                  </div>
                  <span className="text-sm text-foreground">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={`${isVisible ? "animate-slide-in-right" : "opacity-0"}`}>
            <div className="bg-card rounded-2xl border border-border p-8 shadow-sm">
              <h3 className="text-xl font-serif font-semibold text-foreground mb-6">Nachricht senden</h3>
              <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Vorname"
                    className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <input
                    type="text"
                    placeholder="Nachname"
                    className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <input
                  type="email"
                  placeholder="E-Mail"
                  className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <input
                  type="tel"
                  placeholder="Telefon"
                  className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <textarea
                  rows={4}
                  placeholder="Ihr Anliegen"
                  className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
                <Button variant="gold" className="w-full" size="lg">
                  Anfrage absenden
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
