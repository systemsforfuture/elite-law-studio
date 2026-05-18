// SYSTEMS™ — Marketing-Section »Was bekomme ich konkret?«
//
// Anwalts-Lead Frage Nr. 1 nach dem Hero: »Schön, KI — aber WAS
// genau krieg ich für mein Geld?« Diese Section antwortet
// unmissverständlich mit 8 fassbaren Items + 3-Tage-Onboarding-
// Timeline. Keine Buzzwords, sondern »eine eigene Telefonnummer«,
// »eine Webseite mit Ihrer Domain«.

import {
  Globe,
  Phone,
  Inbox,
  Users,
  Receipt,
  FileSearch,
  ShieldCheck,
  CalendarClock,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface Item {
  icon: typeof Phone;
  title: string;
  body: string;
  example: string;
}

const items: Item[] = [
  {
    icon: Globe,
    title: "Eine eigene Kanzlei-Webseite",
    body: "Unter Ihrer Domain. SEO-optimiert, Werbe-tauglich, mit Impressum + Datenschutz + AGB. Anfragen landen direkt in Ihrer Inbox.",
    example: "ihre-kanzlei.de — fertig zum Schalten von Google Ads",
  },
  {
    icon: Phone,
    title: "KI-Empfangskraft am Telefon",
    body: "Eigene Festnetz-Nummer. Anna nimmt 24/7 Anrufe an, qualifiziert Mandanten, bucht Termine, eskaliert bei Notfall — verbindet Sie direkt durch.",
    example: "Anrufer hört: »Kanzlei [Ihr Name], hier ist Anna«",
  },
  {
    icon: Inbox,
    title: "Inbox für E-Mail + WhatsApp",
    body: "Alle Nachrichten in einem Dashboard. KI liest mit, kategorisiert, antwortet auf Standard-Fragen automatisch — Sie sehen nur was wichtig ist.",
    example: "»3 ungelesen · 1 eskaliert« statt 47 Mails sortieren",
  },
  {
    icon: Users,
    title: "Mandanten-Akte mit ganzer Historie",
    body: "Jeder Mandant hat eine Stand-Seite: letzter Kontakt, Akten, Anrufe mit Transcript, Termine, Rechnungen — komplett dokumentiert.",
    example: "5-Sekunden-Übersicht statt 20-Minuten-Aktensuche",
  },
  {
    icon: CalendarClock,
    title: "Termin- und Fristen-Management",
    body: "KI koordiniert Erstgespräche, prüft Verfügbarkeit, schickt Bestätigungen. Fristen mit Tages-Countdown, kritische werden farblich gewarnt.",
    example: "Klagefrist in 3 T → automatisch in Sidebar oben",
  },
  {
    icon: Receipt,
    title: "4-stufiges Mahnwesen",
    body: "Erinnerung → Mahnung 1 → Mahnung 2 → Gerichtliches Verfahren. Juristisch korrekte Texte (§288 BGB), automatischer Versand auf Wunsch.",
    example: "Außenstand sinkt um ø 35 % im ersten Quartal",
  },
  {
    icon: FileSearch,
    title: "Dokumenten-KI",
    body: "Verträge hochladen → KI extrahiert Parteien, Klauseln, Fristen, Risiko-Level. Klausel-Analyse mit Empfehlung in 30 Sekunden statt 30 Minuten.",
    example: "Mietvertrag-Prüfung: 3 kritische Klauseln markiert",
  },
  {
    icon: ShieldCheck,
    title: "Mandatsgeheimnis-Verschlüsselung",
    body: "Strategie-Notizen, sensible Akten-Inhalte werden im Browser AES-256 verschlüsselt. Auch wir als Plattform können sie nicht lesen.",
    example: "§203 StGB-konform · zero-knowledge · 12-Wort-Recovery",
  },
];

const timeline = [
  {
    day: "Tag 1",
    title: "Onboarding-Call",
    body: "30 Min Gespräch — wir konfigurieren Ihre KI-Empfangskraft (Tonalität, Rechtsgebiete, Hotline) und Ihre Domain.",
  },
  {
    day: "Tag 2",
    title: "Webseite + Telefon live",
    body: "Ihre Kanzlei-Webseite ist online. Die KI-Hotline nimmt erste Test-Anrufe an. Sie testen das System mit eigenen Daten.",
  },
  {
    day: "Tag 3",
    title: "Echte Mandanten",
    body: "Sie schalten Werbung oder verteilen Visitenkarten. Die KI macht den Empfang — Sie sehen nur was Anwalts-Aufmerksamkeit braucht.",
  },
];

const WhatYouGetSection = () => {
  return (
    <section id="was-bekomme-ich" className="py-20 bg-muted/10">
      <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-muted/30 text-[11px] uppercase tracking-[0.15em] text-muted-foreground font-semibold mb-5">
            <CheckCircle2 className="h-3 w-3" />
            8 Bausteine — eine Plattform
          </div>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground tracking-tight mb-4 leading-tight">
            Was Sie konkret bekommen.
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Keine Buzzwords. Hier ist die vollständige Liste — jeden Punkt
            können Sie morgen testen.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-16">
          {items.map((it) => {
            const Icon = it.icon;
            return (
              <div
                key={it.title}
                className="surface p-4 hover:border-foreground/20 transition-colors"
              >
                <div className="h-9 w-9 rounded-lg border border-border bg-muted/30 flex items-center justify-center mb-3">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-1.5 leading-tight">
                  {it.title}
                </h3>
                <p className="text-[12px] text-muted-foreground leading-relaxed mb-2">
                  {it.body}
                </p>
                <div className="text-[11px] text-foreground/70 border-t border-border/40 pt-2 mt-2">
                  <span className="text-muted-foreground/70 mr-1">Beispiel:</span>
                  {it.example}
                </div>
              </div>
            );
          })}
        </div>

        {/* Timeline: »So läuft's ab« */}
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground tracking-tight">
            So läuft's ab — 3 Tage von Kauf bis erste Mandanten.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-3 mb-10">
          {timeline.map((t, i) => (
            <div key={t.day} className="surface p-5 relative">
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex h-7 w-7 rounded-full bg-foreground text-background text-xs font-bold items-center justify-center tabular-nums">
                  {i + 1}
                </span>
                <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
                  {t.day}
                </span>
              </div>
              <h3 className="text-base font-semibold text-foreground mb-1.5">
                {t.title}
              </h3>
              <p className="text-[12px] text-muted-foreground leading-relaxed">
                {t.body}
              </p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 justify-center">
          <Link to="/onboarding">
            <Button variant="gold" className="rounded-xl">
              Onboarding starten
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <a
            href="/template/kanzlei"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" className="rounded-xl">
              Vorher Demo ansehen
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
};

export default WhatYouGetSection;
