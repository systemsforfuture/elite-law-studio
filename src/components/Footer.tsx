import { Scale } from "lucide-react";

const Footer = () => (
  <footer className="bg-navy-dark text-primary-foreground relative overflow-hidden">
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
    
    <div className="container mx-auto px-6 py-20">
      <div className="grid md:grid-cols-4 gap-12">
        <div className="md:col-span-1">
          <div className="flex items-center gap-3 mb-5">
            <Scale className="h-7 w-7 text-accent" />
            <span className="text-lg font-serif font-bold tracking-wide">KANZLEI BERGMANN</span>
          </div>
          <p className="text-sm text-primary-foreground/40 leading-relaxed">
            Ihre vertrauenswürdige Kanzlei für Familienrecht, Arbeitsrecht und Vertragsrecht seit 1998.
          </p>
        </div>

        {[
          {
            title: "Rechtsgebiete",
            items: ["Familienrecht", "Arbeitsrecht", "Vertragsrecht", "Erbrecht"],
          },
          {
            title: "Kanzlei",
            items: ["Über uns", "Team", "Karriere", "Mandanten-Portal"],
          },
          {
            title: "Kontakt",
            items: ["Friedrichstraße 123", "10117 Berlin", "+49 30 123 456 78", "info@kanzlei-bergmann.de"],
          },
        ].map(({ title, items }) => (
          <div key={title}>
            <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-accent mb-5">{title}</h4>
            <ul className="space-y-3 text-sm text-primary-foreground/40">
              {items.map((item) => (
                <li key={item} className="hover:text-primary-foreground/70 transition-colors cursor-pointer">{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-16 pt-8 border-t border-white/[0.06] flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-xs text-primary-foreground/30">
          © 2026 Kanzlei Bergmann. Alle Rechte vorbehalten.
        </p>
        <div className="flex gap-8 text-xs text-primary-foreground/30">
          <a href="#" className="hover:text-accent transition-colors duration-300">Datenschutzerklärung</a>
          <a href="#" className="hover:text-accent transition-colors duration-300">Impressum</a>
          <a href="#" className="hover:text-accent transition-colors duration-300">AGB</a>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
