import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { Button } from "@/components/ui/button";
import { Phone, Mail, MapPin, Clock, ArrowRight, CheckCircle } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const ContactSection = () => {
  const { ref, isVisible } = useScrollAnimation();
  const { toast } = useToast();
  const [formData, setFormData] = useState({ firstName: "", lastName: "", email: "", phone: "", message: "", rechtsgebiet: "" });
  const [sending, setSending] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      setSending(false);
      toast({ title: "Anfrage gesendet", description: "Wir melden uns innerhalb von 24 Stunden bei Ihnen." });
      setFormData({ firstName: "", lastName: "", email: "", phone: "", message: "", rechtsgebiet: "" });
    }, 1500);
  };

  return (
    <section id="kontakt" className="py-32 bg-card relative overflow-hidden">
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-accent/[0.03] rounded-full blur-[100px]" />

      <div className="container mx-auto px-6" ref={ref}>
        <div className="grid lg:grid-cols-2 gap-20">
          <div className={`${isVisible ? "animate-slide-in-left" : "opacity-0"}`}>
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-accent mb-4">
              <span className="w-8 h-px bg-accent/50" />
              Kontakt
            </span>
            <h2 className="text-4xl md:text-6xl font-display font-bold text-foreground mt-3 mb-6">
              Kostenlose{" "}
              <span className="text-gradient-gold">Erstberatung</span>
            </h2>
            <p className="text-muted-foreground mb-8 text-lg font-light">
              Schildern Sie uns Ihr Anliegen – wir melden uns innerhalb von 24 Stunden mit einer ersten Einschätzung.
            </p>

            {/* Trust points */}
            <div className="space-y-4 mb-12">
              {[
                "Kostenlose und unverbindliche Ersteinschätzung",
                "Antwort innerhalb von 24 Stunden garantiert",
                "Ihre Daten werden streng vertraulich behandelt",
                "Rechtsschutzversicherung? Wir prüfen die Deckung",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <CheckCircle className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                  <span className="text-sm text-foreground/70">{item}</span>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              {[
                { icon: Phone, label: "+49 30 123 456 78", href: "tel:+493012345678" },
                { icon: Mail, label: "info@kanzlei-bergmann.de", href: "mailto:info@kanzlei-bergmann.de" },
                { icon: MapPin, label: "Friedrichstraße 123, 10117 Berlin" },
                { icon: Clock, label: "Mo–Fr: 09:00 – 18:00 Uhr" },
              ].map(({ icon: Icon, label, href }) => (
                <a key={label} href={href || "#"} className="flex items-center gap-4 group">
                  <div className="w-12 h-12 rounded-2xl bg-accent/[0.08] flex items-center justify-center group-hover:bg-accent/15 transition-all duration-300">
                    <Icon className="h-5 w-5 text-accent" />
                  </div>
                  <span className="text-sm text-foreground group-hover:text-accent transition-colors duration-300">{label}</span>
                </a>
              ))}
            </div>
          </div>

          <div className={`${isVisible ? "animate-slide-in-right" : "opacity-0"}`}>
            <div className="glass-card p-10 shadow-2xl shadow-navy/5">
              <h3 className="text-2xl font-display font-semibold text-foreground mb-2">Jetzt Anfrage senden</h3>
              <p className="text-sm text-muted-foreground mb-8">Alle Felder mit * sind Pflichtfelder.</p>
              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" required placeholder="Vorname *" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="w-full px-4 py-3.5 rounded-xl border border-border/50 bg-background/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/30 transition-all placeholder:text-muted-foreground/50" />
                  <input type="text" required placeholder="Nachname *" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className="w-full px-4 py-3.5 rounded-xl border border-border/50 bg-background/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/30 transition-all placeholder:text-muted-foreground/50" />
                </div>
                <input type="email" required placeholder="E-Mail *" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-3.5 rounded-xl border border-border/50 bg-background/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/30 transition-all placeholder:text-muted-foreground/50" />
                <input type="tel" placeholder="Telefon" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-3.5 rounded-xl border border-border/50 bg-background/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/30 transition-all placeholder:text-muted-foreground/50" />
                <select value={formData.rechtsgebiet} onChange={(e) => setFormData({ ...formData, rechtsgebiet: e.target.value })} className="w-full px-4 py-3.5 rounded-xl border border-border/50 bg-background/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/30 transition-all">
                  <option value="">Rechtsgebiet auswählen</option>
                  <option>Familienrecht</option>
                  <option>Arbeitsrecht</option>
                  <option>Vertragsrecht</option>
                  <option>Erbrecht</option>
                  <option>Immobilienrecht</option>
                  <option>Strafrecht</option>
                  <option>Sonstiges</option>
                </select>
                <textarea rows={4} required placeholder="Beschreiben Sie Ihr Anliegen *" value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} className="w-full px-4 py-3.5 rounded-xl border border-border/50 bg-background/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/30 transition-all resize-none placeholder:text-muted-foreground/50" />
                <Button variant="gold" className="w-full rounded-xl group" size="lg" type="submit" disabled={sending}>
                  {sending ? "Wird gesendet..." : "Kostenlose Erstberatung anfordern"}
                  {!sending && <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />}
                </Button>
                <p className="text-[11px] text-muted-foreground/60 text-center">
                  Mit dem Absenden stimmen Sie unserer Datenschutzerklärung zu.
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
