import { useScrollAnimation, useCountUp } from "@/hooks/use-scroll-animation";
import { CheckCircle } from "lucide-react";

const AboutSection = () => {
  const { ref, isVisible } = useScrollAnimation();
  const kanzleien = useCountUp(500, 2500, isVisible);
  const mandanten = useCountUp(180000, 2500, isVisible);
  const uptime = useCountUp(99, 2000, isVisible);

  return (
    <section id="ueber-uns" className="py-32 bg-card relative overflow-hidden">
      <div className="absolute top-1/2 left-0 w-[500px] h-[500px] -translate-y-1/2 bg-accent/[0.02] rounded-full blur-[120px]" />

      <div className="container mx-auto px-6" ref={ref}>
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <div
            className={`transition-all duration-1000 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"
            }`}
          >
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-accent mb-4">
              <span className="w-8 h-px bg-accent/50" />
              Über SYSTEMS
            </span>
            <h2 className="text-4xl md:text-6xl font-display font-black text-foreground mt-3 mb-8 tracking-[-0.03em]">
              Infrastruktur für die{" "}
              <span className="text-gradient-gold">Kanzlei der nächsten Generation.</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-10 text-lg font-light">
              Wir bauen keine generische SaaS. Wir bauen die spezialisierte
              Plattform für Anwaltskanzleien — auf den deutschen Rechtsalltag,
              das deutsche Berufsrecht und die deutsche DSGVO zugeschnitten.
              Persönliche Begleitung, deutsches Hosting, deutsches Team.
            </p>

            <div className="space-y-5">
              {[
                "Hosting ausschließlich in Frankfurt am Main",
                "Eigene SYSTEMS-Sprach-KI für deutsches Recht trainiert",
                "Verschlüsselung pro Kanzlei mit individuellem Schlüssel",
                "Engineering- & Support-Team in Deutschland",
              ].map((item, i) => (
                <div
                  key={item}
                  className={`flex items-start gap-4 group transition-all duration-500 ${
                    isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-6"
                  }`}
                  style={{ transitionDelay: `${600 + i * 100}ms` }}
                >
                  <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-accent/20 group-hover:scale-110 transition-all duration-300">
                    <CheckCircle className="h-4 w-4 text-accent" />
                  </div>
                  <span className="text-sm text-foreground/80">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div
            className={`transition-all duration-1000 delay-300 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10"
            }`}
          >
            <div className="relative">
              <div className="glass-dark p-12 text-primary-foreground relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-accent/[0.08] rounded-full blur-[60px]" />

                <div className="relative">
                  <div className="text-7xl font-display font-black text-gradient-gold mb-2 tabular-nums">
                    {kanzleien}+
                  </div>
                  <div className="text-sm text-primary-foreground/40 uppercase tracking-[0.2em] mb-10">
                    Kanzleien live
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    {[
                      { value: `${mandanten.toLocaleString("de-DE")}+`, label: "Mandanten in DB" },
                      { value: `${uptime}.97%`, label: "Uptime" },
                      { value: "24h", label: "Time-to-Live" },
                      { value: "EU", label: "Hosting only" },
                    ].map(({ value, label }) => (
                      <div key={label} className="group">
                        <div className="text-3xl font-display font-bold text-primary-foreground group-hover:text-accent transition-colors duration-300 tabular-nums">
                          {value}
                        </div>
                        <div className="text-xs text-primary-foreground/30 uppercase tracking-wider mt-1">
                          {label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-3 -right-3 w-full h-full rounded-2xl border border-accent/10 -z-10" />
              <div className="absolute -bottom-6 -right-6 w-full h-full rounded-2xl border border-accent/5 -z-10" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
