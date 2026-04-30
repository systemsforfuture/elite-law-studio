import { Cpu } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="bg-navy-dark text-primary-foreground relative overflow-hidden">
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

    <div className="container mx-auto px-6 py-20">
      <div className="grid md:grid-cols-4 gap-12">
        <div className="md:col-span-1">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center">
              <Cpu className="h-5 w-5 text-accent" />
            </div>
            <span className="text-lg font-display font-bold tracking-tight">
              SYSTEMS<sup className="text-accent">™</sup>
            </span>
          </div>
          <p className="text-sm text-primary-foreground/40 leading-relaxed">
            Die SaaS-Plattform, auf der die Anwaltskanzlei der nächsten
            Generation läuft. Multi-Tenant, White-Label, in 24h live.
          </p>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-accent mb-5">
            Plattform
          </h4>
          <ul className="space-y-3 text-sm text-primary-foreground/40">
            <li><a href="/#module" className="hover:text-primary-foreground/70 transition-colors">Module</a></li>
            <li><a href="/#agenten" className="hover:text-primary-foreground/70 transition-colors">KI-Agenten</a></li>
            <li><a href="/#preise" className="hover:text-primary-foreground/70 transition-colors">Preise</a></li>
            <li><a href="/#onboarding" className="hover:text-primary-foreground/70 transition-colors">Onboarding</a></li>
            <li><Link to="/onboarding" className="hover:text-primary-foreground/70 transition-colors">Live-Demo</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-accent mb-5">
            Compliance
          </h4>
          <ul className="space-y-3 text-sm text-primary-foreground/40">
            <li>DSGVO · EU-Hosting Frankfurt</li>
            <li>§43e BRAO konform</li>
            <li>Auftragsverarbeitungs-Vertrag</li>
            <li>Beschlagnahmefreiheit</li>
            <li>ISO 27001 (in Vorbereitung)</li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-accent mb-5">
            Kontakt
          </h4>
          <ul className="space-y-3 text-sm text-primary-foreground/40">
            <li>SYSTEMS LLC</li>
            <li className="text-accent/80">
              <a href="mailto:systems.future@pm.me" className="hover:text-accent transition-colors">
                systems.future@pm.me
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-16 pt-8 border-t border-white/[0.06] flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-xs text-primary-foreground/30">
          © {new Date().getFullYear()} SYSTEMS LLC. Alle Rechte vorbehalten.
        </p>
        <div className="flex gap-8 text-xs text-primary-foreground/30">
          <a href="#" className="hover:text-accent transition-colors duration-300">Datenschutzerklärung</a>
          <a href="#" className="hover:text-accent transition-colors duration-300">Impressum</a>
          <a href="#" className="hover:text-accent transition-colors duration-300">AGB</a>
          <a href="#" className="hover:text-accent transition-colors duration-300">AVV</a>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
