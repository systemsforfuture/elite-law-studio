import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Phone, X } from "lucide-react";

const StickyCta = () => {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 800);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (dismissed || !visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 transition-all duration-500"
      style={{ transform: visible ? "translateY(0)" : "translateY(100%)" }}
    >
      <div className="bg-navy-dark/95 backdrop-blur-xl border-t border-accent/20 py-3 px-6">
        <div className="container mx-auto flex items-center justify-between gap-4">
          <div className="hidden sm:flex items-center gap-3">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400/60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
            </span>
            <span className="text-sm text-primary-foreground/60">
              <strong className="text-primary-foreground">14 Tage kostenlos</strong> testen — keine Kreditkarte
            </span>
          </div>

          <div className="flex items-center gap-3 flex-1 sm:flex-none justify-end">
            <a href="tel:+493012345678" className="hidden md:block">
              <Button variant="hero-outline" size="sm" className="rounded-xl text-xs">
                <Phone className="mr-1.5 h-3 w-3" />
                Sales anrufen
              </Button>
            </a>
            <Link to="/onboarding">
              <Button variant="hero" size="sm" className="rounded-xl text-xs glow-gold group">
                Live-Demo starten
                <ArrowRight className="ml-1.5 h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </Link>
            <button
              onClick={() => setDismissed(true)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-primary-foreground/30 hover:text-primary-foreground/60 hover:bg-white/5 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StickyCta;
