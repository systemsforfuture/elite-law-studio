import { Link } from "react-router-dom";
import { Scale, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "glass-nav shadow-lg shadow-navy-dark/10"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-6 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative">
            <Scale className="h-8 w-8 text-accent transition-all duration-500 group-hover:scale-110 group-hover:rotate-[-5deg]" />
            <div className="absolute inset-0 bg-accent/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </div>
          <div>
            <span className="text-xl font-display font-bold text-primary-foreground tracking-wide">
              KANZLEI BERGMANN
            </span>
            <span className="block text-[10px] text-gold-light tracking-[0.3em] uppercase">
              Rechtsanwälte
            </span>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {["Rechtsgebiete", "Über uns", "Mandanten", "Kontakt"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(/\s/g, "-").replace("ü", "ue")}`}
              className="relative px-4 py-2 text-sm font-medium text-primary-foreground/70 hover:text-primary-foreground transition-colors duration-300 tracking-wide uppercase group"
            >
              {item}
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-accent rounded-full transition-all duration-300 group-hover:w-2/3" />
            </a>
          ))}
          <Link to="/login" className="ml-4">
            <Button variant="gold" size="sm" className="rounded-xl glow-sm-gold">
              Mandanten-Portal
            </Button>
          </Link>
        </div>

        <button
          className="md:hidden text-primary-foreground p-2 rounded-xl hover:bg-white/10 transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden glass-nav border-t border-white/[0.08]">
          <div className="container mx-auto px-6 py-6 flex flex-col gap-2">
            {["Rechtsgebiete", "Über uns", "Mandanten", "Kontakt"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/\s/g, "-").replace("ü", "ue")}`}
                className="text-sm font-medium text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/5 transition-all py-3 px-4 rounded-xl"
                onClick={() => setMobileOpen(false)}
              >
                {item}
              </a>
            ))}
            <Link to="/login" onClick={() => setMobileOpen(false)} className="mt-2">
              <Button variant="gold" size="sm" className="w-full rounded-xl">
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
