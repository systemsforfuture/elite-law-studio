import { Scale } from "lucide-react";
import { Link } from "react-router-dom";
import { useKanzleiConfig } from "@/pages/VorschauPage";

const Footer = () => {
  const config = useKanzleiConfig();
  const { display_name, copyright_name, footer_tagline, rechtsgebiete, contact } = config;
  return (
  <footer className="bg-navy-dark text-primary-foreground relative overflow-hidden">
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

    <div className="container mx-auto px-6 py-20">
      <div className="grid md:grid-cols-4 gap-12">
        <div className="md:col-span-1">
          <div className="flex items-center gap-3 mb-5">
            <Scale className="h-7 w-7 text-accent" />
            <span className="text-lg font-display font-bold tracking-wide">{display_name}</span>
          </div>
          <p className="text-sm text-primary-foreground/40 leading-relaxed">
            {footer_tagline}
          </p>
        </div>

        {[
          {
            title: "Rechtsgebiete",
            items: rechtsgebiete,
          },
          {
            title: "Kanzlei",
            items: ["Über uns", "Team", "Karriere", "Mandanten-Portal"],
          },
          {
            title: "Kontakt",
            items: [contact.address_line, contact.city_line, contact.phone, contact.email],
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
          © {new Date().getFullYear()} {copyright_name}. Alle Rechte vorbehalten.
        </p>
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-primary-foreground/30">
          <Link to="/datenschutz" className="hover:text-primary-foreground/70 transition">Datenschutzerklärung</Link>
          <Link to="/impressum" className="hover:text-primary-foreground/70 transition">Impressum</Link>
          <Link to="/agb" className="hover:text-primary-foreground/70 transition">AGB</Link>
        </div>
      </div>
    </div>
  </footer>
  );
};

export default Footer;
