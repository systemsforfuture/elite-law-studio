import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { Shield, Clock, Award, TrendingUp, Lock, HeartHandshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const trustPoints = [
  { icon: Shield, title: "Anwaltsgeheimnis", desc: "Absolute Vertraulichkeit in jedem Fall" },
  { icon: Clock, title: "24h Erreichbarkeit", desc: "Notfall-Hotline für dringende Fälle" },
  { icon: Award, title: "Fachanwälte", desc: "Zertifizierte Spezialisten pro Rechtsgebiet" },
  { icon: TrendingUp, title: "97% Erfolgsquote", desc: "Nachweislich überdurchschnittliche Ergebnisse" },
  { icon: Lock, title: "DSGVO-konform", desc: "Höchste Datenschutzstandards" },
  { icon: HeartHandshake, title: "Persönlich", desc: "Fester Ansprechpartner ab Tag eins" },
];

const TrustSection = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section className="py-32 bg-card relative overflow-hidden">
      <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-accent/[0.03] rounded-full blur-[120px]" />

      <div className="container mx-auto px-6" ref={ref}>
        <div className="grid lg:grid-cols-5 gap-16 items-center">
          <div className="lg:col-span-2">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-accent mb-4">
              <span className="w-8 h-px bg-accent/50" />
              Warum wir
            </span>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mt-3 mb-6">
              Ihr Vorteil mit <span className="text-gradient-gold">Kanzlei Bergmann</span>
            </h2>
            <p className="text-muted-foreground text-lg font-light leading-relaxed mb-8">
              Wir kombinieren juristische Exzellenz mit modernem Service – damit Sie sich auf das Wesentliche konzentrieren können.
            </p>
            <a href="#kontakt">
              <Button variant="gold" className="rounded-2xl group" size="lg">
                Jetzt beraten lassen
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </a>
          </div>

          <div className="lg:col-span-3 grid sm:grid-cols-2 gap-4">
            {trustPoints.map((t, i) => (
              <div
                key={t.title}
                className={`group p-6 rounded-2xl border border-border/50 bg-background/50 backdrop-blur-sm hover:border-accent/20 hover:shadow-xl hover:shadow-accent/[0.05] transition-all duration-500 ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                }`}
                style={{ transitionDelay: `${i * 100}ms`, transitionDuration: "700ms" }}
              >
                <div className="w-12 h-12 rounded-2xl bg-accent/[0.08] flex items-center justify-center mb-4 group-hover:bg-accent/15 transition-colors">
                  <t.icon className="h-5 w-5 text-accent" />
                </div>
                <h4 className="text-sm font-semibold text-foreground mb-1">{t.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
