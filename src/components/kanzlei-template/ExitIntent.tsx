import { useEffect, useState } from "react";
import { X, Gift, ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "exit-intent-shown";

const ExitIntentPopup = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY)) return;

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !sessionStorage.getItem(STORAGE_KEY)) {
        setOpen(true);
        sessionStorage.setItem(STORAGE_KEY, "1");
      }
    };

    // Mobile fallback: trigger on aggressive scroll-up
    let lastScroll = window.scrollY;
    let upCount = 0;
    const handleScroll = () => {
      const current = window.scrollY;
      if (current < lastScroll - 50 && current < 200) {
        upCount += 1;
        if (upCount >= 2 && !sessionStorage.getItem(STORAGE_KEY)) {
          setOpen(true);
          sessionStorage.setItem(STORAGE_KEY, "1");
        }
      }
      lastScroll = current;
    };

    const timer = setTimeout(() => {
      document.addEventListener("mouseleave", handleMouseLeave);
      window.addEventListener("scroll", handleScroll, { passive: true });
    }, 8000);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in"
      onClick={() => setOpen(false)}
    >
      <div className="absolute inset-0 bg-navy-dark/70 backdrop-blur-md" />

      <div
        className="relative max-w-md w-full glass-card p-10 shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
        style={{ background: "hsl(var(--card))" }}
      >
        <button
          onClick={() => setOpen(false)}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Schließen"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="text-center">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-accent/10 items-center justify-center mb-5 glow-sm-gold">
            <Gift className="h-6 w-6 text-accent" />
          </div>

          <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-accent mb-3">
            <Clock className="h-3 w-3" />
            Letzte Chance
          </span>

          <h3 className="text-2xl font-display font-black text-foreground mb-3 tracking-[-0.02em]">
            Bevor Sie gehen –
            <br />
            <span className="text-gradient-gold">sichern Sie sich Ihre kostenlose Erstberatung</span>
          </h3>

          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            Eine 30-minütige Ersteinschätzung Ihres Falls – komplett kostenlos und unverbindlich.
            Antwort innerhalb von 2 Stunden.
          </p>

          <a href="#kontakt" onClick={() => setOpen(false)}>
            <Button variant="gold" className="w-full rounded-xl group glow-gold" size="lg">
              Jetzt kostenlos sichern
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </a>

          <button
            onClick={() => setOpen(false)}
            className="text-xs text-muted-foreground/60 mt-4 hover:text-foreground transition-colors"
          >
            Nein danke, ich verzichte
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExitIntentPopup;
