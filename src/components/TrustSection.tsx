import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { Shield, Clock, Award, TrendingUp, Lock, HeartHandshake, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const trustPoints = [
  { icon: Shield, title: "Berufsgeheimnis-konform", desc: "§43e BRAO erlaubt Cloud-Nutzung explizit" },
  { icon: Lock, title: "Verschlüsselung pro Tenant", desc: "AES-256 at-Rest, eigener KMS-Schlüssel" },
  { icon: Award, title: "Multi-Tenant Postgres RLS", desc: "Drei unabhängige Isolations-Layer" },
  { icon: TrendingUp, title: "Permanent-Assisted-Onboarding", desc: "Customer-Success-Lead von Tag 1" },
  { icon: Clock, title: "Hosting in Deutschland", desc: "Frankfurt am Main · keine US-Server" },
  { icon: HeartHandshake, title: "Beschlagnahmefreiheit", desc: "Keine Behörde bekommt direkten Zugriff" },
];

const TrustSection = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section className="py-32 bg-card relative overflow-hidden">
      <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-accent/[0.03] rounded-full blur-[120px]" />

      <div className="container mx-auto px-6" ref={ref}>
        <div className="grid lg:grid-cols-5 gap-16 items-center">
          <div className={`lg:col-span-2 transition-all duration-1000 ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"}`}>
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-accent mb-4">
              <span className="w-8 h-px bg-accent/50" />
              Sicherheit & Compliance
            </span>
            <h2 className="text-4xl md:text-5xl font-display font-black text-foreground mt-3 mb-6 tracking-[-0.03em]">
              Anwalts-tauglich. <span className="text-gradient-gold">Vom ersten Tag an.</span>
            </h2>
            <p className="text-muted-foreground text-lg font-light leading-relaxed mb-8">
              Berufsgeheimnis ist nicht verhandelbar. Deshalb haben wir die
              Plattform von Anfang an mit drei unabhängigen Sicherheitslayern
              gebaut. Audit-Log, Verschlüsselung pro Tenant, EU-Hosting.
            </p>
            <a href="#contact">
              <Button variant="gold" className="rounded-2xl group" size="lg">
                Auftragsverarbeitungs-Vertrag ansehen
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </a>
          </div>

          <div className="lg:col-span-3 grid sm:grid-cols-2 gap-4">
            {trustPoints.map((t, i) => (
              <div
                key={t.title}
                className={`group p-6 rounded-2xl border border-border/50 bg-background/50 backdrop-blur-sm hover:border-accent/20 hover:shadow-xl hover:shadow-accent/[0.05] transition-all duration-700 ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: `${300 + i * 100}ms` }}
              >
                <div className="w-12 h-12 rounded-2xl bg-accent/[0.08] flex items-center justify-center mb-4 group-hover:bg-accent/15 group-hover:scale-110 transition-all duration-300">
                  <t.icon className="h-5 w-5 text-accent" />
                </div>
                <h4 className="text-sm font-bold text-foreground mb-1">{t.title}</h4>
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
