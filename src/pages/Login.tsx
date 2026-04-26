import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Cpu, Eye, EyeOff, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const Login = () => {
  const [role, setRole] = useState<"kanzlei" | "admin">("kanzlei");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-[45%] bg-navy-dark relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0">
          <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-accent/[0.06] rounded-full blur-[100px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[200px] h-[200px] bg-accent/[0.04] rounded-full blur-[80px]" />
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `linear-gradient(hsl(42 80% 55% / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(42 80% 55% / 0.3) 1px, transparent 1px)`,
              backgroundSize: "50px 50px",
            }}
          />
        </div>

        <div className="relative text-center px-16 max-w-lg">
          <div className="w-20 h-20 rounded-3xl bg-accent/10 flex items-center justify-center mx-auto mb-8 glow-sm-gold">
            <Cpu className="h-10 w-10 text-accent" />
          </div>
          <h2 className="text-4xl font-display font-bold text-primary-foreground mb-5 leading-tight">
            Willkommen in Ihrer
            <br />
            <span className="text-gradient-gold">SYSTEMS™ Plattform</span>
          </h2>
          <p className="text-primary-foreground/40 font-light leading-relaxed">
            6 KI-Agenten, 12+ Module, Mandanten-CRM, Voice-Inbox, Mahnwesen,
            Dokumenten-Analyse — alles in einem Dashboard.
          </p>

          <div className="mt-12 space-y-4 text-left">
            {[
              "Multi-Tenant Postgres RLS",
              "EU-Hosting Frankfurt",
              "DSGVO + §43e BRAO konform",
            ].map((f) => (
              <div
                key={f}
                className="flex items-center gap-3 text-sm text-primary-foreground/30"
              >
                <div className="w-1 h-1 rounded-full bg-accent" />
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-background relative">
        <div className="absolute top-0 left-0 w-[300px] h-[300px] bg-accent/[0.03] rounded-full blur-[100px]" />

        <div className="w-full max-w-md relative">
          <Link to="/" className="flex items-center gap-3 mb-12 lg:hidden">
            <div className="w-10 h-10 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center">
              <Cpu className="h-5 w-5 text-accent" />
            </div>
            <span className="text-xl font-display font-bold text-foreground">
              SYSTEMS™
            </span>
          </Link>

          <h1 className="text-3xl font-display font-bold text-foreground mb-2">
            Anmelden
          </h1>
          <p className="text-sm text-muted-foreground mb-10 font-light">
            Magic-Link an Ihre Kanzlei-E-Mail.
          </p>

          <div className="flex rounded-2xl border border-border/50 bg-muted/30 backdrop-blur-sm p-1 mb-8">
            {(["kanzlei", "admin"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`flex-1 py-3 text-sm font-medium rounded-xl transition-all duration-500 ${
                  role === r
                    ? "bg-navy text-primary-foreground shadow-lg shadow-navy/20"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {r === "kanzlei" ? "Kanzlei-Login" : "SYSTEMS-Admin"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                E-Mail
              </label>
              <input
                type="email"
                placeholder="max@kanzlei-bergmann.de"
                className="w-full px-4 py-3.5 rounded-xl border border-border/50 bg-background/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/30 transition-all placeholder:text-muted-foreground/40"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Passwort
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full px-4 py-3.5 rounded-xl border border-border/50 bg-background/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/30 transition-all pr-12 placeholder:text-muted-foreground/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center text-sm">
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  className="rounded-md border-border accent-accent"
                />
                <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                  Angemeldet bleiben
                </span>
              </label>
              <a
                href="#"
                className="text-accent hover:text-gold-dark transition-colors font-medium"
              >
                Magic-Link senden
              </a>
            </div>

            <Button
              variant="gold"
              className="w-full rounded-xl glow-sm-gold group"
              size="lg"
              type="submit"
            >
              Anmelden
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/50" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-3 text-muted-foreground/60 tracking-widest">
                  oder
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="w-full rounded-xl border border-accent/30 bg-accent/5 hover:bg-accent/10 hover:border-accent/50 px-4 py-3.5 text-sm font-medium text-foreground transition-all duration-300 flex items-center justify-center gap-2 group"
            >
              <Sparkles className="h-4 w-4 text-accent group-hover:rotate-12 transition-transform" />
              Demo-Tenant ansehen
              <span className="text-xs text-muted-foreground font-light">
                (ohne Login)
              </span>
            </button>
            <p className="text-center text-xs text-muted-foreground/60 -mt-2">
              Komplette Plattform mit Beispieldaten Kanzlei Bergmann
            </p>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-10">
            Noch keine Kanzlei-Lizenz?{" "}
            <Link
              to="/onboarding"
              className="text-accent hover:text-gold-dark transition-colors font-medium"
            >
              Onboarding starten
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
