import { Link } from "react-router-dom";
import { Scale, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-navy/95 backdrop-blur-md border-b border-navy-light/30">
      <div className="container mx-auto px-6 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <Scale className="h-8 w-8 text-accent transition-transform duration-300 group-hover:scale-110" />
          <div>
            <span className="text-xl font-serif font-bold text-primary-foreground tracking-wide">
              KANZLEI BERGMANN
            </span>
            <span className="block text-xs text-gold-light tracking-[0.3em] uppercase">
              Rechtsanwälte
            </span>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {["Rechtsgebiete", "Über uns", "Mandanten", "Kontakt"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(/\s/g, "-").replace("ü", "ue")}`}
              className="text-sm font-medium text-primary-foreground/80 hover:text-accent transition-colors duration-300 tracking-wide uppercase"
            >
              {item}
            </a>
          ))}
          <Link to="/login">
            <Button variant="gold" size="sm">
              Mandanten-Portal
            </Button>
          </Link>
        </div>

        <button
          className="md:hidden text-primary-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-navy border-t border-navy-light/30 animate-fade-in">
          <div className="container mx-auto px-6 py-4 flex flex-col gap-4">
            {["Rechtsgebiete", "Über uns", "Mandanten", "Kontakt"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/\s/g, "-").replace("ü", "ue")}`}
                className="text-sm font-medium text-primary-foreground/80 hover:text-accent transition-colors py-2"
                onClick={() => setMobileOpen(false)}
              >
                {item}
              </a>
            ))}
            <Link to="/login" onClick={() => setMobileOpen(false)}>
              <Button variant="gold" size="sm" className="w-full">
                Mandanten-Portal
              </Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
