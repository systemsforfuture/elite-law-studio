import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Shield, Award, Users } from "lucide-react";
import heroImage from "@/assets/hero-law.jpg";

const HeroSection = () => (
  <section className="relative min-h-screen flex items-center overflow-hidden">
    <div className="absolute inset-0">
      <img src={heroImage} alt="Kanzlei" className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-r from-navy-dark/95 via-navy/85 to-navy/60" />
    </div>

    <div className="relative container mx-auto px-6 pt-20">
      <div className="max-w-2xl">
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-accent/30 bg-accent/10 mb-8 opacity-0 animate-fade-in"
          style={{ animationDelay: "0.2s" }}
        >
          <Shield className="h-4 w-4 text-accent" />
          <span className="text-xs font-medium text-accent tracking-wider uppercase">
            Seit 1998 · Über 5.000 erfolgreiche Mandate
          </span>
        </div>

        <h1
          className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-primary-foreground leading-tight mb-6 opacity-0 animate-fade-in-up"
          style={{ animationDelay: "0.4s" }}
        >
          Ihr Recht.{" "}
          <span className="text-accent">Unsere Mission.</span>
        </h1>

        <p
          className="text-lg md:text-xl text-primary-foreground/70 leading-relaxed mb-10 max-w-xl opacity-0 animate-fade-in-up"
          style={{ animationDelay: "0.6s" }}
        >
          Kompetente Rechtsberatung mit persönlichem Engagement. Wir stehen an Ihrer Seite – 
          diskret, engagiert und erfolgsorientiert.
        </p>

        <div
          className="flex flex-wrap gap-4 mb-16 opacity-0 animate-fade-in-up"
          style={{ animationDelay: "0.8s" }}
        >
          <Link to="/login">
            <Button variant="hero">
              Mandanten-Portal
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <a href="#kontakt">
            <Button variant="hero-outline">
              Erstberatung vereinbaren
            </Button>
          </a>
        </div>

        <div
          className="grid grid-cols-3 gap-8 max-w-md opacity-0 animate-fade-in-up"
          style={{ animationDelay: "1s" }}
        >
          {[
            { icon: Shield, label: "Diskretion", value: "100%" },
            { icon: Award, label: "Erfolgsquote", value: "97%" },
            { icon: Users, label: "Mandanten", value: "5.000+" },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="text-center">
              <Icon className="h-5 w-5 text-accent mx-auto mb-2" />
              <div className="text-2xl font-serif font-bold text-primary-foreground">{value}</div>
              <div className="text-xs text-primary-foreground/50 uppercase tracking-wider">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default HeroSection;
