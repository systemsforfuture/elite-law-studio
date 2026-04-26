import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { Link } from "react-router-dom";
import {
  Phone,
  MessagesSquare,
  CalendarClock,
  FileSearch,
  Receipt,
  Sparkles,
  ArrowUpRight,
  ArrowRight,
} from "lucide-react";

const modules = [
  {
    icon: Phone,
    title: "Voice-Agent 24/7",
    tagline: "Anrufe annehmen, qualifizieren, Termine buchen",
    detail:
      "Eigene KI-Stimme der Kanzlei. Nimmt jeden Anruf an, identifiziert Anliegen, bucht Termine im Kalender, eskaliert Notfälle an den zuständigen Anwalt.",
    bullets: [
      "Eigene Telefonnummer pro Kanzlei",
      "Voice-Cloning für Premium-Tier",
      "Google Calendar / Outlook synchronisiert",
      "Eskalations-Logik konfigurierbar",
    ],
    accent: "from-accent/30 to-accent/10",
    badge: "VAPI · CLAUDE",
  },
  {
    icon: MessagesSquare,
    title: "WhatsApp & Email Inbox",
    tagline: "Eigenständig, eskaliert nur juristische Fragen",
    detail:
      "Sortiert eingehende Mails (Mandant/Behörde/Werbung/Spam), antwortet auf Standardfragen, schickt Termin-Links. WhatsApp-Conversationalist mit Krisen-Erkennung im Familienrecht.",
    bullets: [
      "360dialog WhatsApp Business API",
      "Resend Inbound Email",
      "Tonalität pro Kanzlei einstellbar",
      "Confidence-Threshold = Auto-Eskalation",
    ],
    accent: "from-emerald-500/30 to-emerald-500/10",
    badge: "360DIALOG · RESEND",
  },
  {
    icon: CalendarClock,
    title: "Termin-Koordination",
    tagline: "Wiedervorlage, Fristen, automatische Erinnerungen",
    detail:
      "Mandanten buchen verfügbare Slots selbst. Fristenkontrolle warnt vor Verjährung. Erinnerungen 24h und 1h vorher reduzieren No-Shows um 80%.",
    bullets: [
      "Konfliktfreie Slot-Vorschläge",
      "Fristenkontrolle mit Eskalations-Stufen",
      "ICS-Export für Mandanten",
      "Re-Scheduling automatisch",
    ],
    accent: "from-sky-400/30 to-sky-400/10",
    badge: "GOOGLE · OUTLOOK",
  },
  {
    icon: FileSearch,
    title: "Dokumenten-Pipeline",
    tagline: "Mandant lädt hoch — KI ordnet zu, extrahiert, fordert nach",
    detail:
      "Vertragsparteien, Fristen, kritische Klauseln werden automatisch extrahiert. Risikobewertung pro Klausel. Fehlende Dokumente werden automatisch beim Mandanten nachgefordert.",
    bullets: [
      "Vision-fähige Klausel-Analyse",
      "Risiko-Scoring (low/med/high)",
      "Fristen-Extraktion automatisch",
      "DSGVO-konform verschlüsselt at Rest",
    ],
    accent: "from-purple-400/30 to-purple-400/10",
    badge: "CLAUDE VISION",
  },
  {
    icon: Receipt,
    title: "Mahnwesen",
    tagline: "Eskalations-Stufen bis zum gerichtlichen Mahnverfahren",
    detail:
      "Drei Mahnstufen mit korrekten juristischen Formulierungen. Stufe 4 übergibt automatisch ans gerichtliche Mahnverfahren. Bezahlte Rechnungen werden via PSP-Webhook geclosed.",
    bullets: [
      "Stufe 1–3 vollautomatisch",
      "Vorlage gerichtl. Mahnverfahren",
      "Stripe / Mollie Payment-Webhooks",
      "DATEV-Export ein-Klick",
    ],
    accent: "from-amber-400/30 to-amber-400/10",
    badge: "DATEV · STRIPE",
  },
  {
    icon: Sparkles,
    title: "Lead-Funnel + White-Label",
    tagline: "Eigene Domain, eigenes Branding, Marketing-tauglich",
    detail:
      "Diese Seite hier — bekommt Ihre Kanzlei white-label unter eigener Domain. Mit Hero, Funnel, Trust-Elementen, Online-Buchung. Werbung kann direkt drauf laufen.",
    bullets: [
      "Custom Domain (kanzlei-meier.de)",
      "Logo, Farben, Voice-ID konfigurierbar",
      "Lead-Capture → CRM automatisch",
      "Google Ads / Meta Ads kompatibel",
    ],
    accent: "from-rose-400/30 to-rose-400/10",
    badge: "WHITE-LABEL",
  },
];

const ModulesSection = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section id="module" className="py-32 bg-background relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/[0.04] rounded-full blur-[150px]" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-navy/[0.03] rounded-full blur-[120px]" />

      <div className="container mx-auto px-6 relative" ref={ref}>
        <div
          className={`text-center mb-20 transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-accent mb-4">
            <span className="w-8 h-px bg-accent/50" />
            6 Module · 1 Plattform
            <span className="w-8 h-px bg-accent/50" />
          </span>
          <h2 className="text-4xl md:text-6xl font-display font-black text-foreground mt-3 mb-5 tracking-[-0.03em]">
            Alles, was Ihre Kanzlei <span className="text-gradient-gold">nie wieder</span> manuell tun muss.
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg font-light">
            Sechs in­einander­greifende Module. Eine zentrale Plattform. Vom
            Erstanruf bis zur bezahlten Rechnung — vollständig automatisiert,
            wo es geht. Eskalation an den Anwalt, wo es muss.
          </p>
        </div>

        <div className="mb-10 flex justify-center">
          <Link
            to="/template/kanzlei"
            className="group inline-flex items-center gap-3 px-6 py-4 rounded-2xl border border-accent/30 bg-accent/[0.04] hover:bg-accent/[0.08] hover:border-accent/50 transition-all"
          >
            <Sparkles className="h-5 w-5 text-accent" />
            <div className="text-left">
              <div className="text-[10px] uppercase tracking-[0.2em] text-accent font-bold">
                Live-Vorschau
              </div>
              <div className="text-sm font-semibold text-foreground">
                Funnel-Template für Kanzleien — sehen Sie 1:1 Ihre eigene Seite
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-accent transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {modules.map((m, i) => (
            <div
              key={m.title}
              className={`group relative p-8 rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm hover:bg-card hover:border-accent/30 hover:shadow-2xl hover:shadow-accent/[0.08] transition-all duration-700 cursor-default ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
              style={{ transitionDelay: `${200 + i * 80}ms` }}
            >
              <div className="flex items-start justify-between mb-6">
                <div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${m.accent} flex items-center justify-center group-hover:scale-110 transition-all duration-500`}
                >
                  <m.icon className="h-6 w-6 text-accent" />
                </div>
                <span className="text-[10px] font-mono font-semibold tracking-[0.2em] text-muted-foreground/50">
                  {m.badge}
                </span>
              </div>
              <h3 className="text-xl font-display font-bold text-foreground mb-2 group-hover:text-accent transition-colors duration-300">
                {m.title}
              </h3>
              <p className="text-xs uppercase tracking-wider text-accent/80 font-semibold mb-4">
                {m.tagline}
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                {m.detail}
              </p>
              <ul className="space-y-2 pt-4 border-t border-border/30">
                {m.bullets.map((b) => (
                  <li
                    key={b}
                    className="flex items-start gap-2 text-xs text-muted-foreground"
                  >
                    <ArrowUpRight className="h-3.5 w-3.5 text-accent shrink-0 mt-0.5" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ModulesSection;
