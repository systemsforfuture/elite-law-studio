import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft, Cpu, LayoutDashboard, Home, Sparkles } from "lucide-react";

const links = [
  { to: "/", icon: Home, label: "Startseite", desc: "SYSTEMS™ Plattform" },
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard", desc: "Kanzlei-Admin" },
  { to: "/portal", icon: Sparkles, label: "Mandanten-Portal", desc: "Client-Sicht" },
  { to: "/template/kanzlei", icon: Cpu, label: "Funnel-Demo", desc: "White-Label-Vorschau" },
];

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.warn("[404]", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-navy-dark flex items-center justify-center px-6 py-12 relative overflow-hidden">
      <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-accent/[0.06] rounded-full blur-[180px]" />
      <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-accent/[0.04] rounded-full blur-[150px]" />

      <div className="relative max-w-2xl w-full text-center">
        <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full border border-accent/20 bg-accent/[0.08] backdrop-blur-sm mb-8">
          <span className="text-xs font-mono uppercase tracking-[0.2em] text-accent/90">
            404 · Route nicht gefunden
          </span>
        </div>

        <h1 className="text-5xl md:text-7xl font-display font-black text-primary-foreground tracking-[-0.04em] mb-6">
          Diese Seite gibt es <span className="text-gradient-gold">nicht</span>.
        </h1>

        <p className="text-lg text-primary-foreground/50 font-light mb-3 max-w-md mx-auto">
          Der Pfad <code className="text-accent/80 font-mono text-sm">{location.pathname}</code> existiert nicht.
        </p>
        <p className="text-sm text-primary-foreground/30 mb-12">
          Vielleicht wollten Sie zu einer dieser Seiten?
        </p>

        <div className="grid sm:grid-cols-2 gap-3 max-w-xl mx-auto mb-10">
          {links.map((l) => {
            const Icon = l.icon;
            return (
              <Link
                key={l.to}
                to={l.to}
                className="group glass-dark p-5 text-left hover:border-accent/30 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center shrink-0 group-hover:bg-accent/25 transition-colors">
                    <Icon className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-primary-foreground">
                      {l.label}
                    </div>
                    <div className="text-xs text-primary-foreground/40">
                      {l.desc}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-accent hover:text-gold-dark font-medium"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Zurück zur Startseite
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
