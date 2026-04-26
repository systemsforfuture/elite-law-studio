import { Cpu, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

const SystemsBadge = () => {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setCollapsed(true), 8000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="fixed bottom-5 left-5 z-[60] hidden sm:block">
      <Link
        to="/"
        onMouseEnter={() => setCollapsed(false)}
        onMouseLeave={() => setCollapsed(true)}
        className="group flex items-center gap-2 px-3 py-2 rounded-full bg-navy-dark/95 backdrop-blur-xl border border-accent/30 text-primary-foreground shadow-2xl shadow-navy-dark/40 hover:border-accent/60 transition-all"
      >
        <div className="w-7 h-7 rounded-full bg-accent/15 flex items-center justify-center shrink-0">
          <Cpu className="h-3.5 w-3.5 text-accent" />
        </div>
        <span
          className={`overflow-hidden transition-all duration-500 whitespace-nowrap ${
            collapsed ? "max-w-0 opacity-0" : "max-w-[280px] opacity-100"
          }`}
        >
          <span className="text-[10px] uppercase tracking-[0.2em] text-accent/80 mr-2 font-bold">
            SYSTEMS-Demo
          </span>
          <span className="text-xs text-primary-foreground/80">
            White-Label-Funnel für Kanzlei Bergmann
          </span>
        </span>
        <ArrowLeft
          className={`h-3.5 w-3.5 text-accent transition-all ${
            collapsed ? "opacity-0 max-w-0" : "opacity-100 max-w-[14px]"
          }`}
        />
      </Link>
    </div>
  );
};

export default SystemsBadge;
