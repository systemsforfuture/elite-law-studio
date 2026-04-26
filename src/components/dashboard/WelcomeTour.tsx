import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ArrowRight,
  Phone,
  Inbox,
  Brain,
  DatabaseZap,
  Sparkles,
  Cpu,
  Check,
  type LucideIcon,
} from "lucide-react";
import { useTenant } from "@/contexts/TenantContext";

const STORAGE_KEY = "systems-welcome-tour-completed";

interface Step {
  icon: LucideIcon;
  title: string;
  body: string;
  cta?: { label: string; to: string };
}

const buildSteps = (kanzlei: string): Step[] => [
  {
    icon: Cpu,
    title: `Willkommen bei SYSTEMS™, ${kanzlei}.`,
    body: "Ihre Plattform ist live. Ein kurzer Rundgang durch die wichtigsten Module — danach können Sie direkt loslegen.",
  },
  {
    icon: Phone,
    title: "Voice-Agent: 24/7 Anrufannahme",
    body: "Ihre KI-Empfangskraft beantwortet jeden Anruf, qualifiziert Mandanten und bucht Termine. Bei Notfall oder juristischer Frage eskaliert sie sofort an Sie. Tonalität + Begrüßung anpassen unter /dashboard/branding.",
    cta: { label: "Voice-Agent öffnen", to: "/dashboard/voice" },
  },
  {
    icon: Inbox,
    title: "Inbox: Email + WhatsApp KI-Triage",
    body: "Eingehende Mails werden automatisch kategorisiert. KI schlägt eine Antwort vor — Sie übernehmen mit einem Klick oder lassen es eskalieren.",
    cta: { label: "Inbox öffnen", to: "/dashboard/inbox" },
  },
  {
    icon: Brain,
    title: "Strategie-Generator pro Akte",
    body: "Klicken Sie in jeder Akte auf den »KI-Strategie«-Tab. Sie bekommen Sachverhalt, rechtliche Einordnung, Risikobewertung, Handlungsoptionen und Schriftsatz-Skizze — und können iterativ verfeinern.",
    cta: { label: "Akten öffnen", to: "/dashboard/akten" },
  },
  {
    icon: DatabaseZap,
    title: "Daten-Import in 30 Minuten",
    body: "Excel, CSV, RA-MICRO, DATEV oder Advoware — KI mapped die Spalten automatisch, Bulk-Insert in Batches. Ihre Bestandsmandanten sind in einem Vormittag drin.",
    cta: { label: "Import starten", to: "/dashboard/import" },
  },
  {
    icon: Sparkles,
    title: "Schnell-Tipp: ⌘K",
    body: "Drücken Sie überall ⌘K (oder Strg+K) für die Command-Palette: globale Suche, Schnell-Aktionen, Navigation. Alles in einem Tastendruck.",
  },
];

const WelcomeTour = () => {
  const { tenant } = useTenant();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      // Slight delay so dashboard renders first
      const t = setTimeout(() => setOpen(true), 600);
      return () => clearTimeout(t);
    }
  }, []);

  const steps = buildSteps(tenant.inhaber_name?.split(" ").pop() ?? tenant.kanzlei_name);
  const current = steps[step];
  const isLast = step === steps.length - 1;
  const Icon = current.icon;

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    setOpen(false);
  };

  const handleCtaNavigate = () => {
    if (current.cta) {
      handleClose();
      navigate(current.cta.to);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-accent/15 flex items-center justify-center">
              <Icon className="h-5 w-5 text-accent" />
            </div>
            <div className="flex-1">
              <div className="text-[10px] uppercase tracking-wider text-accent font-bold">
                Schritt {step + 1} von {steps.length}
              </div>
            </div>
          </div>
          <DialogTitle className="text-xl">{current.title}</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed pt-1">
            {current.body}
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-1.5 my-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= step ? "bg-accent" : "bg-muted"
              }`}
            />
          ))}
        </div>

        <DialogFooter className="gap-2 sm:gap-2 sm:flex-row sm:justify-between">
          <Button
            variant="ghost"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
          >
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
            Zurück
          </Button>
          <div className="flex items-center gap-2">
            {current.cta && (
              <Button variant="outline" onClick={handleCtaNavigate}>
                {current.cta.label}
              </Button>
            )}
            {isLast ? (
              <Button variant="gold" onClick={handleClose}>
                <Check className="mr-1.5 h-3.5 w-3.5" />
                Loslegen
              </Button>
            ) : (
              <Button variant="gold" onClick={() => setStep((s) => s + 1)}>
                Weiter
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeTour;
