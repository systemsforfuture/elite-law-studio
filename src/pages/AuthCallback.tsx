import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Cpu, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const AuthCallback = () => {
  const navigate = useNavigate();
  const { loading, session } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (session) {
      navigate("/dashboard", { replace: true });
    } else {
      const t = setTimeout(() => {
        setError(
          "Magic-Link konnte nicht eingelöst werden. Bitte erneut anfordern.",
        );
      }, 4000);
      return () => clearTimeout(t);
    }
  }, [loading, session, navigate]);

  return (
    <div className="min-h-screen bg-navy-dark flex items-center justify-center px-6">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center mx-auto mb-6 glow-sm-gold">
          <Cpu className="h-8 w-8 text-accent" />
        </div>
        {error ? (
          <>
            <h1 className="text-xl font-display font-bold text-primary-foreground mb-2">
              Login fehlgeschlagen
            </h1>
            <p className="text-sm text-primary-foreground/50 mb-6 max-w-sm">
              {error}
            </p>
            <button
              onClick={() => navigate("/login")}
              className="text-sm text-accent font-medium hover:text-gold-dark"
            >
              Zurück zum Login
            </button>
          </>
        ) : (
          <>
            <Loader2 className="h-5 w-5 text-accent animate-spin mx-auto mb-3" />
            <p className="text-sm text-primary-foreground/60">
              Anmeldung wird verifiziert…
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
