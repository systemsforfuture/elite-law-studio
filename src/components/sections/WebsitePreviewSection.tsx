// SYSTEMS™ — Marketing-Section: »Ihre Webseite«
//
// Antwortet die Frage, die jeder anwalt-Lead nach dem Hero hat:
// »Schön, KI — aber was sehe ich, was meine Mandanten sehen?«
//
// Zeigt einen browser-frame-Mockup-Block mit dem realen
// /template/kanzlei als Embed-Vorschau-Bild + Link zum Vollscreen.

import { ArrowUpRight, Megaphone, Search, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const WebsitePreviewSection = () => {
  return (
    <section id="ihre-webseite" className="py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-muted/30 text-[11px] uppercase tracking-[0.15em] text-muted-foreground font-semibold mb-5">
            <Megaphone className="h-3 w-3" />
            Inklusive Premium-Kanzlei-Webseite
          </div>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground tracking-tight mb-4 leading-tight">
            Ihre Kanzlei-Webseite —{" "}
            <span className="text-accent">in 24 Stunden online.</span>
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Eine fertige Landingpage unter Ihrer Domain. Conversion-optimiert
            für Mandanten-Anfragen. Bereit für Google Ads, SEO und Empfehlungen
            — alles automatisch in den Inbox-Workflow der KI eingespeist.
          </p>
        </div>

        {/* Browser-Frame Mockup mit echter Template-Vorschau */}
        <div className="relative mb-10">
          <div className="rounded-2xl border border-border bg-card shadow-[0_24px_80px_-24px_rgba(0,0,0,0.15)] overflow-hidden">
            {/* Browser-Chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/20">
              <span className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
                <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
                <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
              </span>
              <div className="flex-1 mx-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md border border-border/60 bg-background text-[11px] text-muted-foreground font-mono">
                  <ShieldCheck className="h-3 w-3 text-[hsl(var(--status-success))]" />
                  ihre-kanzlei.de
                </div>
              </div>
              <a
                href="/template/kanzlei"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 rounded px-1"
                aria-label="Demo-Webseite in neuem Tab öffnen"
              >
                Vollbild öffnen
                <ArrowUpRight className="h-3 w-3" />
              </a>
            </div>

            {/* iFrame zur echten Template-Page */}
            <div className="relative bg-muted/20 aspect-[16/10] overflow-hidden">
              <iframe
                src="/template/kanzlei"
                title="Vorschau der Kanzlei-Webseite, die mit SYSTEMS ausgeliefert wird"
                className="absolute inset-0 w-full h-full pointer-events-none"
                loading="lazy"
                tabIndex={-1}
                aria-hidden="true"
              />
              {/* Click-overlay damit die iFrame nicht versehentlich navigiert */}
              <a
                href="/template/kanzlei"
                target="_blank"
                rel="noopener noreferrer"
                className="absolute inset-0 group focus:outline-none"
                aria-label="Demo-Webseite in neuem Tab öffnen"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/40 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity flex items-end justify-center pb-8">
                  <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-foreground text-background text-sm font-medium shadow-lg">
                    Live ansehen
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* 3 Quick-Benefits */}
        <div className="grid sm:grid-cols-3 gap-3 mb-10">
          <Benefit
            icon={Search}
            title="SEO-fertig"
            body="Strukturierte Daten, semantisches HTML, schnelle Ladezeiten — Google findet Sie."
          />
          <Benefit
            icon={Megaphone}
            title="Werbe-tauglich"
            body="Conversion-optimierter Funnel. Schalten Sie Google/Meta-Ads direkt drauf."
          />
          <Benefit
            icon={ShieldCheck}
            title="Rechtssicher"
            body="Impressum, Datenschutz, AGB inklusive — alles RA-Berufsrecht-konform."
          />
        </div>

        <div className="flex flex-wrap gap-3 justify-center">
          <a
            href="/template/kanzlei"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" className="rounded-xl">
              Demo-Webseite anschauen
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Button>
          </a>
          <Link to="/onboarding">
            <Button variant="gold" className="rounded-xl">
              In 24h Ihre eigene Version live
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

const Benefit = ({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Search;
  title: string;
  body: string;
}) => (
  <div className="surface p-4">
    <div className="flex items-center gap-2 mb-1.5">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm font-semibold text-foreground">{title}</span>
    </div>
    <p className="text-[12px] text-muted-foreground leading-relaxed">{body}</p>
  </div>
);

export default WebsitePreviewSection;
