import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { useMemo, useState } from "react";
import { Calculator, TrendingUp, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const ROICalculator = () => {
  const { ref, isVisible } = useScrollAnimation();
  const [anwaelte, setAnwaelte] = useState(3);
  const [stundensatz, setStundensatz] = useState(280);
  const [verlorene_anrufe, setVerloreneAnrufe] = useState(15);

  const numbers = useMemo(() => {
    // Conservative model:
    // - 22h/Anwalt/Woche Verwaltung -> 35% reduzierbar = 7.7h/Anwalt/Woche
    // - Verlorene Anrufe @ 8% Conversion @ 4500€ Mandantenwert
    const eingesparte_h_jahr = anwaelte * 7.7 * 46; // 46 Arbeitswochen
    const eingespart_eur = Math.round(eingesparte_h_jahr * stundensatz);
    const gewonnene_mandate_jahr = Math.round(verlorene_anrufe * 12 * 0.08);
    const mehrumsatz_eur = gewonnene_mandate_jahr * 4500;
    const platform_kosten_jahr = 990 * 12 + 7900; // Growth tier example
    const netto_roi = eingespart_eur + mehrumsatz_eur - platform_kosten_jahr;
    return {
      eingesparte_h_jahr: Math.round(eingesparte_h_jahr),
      eingespart_eur,
      gewonnene_mandate_jahr,
      mehrumsatz_eur,
      platform_kosten_jahr,
      netto_roi,
    };
  }, [anwaelte, stundensatz, verlorene_anrufe]);

  return (
    <section className="py-32 bg-card relative overflow-hidden">
      <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-accent/[0.05] rounded-full blur-[150px]" />
      <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-emerald-500/[0.04] rounded-full blur-[120px]" />

      <div className="container mx-auto px-6 relative" ref={ref}>
        <div
          className={`text-center mb-12 transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-accent mb-4">
            <Calculator className="h-3 w-3" />
            ROI in 30 Sekunden
          </span>
          <h2 className="text-4xl md:text-5xl font-display font-black text-foreground mt-3 mb-4 tracking-[-0.03em]">
            Was verlieren Sie <span className="text-gradient-gold">jeden Monat</span>?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg font-light">
            Drei Eingaben — wir zeigen Ihnen, was Status quo Sie wirklich
            kostet.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <div className="glass-card p-8 border-border/50">
            <h3 className="text-lg font-display font-bold text-foreground mb-6">
              Ihre Kanzlei
            </h3>

            <div className="space-y-7">
              <div>
                <div className="flex items-baseline justify-between mb-2">
                  <label className="text-sm font-medium text-foreground">
                    Anzahl Anwälte
                  </label>
                  <span className="text-2xl font-display font-bold text-accent tabular-nums">
                    {anwaelte}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={anwaelte}
                  onChange={(e) => setAnwaelte(Number(e.target.value))}
                  className="w-full accent-accent"
                />
              </div>

              <div>
                <div className="flex items-baseline justify-between mb-2">
                  <label className="text-sm font-medium text-foreground">
                    Ø Stundensatz (€)
                  </label>
                  <span className="text-2xl font-display font-bold text-accent tabular-nums">
                    {stundensatz}€
                  </span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="600"
                  step="20"
                  value={stundensatz}
                  onChange={(e) => setStundensatz(Number(e.target.value))}
                  className="w-full accent-accent"
                />
              </div>

              <div>
                <div className="flex items-baseline justify-between mb-2">
                  <label className="text-sm font-medium text-foreground">
                    Verlorene Anrufe / Monat
                  </label>
                  <span className="text-2xl font-display font-bold text-accent tabular-nums">
                    {verlorene_anrufe}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={verlorene_anrufe}
                  onChange={(e) => setVerloreneAnrufe(Number(e.target.value))}
                  className="w-full accent-accent"
                />
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Anrufer in Mailbox / nicht zurückgerufen
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="glass-card p-6 border-accent/20 bg-accent/[0.03]">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                    Zeitersparnis pro Jahr
                  </div>
                  <div className="text-4xl font-display font-black text-foreground tabular-nums">
                    {numbers.eingesparte_h_jahr.toLocaleString("de-DE")}h
                  </div>
                </div>
                <span className="text-2xl font-display font-bold text-emerald-600 tabular-nums">
                  {numbers.eingespart_eur.toLocaleString("de-DE")}€
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                35% weniger Verwaltung pro Anwalt × 46 Arbeitswochen × Ihr
                Stundensatz
              </div>
            </div>

            <div className="glass-card p-6 border-accent/20 bg-accent/[0.03]">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                    Zusätzliche Mandate pro Jahr
                  </div>
                  <div className="text-4xl font-display font-black text-foreground tabular-nums">
                    {numbers.gewonnene_mandate_jahr}
                  </div>
                </div>
                <span className="text-2xl font-display font-bold text-emerald-600 tabular-nums">
                  +{numbers.mehrumsatz_eur.toLocaleString("de-DE")}€
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                Voice-Agent fängt verlorene Anrufe ab. 8% Conversion × 4.500€
                Ø Mandantenwert.
              </div>
            </div>

            <div className="glass-card p-6 border-accent shadow-2xl shadow-accent/10 bg-gradient-to-br from-accent/10 to-transparent">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="h-5 w-5 text-accent" />
                <span className="text-xs uppercase tracking-wider text-accent font-bold">
                  Netto-ROI Jahr 1
                </span>
              </div>
              <div className="text-5xl md:text-6xl font-display font-black text-gradient-gold tabular-nums mb-2">
                {numbers.netto_roi.toLocaleString("de-DE")}€
              </div>
              <div className="text-xs text-muted-foreground mb-4">
                Nach Abzug Plattform-Kosten ({numbers.platform_kosten_jahr.toLocaleString("de-DE")}€/Jahr, Tarif Growth)
              </div>
              <Link to="/onboarding">
                <Button variant="gold" className="w-full rounded-xl glow-sm-gold group" size="lg">
                  Live-Demo starten
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ROICalculator;
