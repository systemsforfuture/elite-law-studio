import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Shield, Award, Users, Star, Phone } from "lucide-react";
import { useCountUp, useScrollAnimation } from "@/hooks/use-scroll-animation";

const HeroSection = () => {
  const { ref, isVisible } = useScrollAnimation(0.1);
  const clients = useCountUp(5000, 2500, true);
  const rate = useCountUp(97, 2000, true);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-navy-dark" ref={ref}>
      {/* Layered gradient background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-dark via-navy to-navy-dark" />
        <div className="absolute top-1/4 -left-32 w-[600px] h-[600px] bg-accent/[0.06] rounded-full blur-[150px] animate-float" />
        <div className="absolute bottom-1/4 right-0 w-[500px] h-[500px] bg-accent/[0.04] rounded-full blur-[120px]" style={{ animation: 'float 8s ease-in-out infinite reverse' }} />
        <div className="absolute top-0 right-1/3 w-[400px] h-[400px] bg-navy-light/10 rounded-full blur-[100px]" />
        {/* Dot grid */}
        <div className="absolute inset-0 opacity-[0.025]" style={{
          backgroundImage: `radial-gradient(hsl(42 80% 55% / 0.5) 1px, transparent 1px)`,
          backgroundSize: '32px 32px'
        }} />
      </div>

      <div className="relative container mx-auto px-4 sm:px-6 pt-28 pb-20 overflow-hidden">
        <div className="max-w-3xl">
          {/* Social proof badge */}
          <div
            className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full border border-accent/20 bg-accent/[0.08] backdrop-blur-sm mb-10 opacity-0"
            style={{ animation: 'blur-in 0.8s ease-out 0.2s forwards' }}
          >
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-3 w-3 fill-accent text-accent" />
              ))}
            </div>
            <span className="text-xs font-medium text-accent/90 tracking-wide">
              4.9/5 · 247 Google Bewertungen
            </span>
          </div>

          {/* Main heading — Apple-style tight tracking */}
          <h1
            className="text-[2.75rem] sm:text-5xl md:text-7xl lg:text-[5.5rem] font-display font-black text-primary-foreground leading-[1.05] tracking-[-0.04em] mb-8 opacity-0 break-words hyphens-auto"
            style={{ animation: 'blur-in 1s ease-out 0.4s forwards' }}
          >
            Ihr Recht.{" "}
            <span className="text-gradient-gold">Unsere Mission.</span>
          </h1>

          {/* Subheading — problem-focused, not generic */}
          <p
            className="text-lg md:text-xl text-primary-foreground/50 leading-relaxed mb-12 max-w-xl font-light opacity-0"
            style={{ animation: 'blur-in 0.8s ease-out 0.6s forwards' }}
          >
            Ob Kündigung, Erbstreit oder Vertragsproblem — wir setzen Ihr Recht durch. 
            Über 5.000 Mandanten vertrauen uns bereits.
          </p>

          {/* Dual CTA — primary + secondary */}
          <div
            className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4 mb-6 opacity-0"
            style={{ animation: 'blur-in 0.8s ease-out 0.8s forwards' }}
          >
            <a href="#kontakt" className="w-full sm:w-auto">
              <Button variant="hero" className="rounded-2xl glow-gold group w-full sm:w-auto">
                Kostenlose Erstberatung
                <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
            </a>
            <a href="tel:+493012345678" className="w-full sm:w-auto">
              <Button variant="hero-outline" className="rounded-2xl group w-full sm:w-auto">
                <Phone className="mr-2 h-4 w-4" />
                Sofort anrufen
              </Button>
            </a>
          </div>

          {/* Risk reversal micro-copy */}
          <p
            className="text-xs text-primary-foreground/30 mb-20 opacity-0 flex flex-wrap items-center gap-x-3 gap-y-1"
            style={{ animation: 'blur-in 0.8s ease-out 0.9s forwards' }}
          >
            <span>Kostenlos</span>
            <span className="w-1 h-1 rounded-full bg-primary-foreground/20" />
            <span>Unverbindlich</span>
            <span className="w-1 h-1 rounded-full bg-primary-foreground/20" />
            <span>Antwort in 2 Stunden</span>
          </p>

          {/* Animated counter stats */}
          <div
            className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:gap-4 opacity-0"
            style={{ animation: 'blur-in 0.8s ease-out 1s forwards' }}
          >
            {[
              { icon: Shield, label: "Diskretion", value: "100%" },
              { icon: Award, label: "Erfolg", value: `${rate}%` },
              { icon: Users, label: "Mandanten", value: `${clients.toLocaleString("de-DE")}+` },
            ].map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="glass-dark px-3 py-3 sm:px-8 sm:py-5 flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-4 group hover:border-accent/20 transition-all duration-500 cursor-default text-center sm:text-left"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors duration-300 shrink-0">
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
                </div>
                <div>
                  <div className="text-base sm:text-2xl font-display font-bold text-primary-foreground tabular-nums leading-tight">{value}</div>
                  <div className="text-[9px] sm:text-[11px] text-primary-foreground/40 uppercase tracking-wider">{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom fade to next section */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default HeroSection;
