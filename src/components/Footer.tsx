import { Scale } from "lucide-react";

const Footer = () => (
  <footer className="bg-navy text-primary-foreground">
    <div className="container mx-auto px-6 py-16">
      <div className="grid md:grid-cols-4 gap-10">
        <div className="md:col-span-1">
          <div className="flex items-center gap-3 mb-4">
            <Scale className="h-7 w-7 text-accent" />
            <span className="text-lg font-serif font-bold tracking-wide">KANZLEI BERGMANN</span>
          </div>
          <p className="text-sm text-primary-foreground/60 leading-relaxed">
            Ihre vertrauenswürdige Kanzlei für Familienrecht, Arbeitsrecht und Vertragsrecht seit 1998.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-accent mb-4">Rechtsgebiete</h4>
          <ul className="space-y-2 text-sm text-primary-foreground/60">
            <li>Familienrecht</li>
            <li>Arbeitsrecht</li>
            <li>Vertragsrecht</li>
            <li>Erbrecht</li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-accent mb-4">Kanzlei</h4>
          <ul className="space-y-2 text-sm text-primary-foreground/60">
            <li>Über uns</li>
            <li>Team</li>
            <li>Karriere</li>
            <li>Mandanten-Portal</li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-accent mb-4">Kontakt</h4>
          <ul className="space-y-2 text-sm text-primary-foreground/60">
            <li>Friedrichstraße 123</li>
            <li>10117 Berlin</li>
            <li>+49 30 123 456 78</li>
            <li>info@kanzlei-bergmann.de</li>
          </ul>
        </div>
      </div>

      <div className="mt-12 pt-8 border-t border-navy-light/30 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-xs text-primary-foreground/40">
          © 2026 Kanzlei Bergmann. Alle Rechte vorbehalten.
        </p>
        <div className="flex gap-6 text-xs text-primary-foreground/40">
          <a href="#" className="hover:text-accent transition-colors">Datenschutzerklärung</a>
          <a href="#" className="hover:text-accent transition-colors">Impressum</a>
          <a href="#" className="hover:text-accent transition-colors">AGB</a>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
