import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Cpu,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Sparkles,
  ShieldCheck,
  Clock,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTenant } from "@/contexts/TenantContext";
import { useMandantAuth } from "@/contexts/MandantAuthContext";
import { toast } from "sonner";

const PortalLogin = () => {
  const { tenant } = useTenant();
  const mandantAuth = useMandantAuth();
  const [email, setEmail] = useState("");
  const [aktenzeichen, setAktenzeichen] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    if (mandantAuth.isDemoMode) {
      navigate("/portal/dashboard");
      return;
    }

    setSending(true);
    const { error: e2 } = await mandantAuth.signInWithMagicLink(email.trim());
    setSending(false);
    if (e2) {
      toast.error("Login fehlgeschlagen", { description: e2.message });
    } else {
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left brand panel */}
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
            Mandanten-Portal
            <br />
            <span className="text-gradient-gold">{tenant.kanzlei_name}</span>
          </h2>
          <p className="text-primary-foreground/40 font-light leading-relaxed">
            Sichere Kommunikation, Akte einsehen, Dokumente austauschen, Termine verwalten — Ihr Fall in Echtzeit.
          </p>

          <div className="mt-12 space-y-4 text-left">
            {[
              { icon: ShieldCheck, label: "Ende-zu-Ende verschlüsselt" },
              { icon: Clock, label: "24/7 Fallstatus einsehen" },
              { icon: Lock, label: "DSGVO-konform · Hosting Frankfurt" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-3 text-sm text-primary-foreground/40"
              >
                <Icon className="h-3.5 w-3.5 text-accent" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-background relative">
        <div className="absolute top-0 left-0 w-[300px] h-[300px] bg-accent/[0.03] rounded-full blur-[100px]" />

        <div className="w-full max-w-md relative">
          <Link to="/" className="flex items-center gap-3 mb-12 lg:hidden">
            <div className="w-10 h-10 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center">
              <Cpu className="h-5 w-5 text-accent" />
            </div>
            <span className="text-xl font-display font-bold text-foreground">
              {tenant.kanzlei_name}
            </span>
          </Link>

          <h1 className="text-3xl font-display font-bold text-foreground mb-2">
            Anmelden
          </h1>
          <p className="text-sm text-muted-foreground mb-8 font-light">
            Magic-Link an Ihre hinterlegte E-Mail-Adresse.
          </p>

          {sent ? (
            <div className="p-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.04] mb-6">
              <CheckCircle2 className="h-8 w-8 text-emerald-600 mb-3" />
              <h3 className="text-base font-semibold text-foreground mb-1">
                Login-Link unterwegs
              </h3>
              <p className="text-sm text-muted-foreground">
                Wir haben Ihnen einen Login-Link an{" "}
                <strong className="text-foreground">{email}</strong> gesendet.
                Öffnen Sie den Link auf demselben Gerät.
              </p>
              <button
                onClick={() => {
                  setSent(false);
                  setEmail("");
                }}
                className="text-xs text-accent font-medium hover:text-gold-dark mt-4"
              >
                Andere E-Mail versuchen
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  E-Mail
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vorname.nachname@email.de"
                  className="w-full px-4 py-3.5 rounded-xl border border-border/50 bg-background/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/30 transition-all placeholder:text-muted-foreground/40"
                  autoFocus
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Aktenzeichen{" "}
                  <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={aktenzeichen}
                  onChange={(e) => setAktenzeichen(e.target.value)}
                  placeholder="z.B. 1234/26"
                  className="w-full px-4 py-3.5 rounded-xl border border-border/50 bg-background/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/30 transition-all placeholder:text-muted-foreground/40 font-mono"
                />
              </div>

              <Button
                variant="gold"
                className="w-full rounded-xl glow-sm-gold group"
                size="lg"
                type="submit"
                disabled={sending}
              >
                {sending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Magic-Link wird gesendet…
                  </>
                ) : (
                  <>
                    Magic-Link senden
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
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
                onClick={() => navigate("/portal/dashboard")}
                className="w-full rounded-xl border border-accent/30 bg-accent/5 hover:bg-accent/10 hover:border-accent/50 px-4 py-3.5 text-sm font-medium text-foreground transition-all duration-300 flex items-center justify-center gap-2 group"
              >
                <Sparkles className="h-4 w-4 text-accent group-hover:rotate-12 transition-transform" />
                Demo-Portal ansehen
                <span className="text-xs text-muted-foreground font-light">
                  (ohne Login)
                </span>
              </button>
              <p className="text-center text-xs text-muted-foreground/60">
                Beispiel-Mandant Maximilian Müller
              </p>
            </form>
          )}

          <p className="text-center text-sm text-muted-foreground mt-10">
            Sie sind Mitarbeiter der Kanzlei?{" "}
            <Link
              to="/login"
              className="text-accent hover:text-gold-dark transition-colors font-medium"
            >
              Zum Kanzlei-Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PortalLogin;
