import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Zap, Crown } from "lucide-react";
import { Link } from "react-router-dom";

const tiers = [
  {
    icon: Sparkles,
    name: "Foundation",
    pitch: "Solo-Anwälte und kleine Kanzleien",
    setup: 3900,
    monthly: 490,
    accentClass: "border-border/50",
    badge: null,
    bullets: [
      "Voice-Agent Standard",
      "WhatsApp Inbox",
      "Email Inbox",
      "Bis 500 Mandanten",
      "Daten-Import (RA-MICRO/DATEV/Excel)",
      "Email-Support",
    ],
    notIncluded: [
      "Voice-Cloning",
      "Termin-Koordination",
      "Mahnwesen-Modul",
      "Custom Domain",
    ],
    cta: "Foundation starten",
    href: "/onboarding?tier=foundation",
  },
  {
    icon: Zap,
    name: "Growth",
    pitch: "Wachsende Kanzleien — empfohlen",
    setup: 7900,
    monthly: 990,
    accentClass: "border-accent shadow-2xl shadow-accent/20",
    badge: "Beliebteste Wahl",
    bullets: [
      "Alles aus Foundation",
      "Voice-Cloning Premium",
      "Termin-Koordination + Wiedervorlage",
      "Bis 2.000 Mandanten",
      "Custom Branding",
      "Priority Support 4h SLA",
    ],
    notIncluded: ["Eigene Domain", "Mahnwesen-Modul", "Dedicated CSM"],
    cta: "Growth starten",
    href: "/onboarding?tier=growth",
  },
  {
    icon: Crown,
    name: "Premium",
    pitch: "Mehr-Standorte und Premium-Praxen",
    setup: 14900,
    monthly: 1890,
    accentClass: "border-border/50",
    badge: null,
    bullets: [
      "Alles aus Growth",
      "Eigene Domain + Voice",
      "Multi-Standort",
      "Unbegrenzte Mandanten",
      "Mahnwesen-Modul (alle Stufen)",
      "Dedicated Customer Success Manager",
    ],
    notIncluded: [],
    cta: "Premium anfragen",
    href: "/onboarding?tier=premium",
  },
];

const PricingSection = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section id="preise" className="py-32 bg-background relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/[0.04] rounded-full blur-[180px]" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-navy/[0.03] rounded-full blur-[150px]" />

      <div className="container mx-auto px-6 relative" ref={ref}>
        <div
          className={`text-center mb-16 transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-accent mb-4">
            <span className="w-8 h-px bg-accent/50" />
            Setup einmalig + monatlich
            <span className="w-8 h-px bg-accent/50" />
          </span>
          <h2 className="text-4xl md:text-6xl font-display font-black text-foreground mt-3 mb-5 tracking-[-0.03em]">
            Drei Tarife. <span className="text-gradient-gold">Premium-Preis</span> für Premium-Kanzleien.
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg font-light">
            Setup-Fee einmalig, Subscription monatlich. Inklusive
            Permanent-Assisted-Onboarding. Vapi-Telefonie wird nach Verbrauch
            abgerechnet (~€60–240/Monat je nach Volumen).
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {tiers.map((t, i) => (
            <div
              key={t.name}
              className={`relative p-8 rounded-3xl border ${t.accentClass} bg-card/60 backdrop-blur-sm transition-all duration-700 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              } ${t.badge ? "lg:-translate-y-4" : ""}`}
              style={{ transitionDelay: `${200 + i * 120}ms` }}
            >
              {t.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-accent text-accent-foreground text-[10px] font-bold uppercase tracking-[0.2em] shadow-lg">
                  {t.badge}
                </div>
              )}

              <div className="flex items-center gap-3 mb-6">
                <div className="w-11 h-11 rounded-2xl bg-accent/10 flex items-center justify-center">
                  <t.icon className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h3 className="text-xl font-display font-bold text-foreground">
                    {t.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">{t.pitch}</p>
                </div>
              </div>

              <div className="mb-6 pb-6 border-b border-border/50">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-5xl font-display font-black text-foreground tabular-nums">
                    {t.setup.toLocaleString("de-DE")}€
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Setup einmalig
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-display font-bold text-accent tabular-nums">
                    +{t.monthly}€
                  </span>
                  <span className="text-sm text-muted-foreground">/Monat</span>
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                {t.bullets.map((b) => (
                  <li
                    key={b}
                    className="flex items-start gap-3 text-sm text-foreground"
                  >
                    <div className="w-5 h-5 rounded-full bg-accent/15 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="h-3 w-3 text-accent" />
                    </div>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>

              {t.notIncluded.length > 0 && (
                <ul className="space-y-2 mb-6 opacity-50">
                  {t.notIncluded.map((b) => (
                    <li
                      key={b}
                      className="flex items-start gap-3 text-sm text-muted-foreground line-through"
                    >
                      <span className="w-5 h-5 shrink-0" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              )}

              <Link to={t.href}>
                <Button
                  variant={t.badge ? "gold" : "outline"}
                  className={`w-full rounded-xl ${t.badge ? "glow-sm-gold" : ""}`}
                  size="lg"
                >
                  {t.cta}
                </Button>
              </Link>

              <p className="text-xs text-muted-foreground/60 mt-4 text-center">
                Live in 24h · DSGVO · Frankfurt-Hosting
              </p>
            </div>
          ))}
        </div>

        <div
          className={`text-center mt-12 transition-all duration-1000 ${
            isVisible ? "opacity-100" : "opacity-0"
          }`}
          style={{ transitionDelay: "800ms" }}
        >
          <p className="text-sm text-muted-foreground">
            Sie wollen es zuerst sehen?{" "}
            <Link to="/onboarding" className="text-accent font-medium hover:text-gold-dark">
              30-Sekunden Live-Demo
            </Link>{" "}
            · oder{" "}
            <a
              href="#contact"
              className="text-accent font-medium hover:text-gold-dark"
            >
              Beratungstermin buchen
            </a>
          </p>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
