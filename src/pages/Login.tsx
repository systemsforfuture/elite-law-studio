import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Scale, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";

const Login = () => {
  const [role, setRole] = useState<"mandant" | "mitarbeiter">("mandant");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-navy relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 opacity-10">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full border border-accent/20"
              style={{
                width: `${200 + i * 150}px`,
                height: `${200 + i * 150}px`,
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
              }}
            />
          ))}
        </div>
        <div className="relative text-center px-12">
          <Scale className="h-16 w-16 text-accent mx-auto mb-6" />
          <h2 className="text-3xl font-serif font-bold text-primary-foreground mb-4">
            Willkommen im<br />Mandanten-Portal
          </h2>
          <p className="text-primary-foreground/60 max-w-sm mx-auto">
            Verfolgen Sie den Status Ihres Falles, kommunizieren Sie sicher mit Ihrem Anwalt 
            und laden Sie Dokumente hoch – alles an einem Ort.
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <Link to="/" className="flex items-center gap-3 mb-10 lg:hidden">
            <Scale className="h-8 w-8 text-accent" />
            <span className="text-xl font-serif font-bold text-foreground">KANZLEI BERGMANN</span>
          </Link>

          <h1 className="text-2xl font-serif font-bold text-foreground mb-2">Anmelden</h1>
          <p className="text-sm text-muted-foreground mb-8">
            Melden Sie sich in Ihrem Konto an, um fortzufahren.
          </p>

          {/* Role toggle */}
          <div className="flex rounded-lg border border-border p-1 mb-8">
            {(["mandant", "mitarbeiter"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all duration-300 ${
                  role === r
                    ? "bg-navy text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {r === "mandant" ? "Mandant" : "Mitarbeiter"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">E-Mail</label>
              <input
                type="email"
                placeholder="name@beispiel.de"
                className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Passwort</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded border-input" />
                <span className="text-muted-foreground">Angemeldet bleiben</span>
              </label>
              <a href="#" className="text-accent hover:underline font-medium">
                Passwort vergessen?
              </a>
            </div>

            <Button variant="gold" className="w-full" size="lg" type="submit">
              Anmelden
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-8">
            Noch kein Konto?{" "}
            <a href="#" className="text-accent hover:underline font-medium">
              Kontaktieren Sie uns
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
