// SYSTEMS™ — Marketing-Section »Risiko-frei testen«
//
// Nimmt die letzte rationale Hürde: »Was wenn ich kaufe und es taugt
// doch nichts?« 4 ehrliche Garantien, schriftlich. Setzt direkt nach
// Pricing — wo der Lead über »jetzt kaufen« nachdenkt.

import { Calendar, Database, Lock, Wallet } from "lucide-react";

interface Guarantee {
  icon: typeof Calendar;
  title: string;
  body: string;
}

const guarantees: Guarantee[] = [
  {
    icon: Calendar,
    title: "14 Tage volle Plattform — kein Cent",
    body: "Sie kriegen die komplette Plattform mit allen Modulen für 14 Tage. Erst wenn Ihr Setup live geht und Sie zufrieden sind, wird die Setup-Fee fällig. Wir kommen nicht ans Ziel — Sie zahlen nichts.",
  },
  {
    icon: Wallet,
    title: "Monatlich kündbar nach Setup",
    body: "Kein Lock-in, keine Mindestlaufzeit. Sie kündigen zum Monatsende, wir respektieren das. Setup-Fee bleibt — die ist für die echte Aufbauarbeit (KI-Training, Domain, Migration), nicht Strafe.",
  },
  {
    icon: Database,
    title: "Daten gehören Ihnen — Export jederzeit",
    body: "Bei Kündigung: vollständiger Export aller Daten in 48h. Mandanten als CSV, Akten als JSON, Dokumente als Original, Rechnungen als DATEV. 30 Tage nach Export endgültige Löschung (DSGVO-konform).",
  },
  {
    icon: Lock,
    title: "Mandatsgeheimnis strukturell sicher",
    body: "Optional E2E-Verschlüsselung mit Ihrer Passphrase. Auch wir als Plattform-Betreiber sehen nur Ciphertext. §203 StGB-konform auf technischer Ebene — nicht nur per Vertrag.",
  },
];

const RiskFreeSection = () => {
  return (
    <section id="risiko" className="py-20 bg-muted/10 border-y border-border">
      <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card text-[11px] uppercase tracking-[0.15em] text-muted-foreground font-semibold mb-5">
            Schriftlich. Verbindlich.
          </div>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground tracking-tight mb-4 leading-tight">
            Risiko-frei testen.
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Vier Garantien die Sie schwarz auf weiß im Vertrag bekommen.
            Keine Marketing-Versprechen — durchklagbare Klauseln.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 mb-10">
          {guarantees.map((g) => {
            const Icon = g.icon;
            return (
              <div key={g.title} className="surface p-5">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg border border-border bg-muted/30 flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-foreground mb-1.5 leading-tight">
                      {g.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {g.body}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs text-muted-foreground max-w-2xl mx-auto">
          Im Zweifel:{" "}
          <a
            href="#contact"
            className="text-foreground font-medium underline-offset-2 hover:underline"
          >
            15-Min-Beratungstermin
          </a>{" "}
          buchen. Lieber 15 Minuten vorher klären als hinterher unzufrieden sein.
        </p>
      </div>
    </section>
  );
};

export default RiskFreeSection;
