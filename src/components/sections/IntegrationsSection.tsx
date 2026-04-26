import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { Database, FileSpreadsheet, FolderArchive, Phone, Mail, MessageSquare, Calendar, CreditCard, ShieldCheck, Cpu } from "lucide-react";

const integrations = [
  { icon: FolderArchive, name: "RA-MICRO", category: "Datenmigration" },
  { icon: Database, name: "DATEV Anwalt", category: "Datenmigration" },
  { icon: FileSpreadsheet, name: "Advoware", category: "Datenmigration" },
  { icon: FileSpreadsheet, name: "Excel / CSV", category: "Datenmigration" },
  { icon: Cpu, name: "Anthropic Claude", category: "KI-Layer" },
  { icon: Phone, name: "Vapi.ai", category: "Voice" },
  { icon: Mail, name: "Resend", category: "Email" },
  { icon: MessageSquare, name: "360dialog WhatsApp", category: "Messaging" },
  { icon: Calendar, name: "Google Calendar", category: "Termine" },
  { icon: Calendar, name: "Microsoft Outlook", category: "Termine" },
  { icon: CreditCard, name: "Stripe", category: "Payments" },
  { icon: ShieldCheck, name: "Supabase EU", category: "Hosting" },
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
            Vorintegriert
            <span className="w-8 h-px bg-accent/50" />
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-black text-foreground tracking-[-0.03em]">
            Spielt mit allem zusammen,
            <br />
            <span className="text-gradient-gold">was Sie bereits haben.</span>
          </h2>
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
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                  <it.icon className="h-4 w-4 text-accent" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-foreground truncate">
                    {it.name}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60">
                    {it.category}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground/60 mt-8">
          Alles EU-gehostet. Keine US-Server. DSGVO-konform.
        </p>
      </div>
    </section>
  );
};

export default IntegrationsSection;
