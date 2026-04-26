import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { CheckCircle2 } from "lucide-react";

const steps = [
  {
    hour: "T+0h",
    title: "Vertragsabschluss",
    detail: "Digital signiert, Setup abgeschlossen, Account erstellt, Support-Kanal offen.",
  },
  {
    hour: "T+2h",
    title: "Welcome-Call",
    detail: "30-Min mit Kanzleiinhaber: Tonalität, Rechtsgebiete, Mandanten-Profil, vorhandene Tools.",
  },
  {
    hour: "T+6h",
    title: "Daten-Import",
    detail: "Bestandsdaten aus RA-MICRO/DATEV/Advoware/Excel. Validierung, Stichproben-Check.",
  },
  {
    hour: "T+12h",
    title: "Voice-Setup",
    detail: "Telefonnummer, Voice-Profil (oder Cloning), Begrüßung, 5 Test-Anrufe gemeinsam.",
  },
  {
    hour: "T+20h",
    title: "Tools-Integration",
    detail: "Google Calendar / Outlook, WhatsApp Business, Email-Inbox, Eskalations-Logik.",
  },
  {
    hour: "T+24h",
    title: "Live",
    detail: "Erste echte Anrufe gehen rein. Permanent-Assisted-Support-Channel offen.",
  },
];

const OnboardingTeaser = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section id="onboarding" className="py-32 bg-navy-dark relative overflow-hidden">
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-accent/[0.04] rounded-full blur-[180px]" />

      <div className="container mx-auto px-6 relative" ref={ref}>
        <div
          className={`text-center mb-16 transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-accent mb-4">
            <span className="w-8 h-px bg-accent/50" />
            Permanent-Assisted-Onboarding
            <span className="w-8 h-px bg-accent/50" />
          </span>
          <h2 className="text-4xl md:text-6xl font-display font-black text-primary-foreground mt-3 mb-5 tracking-[-0.03em]">
            Vertrag bis Live-Anruf in{" "}
            <span className="text-gradient-gold">24 Stunden</span>.
          </h2>
          <p className="text-primary-foreground/40 max-w-2xl mx-auto text-lg font-light">
            Kein generisches SaaS-Onboarding. Persönliche Begleitung von einem
            Customer-Success-Lead durch jeden Schritt.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-accent/20 to-transparent hidden md:block" />
          {steps.map((step, i) => (
            <div
              key={step.hour}
              className={`relative flex flex-col md:flex-row gap-6 mb-8 last:mb-0 transition-all duration-700 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${200 + i * 100}ms` }}
            >
              <div className={`flex-1 ${i % 2 === 0 ? "md:text-right md:pr-12" : "md:order-3 md:pl-12"}`}>
                <div className="glass-dark p-6 inline-block max-w-md">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-accent font-bold mb-2 font-mono">
                    {step.hour}
                  </div>
                  <h3 className="text-lg font-display font-bold text-primary-foreground mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-primary-foreground/50 leading-relaxed">
                    {step.detail}
                  </p>
                </div>
              </div>

              <div className="hidden md:flex md:order-2 w-12 items-center justify-center shrink-0">
                <div className="w-10 h-10 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center backdrop-blur-sm">
                  <CheckCircle2 className="h-4 w-4 text-accent" />
                </div>
              </div>

              <div className="flex-1 hidden md:block" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default OnboardingTeaser;
