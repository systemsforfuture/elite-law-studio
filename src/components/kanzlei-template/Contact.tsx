import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { Button } from "@/components/ui/button";
import { Phone, Mail, MapPin, Clock, ArrowRight, CheckCircle, Shield, Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useCaptureLead } from "@/lib/queries/use-capture-lead";

const ContactSection = () => {
  const { ref, isVisible } = useScrollAnimation();
  const captureLead = useCaptureLead();
  const [formData, setFormData] = useState({ firstName: "", lastName: "", email: "", phone: "", message: "", rechtsgebiet: "" });
  const sending = captureLead.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email.trim()) {
      toast.error("Bitte E-Mail-Adresse angeben");
      return;
    }
    const t = toast.loading("Anfrage wird gesendet…");
    try {
      const result = await captureLead.mutateAsync({
        vorname: formData.firstName || undefined,
        nachname: formData.lastName || undefined,
        email: formData.email.trim(),
        telefon: formData.phone || undefined,
        rechtsgebiet: formData.rechtsgebiet || undefined,
        beschreibung: formData.message || undefined,
        herkunft: "web",
      });
      toast.success("Anfrage angekommen ✓", { id: t, description: result.message });
      setFormData({ firstName: "", lastName: "", email: "", phone: "", message: "", rechtsgebiet: "" });
    } catch (err) {
      toast.error("Senden fehlgeschlagen", {
        id: t,
        description: err instanceof Error ? err.message : "Bitte versuchen Sie es erneut.",
      });
    }
  };

  const inputClass = "w-full px-4 py-3.5 rounded-xl border border-border/50 bg-background/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/30 transition-all duration-300 placeholder:text-muted-foreground/50 hover:border-border";

  return (
    <section id="kontakt" className="py-32 bg-card relative overflow-hidden">
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-accent/[0.03] rounded-full blur-[100px]" />

      <div className="container mx-auto px-6" ref={ref}>
        <div className="grid lg:grid-cols-2 gap-16">
          <div className={`transition-all duration-1000 ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"}`}>
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-accent mb-4">
              <span className="w-8 h-px bg-accent/50" />
              Kontakt
            </span>
            <h2 className="text-4xl md:text-6xl font-display font-black text-foreground mt-3 mb-6 tracking-[-0.03em]">
              Kostenlose{" "}
              <span className="text-gradient-gold">Erstberatung</span>
            </h2>
            <p className="text-muted-foreground mb-8 text-lg font-light">
              Schildern Sie uns Ihr Anliegen – wir melden uns innerhalb von 2 Stunden mit einer ersten Einschätzung.
            </p>

            {/* Trust points with stagger */}
            <div className="space-y-4 mb-12">
              {[
                "Kostenlose und unverbindliche Ersteinschätzung",
                "Antwort innerhalb von 2 Stunden garantiert",
                "Ihre Daten werden streng vertraulich behandelt (DSGVO)",
                "Rechtsschutzversicherung? Wir prüfen die Deckung",
              ].map((item, i) => (
                <div
                  key={item}
                  className={`flex items-start gap-3 transition-all duration-500 ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-6"}`}
                  style={{ transitionDelay: `${400 + i * 100}ms` }}
                >
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
              ].map(({ icon: Icon, label, href }, i) => (
                <a
                  key={label}
                  href={href || "#"}
                  className={`flex items-center gap-4 group transition-all duration-500 ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-6"}`}
                  style={{ transitionDelay: `${800 + i * 80}ms` }}
                >
                  <div className="w-12 h-12 rounded-2xl bg-accent/[0.08] flex items-center justify-center group-hover:bg-accent/15 group-hover:scale-110 transition-all duration-300">
                    <Icon className="h-5 w-5 text-accent" />
                  </div>
                  <span className="text-sm text-foreground group-hover:text-accent transition-colors duration-300">{label}</span>
                </a>
              ))}
            </div>
          </div>

          <div className={`transition-all duration-1000 delay-200 ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10"}`}>
            <div className="glass-card p-10 shadow-2xl shadow-navy/5 relative">
              {/* Urgency badge on form */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent text-accent-foreground text-xs font-semibold shadow-lg shadow-accent/30">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-foreground/60" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent-foreground" />
                  </span>
                  Heute noch Plätze frei
                </div>
              </div>

              <h3 className="text-2xl font-display font-bold text-foreground mb-2 mt-2">Jetzt Anfrage senden</h3>
              <p className="text-sm text-muted-foreground mb-8">Alle Felder mit * sind Pflichtfelder.</p>
              
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" required placeholder="Vorname *" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className={inputClass} />
                  <input type="text" required placeholder="Nachname *" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className={inputClass} />
                </div>
                <input type="email" required placeholder="E-Mail *" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={inputClass} />
                <input type="tel" placeholder="Telefon (für Rückruf)" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className={inputClass} />
                <select value={formData.rechtsgebiet} onChange={(e) => setFormData({ ...formData, rechtsgebiet: e.target.value })} className={inputClass}>
                  <option value="">Rechtsgebiet auswählen</option>
                  <option>Familienrecht</option>
                  <option>Arbeitsrecht</option>
                  <option>Vertragsrecht</option>
                  <option>Erbrecht</option>
                  <option>Immobilienrecht</option>
                  <option>Strafrecht</option>
                  <option>Sonstiges</option>
                </select>
                <textarea rows={4} required placeholder="Beschreiben Sie kurz Ihr Anliegen *" value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} className={`${inputClass} resize-none`} />
                <Button variant="gold" className="w-full rounded-xl group text-base" size="lg" type="submit" disabled={sending}>
                  {sending ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />
                      Wird gesendet...
                    </span>
                  ) : (
                    <>
                      Kostenlose Erstberatung anfordern
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </Button>
              </form>

              {/* Trust signals under CTA */}
              <div className="flex items-center justify-center gap-4 mt-5 text-[11px] text-muted-foreground/60">
                <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> SSL-verschlüsselt</span>
                <span className="flex items-center gap-1"><Star className="h-3 w-3" /> 4.9/5 Bewertung</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
