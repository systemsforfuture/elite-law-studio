import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Shield, Award, Users } from "lucide-react";

const HeroSection = () => (
  <section className="relative min-h-screen flex items-center overflow-hidden bg-navy-dark">
    {/* Animated gradient background */}
    <div className="absolute inset-0">
      <div className="absolute inset-0 bg-gradient-to-br from-navy-dark via-navy to-navy-dark" />
      {/* Subtle radial orbs */}
      <div className="absolute top-1/4 -left-32 w-[500px] h-[500px] bg-accent/[0.07] rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] bg-accent/[0.05] rounded-full blur-[100px]" />
      <div className="absolute top-0 right-1/3 w-[300px] h-[300px] bg-navy-light/20 rounded-full blur-[80px]" />
      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `linear-gradient(hsl(42 80% 55% / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(42 80% 55% / 0.3) 1px, transparent 1px)`,
        backgroundSize: '60px 60px'
      }} />
    </div>

    <div className="relative container mx-auto px-6 pt-28 pb-20">
      <div className="max-w-3xl">
        {/* Badge */}
        <div
          className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full border border-accent/20 bg-accent/[0.08] backdrop-blur-sm mb-10 opacity-0"
          style={{ animation: 'blur-in 0.8s ease-out 0.2s forwards' }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          <span className="text-xs font-medium text-accent/90 tracking-wider uppercase">
            Seit 1998 · Über 5.000 erfolgreiche Mandate
          </span>
        </div>

        {/* Heading */}
        <h1
          className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold text-primary-foreground leading-[1.05] mb-8 opacity-0"
          style={{ animation: 'blur-in 1s ease-out 0.4s forwards' }}
        >
          Ihr Recht.{" "}
          <span className="text-gradient-gold">Unsere Mission.</span>
        </h1>

        {/* Subtitle */}
        <p
          className="text-lg md:text-xl text-primary-foreground/50 leading-relaxed mb-12 max-w-xl font-light opacity-0"
          style={{ animation: 'blur-in 0.8s ease-out 0.6s forwards' }}
        >
          Kompetente Rechtsberatung mit persönlichem Engagement. Wir stehen an Ihrer Seite – 
          diskret, engagiert und erfolgsorientiert.
        </p>

        {/* CTAs */}
        <div
          className="flex flex-wrap gap-4 mb-20 opacity-0"
          style={{ animation: 'blur-in 0.8s ease-out 0.8s forwards' }}
        >
          <Link to="/login">
            <Button variant="hero" className="rounded-2xl glow-gold group">
              Mandanten-Portal
              <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
            </Button>
          </Link>
          <a href="#kontakt">
            <Button variant="hero-outline" className="rounded-2xl">
              Erstberatung vereinbaren
            </Button>
          </a>
        </div>

        {/* Stats - glass cards */}
        <div
          className="flex flex-wrap gap-4 opacity-0"
          style={{ animation: 'blur-in 0.8s ease-out 1s forwards' }}
        >
          {[
            { icon: Shield, label: "Diskretion", value: "100%" },
            { icon: Award, label: "Erfolgsquote", value: "97%" },
            { icon: Users, label: "Mandanten", value: "5.000+" },
          ].map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="glass-dark px-8 py-5 flex items-center gap-4 group hover:border-accent/20 transition-all duration-500"
            >
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors duration-300">
                <Icon className="h-5 w-5 text-accent" />
              </div>
              <div>
                <div className="text-2xl font-serif font-bold text-primary-foreground">{value}</div>
                <div className="text-[11px] text-primary-foreground/40 uppercase tracking-wider">{label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Bottom gradient fade */}
    <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
  </section>
);

export default HeroSection;
