import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import {
  FolderArchive,
  FileSpreadsheet,
  Calendar,
  CreditCard,
  Phone,
  ShieldCheck,
} from "lucide-react";

const integrations = [
  { icon: FolderArchive, name: "RA-MICRO", desc: "Mandanten- & Akten-Migration" },
  { icon: FolderArchive, name: "DATEV Anwalt", desc: "Buchhaltungs-Export" },
  { icon: FolderArchive, name: "Advoware", desc: "XML-Datenmigration" },
  { icon: FileSpreadsheet, name: "Excel / CSV", desc: "Universal-Importer" },
  { icon: Calendar, name: "Kalender-Sync", desc: "Google · Outlook · iCal" },
  { icon: CreditCard, name: "Online-Zahlung", desc: "Mandanten-Selbstzahlung" },
  { icon: Phone, name: "Ihre Telefonnummer", desc: "Bestehende Nummer behalten" },
  { icon: ShieldCheck, name: "beA-Schnittstelle", desc: "Geplant Q3" },
];

const IntegrationsSection = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section className="py-24 bg-background relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-accent/[0.03] rounded-full blur-[120px]" />
      <div className="container mx-auto px-6 relative" ref={ref}>
        <div
          className={`text-center mb-12 transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-accent mb-3">
            <span className="w-8 h-px bg-accent/50" />
            Integriert sich nahtlos
            <span className="w-8 h-px bg-accent/50" />
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-black text-foreground tracking-[-0.03em]">
            Ihre Daten, Ihre Tools —
            <br />
            <span className="text-gradient-gold">in 30 Minuten übernommen.</span>
          </h2>
          <p className="text-muted-foreground mt-5 max-w-2xl mx-auto text-base font-light">
            Sie behalten was Sie haben. Wir migrieren in einem Vormittag und
            verbinden Ihre wichtigsten Workflows.
          </p>
        </div>

        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {integrations.map((it, i) => (
            <div
              key={it.name}
              className={`group p-5 rounded-2xl border border-border/50 bg-card/50 hover:bg-card hover:border-accent/30 transition-all duration-500 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
              style={{ transitionDelay: `${100 + i * 40}ms` }}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors shrink-0">
                  <it.icon className="h-4 w-4 text-accent" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-foreground truncate">
                    {it.name}
                  </div>
                  <div className="text-[11px] text-muted-foreground/80">
                    {it.desc}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground/60 mt-8">
          Hosting in Deutschland · DSGVO-konform · §43e BRAO konform
        </p>
      </div>
    </section>
  );
};

export default IntegrationsSection;
