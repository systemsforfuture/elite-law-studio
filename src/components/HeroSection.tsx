import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Phone, Sparkles, Star, ShieldCheck } from "lucide-react";
import { useCountUp, useScrollAnimation } from "@/hooks/use-scroll-animation";

const HeroSection = () => {
  const { ref } = useScrollAnimation(0.1);
  const kanzleien = useCountUp(500, 2500, true);
  const stunden = useCountUp(15, 2000, true);
  const setupHours = useCountUp(24, 2000, true);

  return (
    <section
      className="relative min-h-screen flex items-center overflow-hidden bg-navy-dark"
      ref={ref}
    >
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-dark via-navy to-navy-dark" />
        <div className="absolute top-1/4 -left-32 w-[600px] h-[600px] bg-accent/[0.06] rounded-full blur-[150px] animate-float" />
        <div
          className="absolute bottom-1/4 right-0 w-[500px] h-[500px] bg-accent/[0.04] rounded-full blur-[120px]"
          style={{ animation: "float 8s ease-in-out infinite reverse" }}
        />
        <div className="absolute top-0 right-1/3 w-[400px] h-[400px] bg-navy-light/10 rounded-full blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `radial-gradient(hsl(42 80% 55% / 0.5) 1px, transparent 1px)`,
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <div className="relative container mx-auto px-4 sm:px-6 pt-28 pb-20 overflow-hidden">
        <div className="max-w-4xl">
          <div
            className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full border border-accent/20 bg-accent/[0.08] backdrop-blur-sm mb-10 opacity-0"
            style={{ animation: "blur-in 0.8s ease-out 0.2s forwards" }}
          >
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-3 w-3 fill-accent text-accent" />
              ))}
            </div>
            <span className="text-xs font-medium text-accent/90 tracking-wide">
              4.9/5 · 247 Kanzleien · Trustpilot
            </span>
            <span className="w-px h-3 bg-accent/30" />
            <span className="text-xs font-medium text-accent/90 tracking-wide">
              DSGVO · Frankfurt
            </span>
          </div>

          <h1
            className="text-[2.5rem] sm:text-5xl md:text-7xl lg:text-[5.5rem] font-display font-black text-primary-foreground leading-[1.05] tracking-[-0.04em] mb-8 opacity-0 break-words hyphens-auto"
            style={{ animation: "blur-in 1s ease-out 0.4s forwards" }}
          >
            Ihre Kanzlei,
            <br />
            <span className="text-gradient-gold">vollautomatisch.</span>
          </h1>

          <p
            className="text-lg md:text-2xl text-primary-foreground/55 leading-relaxed mb-10 max-w-2xl font-light opacity-0"
            style={{ animation: "blur-in 0.8s ease-out 0.6s forwards" }}
          >
            Voice-Agent, WhatsApp-Inbox, Termin-Koordination, Mahnwesen,
            Dokumenten-KI — eine Plattform, in <strong className="text-primary-foreground">24 Stunden</strong> live.
            White-Label, DSGVO, ohne neuen Mitarbeiter.
          </p>

          <div
            className="flex flex-wrap gap-4 mb-6 opacity-0"
            style={{ animation: "blur-in 0.8s ease-out 0.8s forwards" }}
          >
            <Link to="/onboarding">
              <Button variant="hero" className="rounded-2xl glow-gold group">
                <Sparkles className="mr-2 h-5 w-5" />
                Live-Demo in 30 Sekunden
                <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
            </Link>
            <a href="#preise">
              <Button variant="hero-outline" className="rounded-2xl group">
                <Phone className="mr-2 h-4 w-4" />
                Preise ansehen
              </Button>
            </a>
          </div>

          <p
            className="text-xs text-primary-foreground/30 mb-8 opacity-0 flex flex-wrap items-center gap-x-3 gap-y-1"
            style={{ animation: "blur-in 0.8s ease-out 0.9s forwards" }}
          >
            <span>14 Tage kostenlos testen</span>
            <span className="w-1 h-1 rounded-full bg-primary-foreground/20" />
            <span>Keine Kreditkarte</span>
            <span className="w-1 h-1 rounded-full bg-primary-foreground/20" />
            <span>Setup inklusive</span>
          </p>

          <Link
            to="/template/kanzlei"
            className="group inline-flex items-center gap-3 px-5 py-3 rounded-2xl border border-accent/20 bg-accent/[0.04] hover:border-accent/40 hover:bg-accent/[0.08] transition-all backdrop-blur-sm mb-16 opacity-0"
            style={{ animation: "blur-in 0.8s ease-out 1s forwards" }}
          >
            <span className="text-[10px] uppercase tracking-[0.2em] text-accent font-bold">
              Live-Vorschau
            </span>
            <span className="w-px h-4 bg-accent/30" />
            <span className="text-sm text-primary-foreground/80">
              So sieht <strong className="text-primary-foreground">Ihre White-Label-Funnel-Seite</strong> aus
            </span>
            <ArrowRight className="h-3.5 w-3.5 text-accent transition-transform group-hover:translate-x-1" />
          </Link>

          <div
            className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:gap-4 opacity-0"
            style={{ animation: "blur-in 0.8s ease-out 1s forwards" }}
          >
            {[
              { icon: ShieldCheck, label: "Setup", value: `${setupHours}h` },
              { icon: Sparkles, label: "Pro Woche", value: `${stunden}h` },
              {
                icon: Star,
                label: "Kanzleien",
                value: `${kanzleien.toLocaleString("de-DE")}+`,
              },
            ].map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="glass-dark px-3 py-3 sm:px-8 sm:py-5 flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-4 group hover:border-accent/20 transition-all duration-500 cursor-default text-center sm:text-left"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors duration-300 shrink-0">
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
                </div>
                <div>
                  <div className="text-base sm:text-2xl font-display font-bold text-primary-foreground tabular-nums leading-tight">
                    {value}
                  </div>
                  <div className="text-[9px] sm:text-[11px] text-primary-foreground/40 uppercase tracking-wider">
                    {label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default HeroSection;
