import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, X, Eye } from "lucide-react";

/**
 * Banner an der Spitze der White-Label-Funnel-Vorschau.
 * Erklärt Anwälten in 1 Satz: "Das wird DEINE Funnel-Seite".
 * Dismissbar pro Session.
 */
const DemoBanner = () => {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setDismissed(sessionStorage.getItem("demo-banner-dismissed") === "1");
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem("demo-banner-dismissed", "1");
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <div className="sticky top-0 z-[60] w-full bg-gradient-to-r from-navy-dark via-navy to-navy-dark border-b border-accent/30 shadow-[0_4px_24px_rgba(0,0,0,0.25)]">
      <div className="container mx-auto px-3 sm:px-6 py-2.5 sm:py-3">
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Pulsierender Demo-Indikator */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent/70" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
            </span>
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-accent">
              Live-Demo
            </span>
          </div>

          <div className="hidden sm:block w-px h-5 bg-accent/30 shrink-0" />

          {/* Mobile Icon */}
          <div className="sm:hidden w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center shrink-0">
            <Eye className="h-4 w-4 text-accent" />
          </div>

          {/* Botschaft */}
          <div className="flex-1 min-w-0">
            <p className="text-[12px] sm:text-sm text-primary-foreground leading-snug">
              <strong className="font-semibold">So sieht Ihre Funnel-Seite aus.</strong>{" "}
              <span className="hidden sm:inline text-primary-foreground/70">
                Komplett auf Ihre Kanzlei angepasst (Logo, Farben, Texte) — bringt qualifizierte Mandantenanfragen über performante Werbung.
              </span>
              <span className="sm:hidden text-primary-foreground/70">
                Komplett auf Ihre Kanzlei angepasst.
              </span>
            </p>
          </div>

          {/* CTA */}
          <Link
            to="/onboarding"
            className="hidden md:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent text-navy-dark font-semibold text-xs hover:bg-accent/90 transition-all shrink-0 shadow-lg shadow-accent/20"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Diese Seite für meine Kanzlei
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            to="/onboarding"
            className="md:hidden inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-accent text-navy-dark font-semibold text-[11px] shrink-0"
          >
            Anfragen
            <ArrowRight className="h-3 w-3" />
          </Link>

          <button
            onClick={handleDismiss}
            aria-label="Banner schließen"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-primary-foreground/40 hover:text-primary-foreground/80 hover:bg-white/5 transition-colors shrink-0"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DemoBanner;
