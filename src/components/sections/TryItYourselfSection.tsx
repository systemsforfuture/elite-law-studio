// SYSTEMS™ — Marketing-Section »3 Demos ohne Anmeldung«
//
// Boss-Feedback: »Niemand hat Bock seine ganze Kanzlei zu onboarden
// nur um sich das anzuschauen.« Diese Section beseitigt die
// Hürde: 3 große Cards, jede ein Klick = Live-Demo.
//
//   1. Kanzlei-Webseite (was Mandanten sehen)
//   2. Anwalts-Dashboard (Mock-Tenant)
//   3. Mandanten-Portal (Mock-Mandant)
//
// Alle 3 öffnen in neuem Tab — der Lead bleibt auf der Sales-Page.

import { ArrowUpRight, Globe, LayoutDashboard, User } from "lucide-react";

interface Demo {
  icon: typeof Globe;
  title: string;
  body: string;
  who: string;
  href: string;
  cta: string;
}

const demos: Demo[] = [
  {
    icon: Globe,
    title: "Kanzlei-Webseite",
    body: "Die fertig gebaute Webseite Ihrer Kanzlei — Hero, Rechtsgebiete, Team, Testimonials, Kontaktformular. Genau das schalten Sie als Google-Ad.",
    who: "Aus Mandanten-Sicht",
    href: "/template/kanzlei",
    cta: "Webseite öffnen",
  },
  {
    icon: LayoutDashboard,
    title: "Anwalts-Dashboard",
    body: "Mit Beispiel-Daten gefüllt: Mandanten, Akten, Anrufe mit Transcript, Termine, KI-Strategien. Alles klickbar.",
    who: "Aus Anwalts-Sicht",
    href: "/dashboard",
    cta: "Dashboard öffnen",
  },
  {
    icon: User,
    title: "Mandanten-Portal",
    body: "Was Ihr Mandant nach Login sieht: Akten-Status, anstehende Termine, hochgeladene Dokumente, Rechnungen — sein eigener Mandanten-Bereich.",
    who: "Aus Mandanten-Sicht",
    href: "/portal/dashboard",
    cta: "Portal öffnen",
  },
];

const TryItYourselfSection = () => {
  return (
    <section
      id="live-demo"
      className="py-20 bg-background border-y border-border"
    >
      <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-muted/30 text-[11px] uppercase tracking-[0.15em] text-muted-foreground font-semibold mb-5">
            Ohne Anmeldung · ohne Eingabe
          </div>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground tracking-tight mb-4 leading-tight">
            3 Demos. Ein Klick. Keine Onboarding-Pflicht.
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Sie sehen genau dasselbe was Ihre Mandanten und Sie selbst nach
            Setup sehen würden — mit Beispiel-Daten gefüllt, sofort klickbar.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {demos.map((d) => {
            const Icon = d.icon;
            return (
              <a
                key={d.title}
                href={d.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group surface p-5 hover:border-foreground/30 hover:-translate-y-0.5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                aria-label={`${d.cta} in neuem Tab`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="h-10 w-10 rounded-lg border border-border bg-muted/30 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/70">
                    {d.who}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2 tracking-tight">
                  {d.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  {d.body}
                </p>
                <div className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground group-hover:text-accent transition-colors">
                  {d.cta}
                  <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </a>
            );
          })}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          Tipp: öffnen Sie alle drei in nebeneinander liegenden Tabs — so
          sehen Sie sofort wie Webseite → Inbox → Anwalts-Workflow zusammenarbeiten.
        </p>
      </div>
    </section>
  );
};

export default TryItYourselfSection;
