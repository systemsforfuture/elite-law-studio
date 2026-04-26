import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Cpu,
  ArrowLeft,
  ArrowRight,
  Check,
  Building2,
  Phone,
  Mic,
  Palette,
  Database,
  CalendarCheck,
  Sparkles,
  Crown,
  Zap,
} from "lucide-react";
import type { SubscriptionTier, Tonalitaet } from "@/data/types";

interface FormState {
  tier: SubscriptionTier;
  kanzlei_name: string;
  inhaber_name: string;
  email: string;
  telefon: string;
  domain: string;
  rechtsgebiete: string[];
  team_size: number;
  tonalitaet: Tonalitaet;
  notfall_nummer: string;
  voice_choice: "standard_f" | "standard_m" | "cloning";
  greeting: string;
  primary_color: string;
  accent_color: string;
  daten_quelle: "ra_micro" | "datev" | "advoware" | "excel" | "kein";
}

const tierMeta: Record<
  SubscriptionTier,
  { icon: typeof Sparkles; label: string; setup: number; monthly: number }
> = {
  foundation: { icon: Sparkles, label: "Foundation", setup: 3900, monthly: 490 },
  growth: { icon: Zap, label: "Growth", setup: 7900, monthly: 990 },
  premium: { icon: Crown, label: "Premium", setup: 14900, monthly: 1890 },
};

const rechtsgebiete = [
  "Familienrecht",
  "Arbeitsrecht",
  "Erbrecht",
  "Vertragsrecht",
  "Strafrecht",
  "Mietrecht",
  "Steuerrecht",
  "Verkehrsrecht",
  "IT-Recht",
  "Wirtschaftsrecht",
];

const Onboarding = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialTier = (params.get("tier") as SubscriptionTier) || "growth";
  const [step, setStep] = useState(0);

  const [form, setForm] = useState<FormState>({
    tier: initialTier,
    kanzlei_name: "",
    inhaber_name: "",
    email: "",
    telefon: "",
    domain: "",
    rechtsgebiete: ["Familienrecht", "Arbeitsrecht"],
    team_size: 3,
    tonalitaet: "freundlich",
    notfall_nummer: "",
    voice_choice: "standard_f",
    greeting: "",
    primary_color: "#1A2A3A",
    accent_color: "#C4B8A4",
    daten_quelle: "kein",
  });

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const toggleRG = (rg: string) =>
    setForm((f) => ({
      ...f,
      rechtsgebiete: f.rechtsgebiete.includes(rg)
        ? f.rechtsgebiete.filter((r) => r !== rg)
        : [...f.rechtsgebiete, rg],
    }));

  const steps = useMemo(
    () => [
      { title: "Kanzlei", icon: Building2 },
      { title: "Tarif", icon: Crown },
      { title: "Profil", icon: Palette },
      { title: "Voice", icon: Mic },
      { title: "Daten", icon: Database },
      { title: "Bestätigen", icon: CalendarCheck },
    ],
    [],
  );

  const tier = tierMeta[form.tier];

  const next = () => setStep((s) => Math.min(s + 1, steps.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));
  const finish = () => navigate("/dashboard");

  return (
    <div className="min-h-screen bg-navy-dark relative overflow-hidden">
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-accent/[0.06] rounded-full blur-[180px]" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-500/[0.04] rounded-full blur-[150px]" />

      <header className="relative border-b border-white/[0.06] backdrop-blur-xl bg-navy-dark/60">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center">
              <Cpu className="h-4 w-4 text-accent" />
            </div>
            <span className="font-display font-bold text-primary-foreground">
              SYSTEMS<sup className="text-accent">™</sup>
            </span>
          </Link>
          <Link
            to="/login"
            className="text-xs text-primary-foreground/40 hover:text-primary-foreground transition-colors"
          >
            Schon Kunde? Login
          </Link>
        </div>
      </header>

      <main className="relative container mx-auto px-6 py-10 max-w-3xl">
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4 overflow-x-auto pb-2">
            {steps.map((s, i) => {
              const Icon = s.icon;
              const done = i < step;
              const active = i === step;
              return (
                <div key={s.title} className="flex items-center gap-3 shrink-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                      done
                        ? "bg-accent text-accent-foreground"
                        : active
                        ? "bg-accent/15 text-accent ring-4 ring-accent/10"
                        : "bg-white/[0.04] text-primary-foreground/30"
                    }`}
                  >
                    {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <span
                    className={`text-xs font-medium hidden sm:inline ${
                      active ? "text-primary-foreground" : "text-primary-foreground/40"
                    }`}
                  >
                    {s.title}
                  </span>
                  {i < steps.length - 1 && (
                    <div
                      className={`w-6 sm:w-10 h-px ${done ? "bg-accent" : "bg-white/[0.06]"}`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass-dark p-8 lg:p-10 mb-6">
          {step === 0 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-display font-bold text-primary-foreground mb-1">
                  Stammdaten Ihrer Kanzlei
                </h2>
                <p className="text-sm text-primary-foreground/40">
                  Wir brauchen vier Zeilen, um den Tenant anzulegen.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Field
                  label="Kanzlei-Name"
                  value={form.kanzlei_name}
                  onChange={(v) => update("kanzlei_name", v)}
                  placeholder="Kanzlei Bergmann"
                />
                <Field
                  label="Inhaber"
                  value={form.inhaber_name}
                  onChange={(v) => update("inhaber_name", v)}
                  placeholder="Dr. Maximilian Bergmann"
                />
                <Field
                  label="E-Mail"
                  value={form.email}
                  onChange={(v) => update("email", v)}
                  placeholder="max@kanzlei-bergmann.de"
                  type="email"
                />
                <Field
                  label="Telefon"
                  value={form.telefon}
                  onChange={(v) => update("telefon", v)}
                  placeholder="+49 30 123 456 78"
                />
                <Field
                  label="Wunsch-Domain"
                  value={form.domain}
                  onChange={(v) => update("domain", v)}
                  placeholder="kanzlei-bergmann.de"
                />
                <Field
                  label="Team-Größe (inkl. Sie)"
                  value={String(form.team_size)}
                  onChange={(v) => update("team_size", Number(v) || 1)}
                  type="number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-foreground/80 mb-3">
                  Rechtsgebiete (Mehrfachauswahl)
                </label>
                <div className="flex flex-wrap gap-2">
                  {rechtsgebiete.map((rg) => (
                    <button
                      key={rg}
                      type="button"
                      onClick={() => toggleRG(rg)}
                      className={`px-4 py-2 rounded-xl text-xs font-medium border transition-all ${
                        form.rechtsgebiete.includes(rg)
                          ? "bg-accent/15 border-accent/40 text-accent"
                          : "border-white/[0.08] text-primary-foreground/50 hover:border-white/20 hover:text-primary-foreground"
                      }`}
                    >
                      {rg}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-display font-bold text-primary-foreground mb-1">
                  Tarif wählen
                </h2>
                <p className="text-sm text-primary-foreground/40">
                  Sie können später jederzeit upgraden.
                </p>
              </div>

              <div className="grid gap-3">
                {(["foundation", "growth", "premium"] as SubscriptionTier[]).map(
                  (t) => {
                    const meta = tierMeta[t];
                    const Icon = meta.icon;
                    const selected = form.tier === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => update("tier", t)}
                        className={`text-left p-5 rounded-2xl border transition-all ${
                          selected
                            ? "border-accent bg-accent/[0.08] shadow-2xl shadow-accent/10"
                            : "border-white/[0.08] bg-white/[0.02] hover:border-white/20"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div
                              className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                                selected ? "bg-accent/20" : "bg-white/[0.04]"
                              }`}
                            >
                              <Icon
                                className={`h-5 w-5 ${
                                  selected ? "text-accent" : "text-primary-foreground/50"
                                }`}
                              />
                            </div>
                            <div>
                              <div className="font-display font-bold text-primary-foreground">
                                {meta.label}
                              </div>
                              <div className="text-xs text-primary-foreground/40">
                                {meta.setup.toLocaleString("de-DE")}€ Setup +{" "}
                                {meta.monthly}€/Monat
                              </div>
                            </div>
                          </div>
                          {selected && (
                            <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center">
                              <Check className="h-3.5 w-3.5 text-accent-foreground" />
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  },
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-display font-bold text-primary-foreground mb-1">
                  Tonalität & Branding
                </h2>
                <p className="text-sm text-primary-foreground/40">
                  Wie spricht Ihre KI mit Ihren Mandanten?
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-foreground/80 mb-3">
                  Tonalität
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(
                    [
                      { v: "formal", label: "Formal", desc: "Sehr geehrte..." },
                      { v: "freundlich", label: "Freundlich", desc: "Hallo, schön..." },
                      { v: "empathisch", label: "Empathisch", desc: "Ich verstehe..." },
                      { v: "direkt", label: "Direkt", desc: "Kurz und klar." },
                    ] as { v: Tonalitaet; label: string; desc: string }[]
                  ).map((o) => (
                    <button
                      key={o.v}
                      type="button"
                      onClick={() => update("tonalitaet", o.v)}
                      className={`p-4 rounded-2xl border transition-all text-left ${
                        form.tonalitaet === o.v
                          ? "border-accent/50 bg-accent/[0.08]"
                          : "border-white/[0.08] bg-white/[0.02] hover:border-white/20"
                      }`}
                    >
                      <div className="text-sm font-semibold text-primary-foreground mb-1">
                        {o.label}
                      </div>
                      <div className="text-xs text-primary-foreground/40 italic">
                        „{o.desc}"
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <ColorField
                  label="Primärfarbe"
                  value={form.primary_color}
                  onChange={(v) => update("primary_color", v)}
                />
                <ColorField
                  label="Akzentfarbe"
                  value={form.accent_color}
                  onChange={(v) => update("accent_color", v)}
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-display font-bold text-primary-foreground mb-1">
                  Voice-Setup
                </h2>
                <p className="text-sm text-primary-foreground/40">
                  Stimme Ihrer KI-Empfangskraft.
                </p>
              </div>

              <div className="grid gap-3">
                {[
                  {
                    v: "standard_f" as const,
                    label: "Anna · Weiblich, professionell",
                    desc: "Standardstimme, sofort einsatzbereit.",
                  },
                  {
                    v: "standard_m" as const,
                    label: "Markus · Männlich, professionell",
                    desc: "Standardstimme, sofort einsatzbereit.",
                  },
                  {
                    v: "cloning" as const,
                    label: "Voice-Cloning Ihrer eigenen Stimme",
                    desc: "Premium-Tier. 5 Min Audio-Aufnahme nötig.",
                  },
                ].map((o) => (
                  <button
                    key={o.v}
                    type="button"
                    onClick={() => update("voice_choice", o.v)}
                    className={`text-left p-4 rounded-2xl border transition-all ${
                      form.voice_choice === o.v
                        ? "border-accent/50 bg-accent/[0.08]"
                        : "border-white/[0.08] bg-white/[0.02] hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Mic
                        className={`h-5 w-5 mt-0.5 ${
                          form.voice_choice === o.v
                            ? "text-accent"
                            : "text-primary-foreground/30"
                        }`}
                      />
                      <div>
                        <div className="text-sm font-semibold text-primary-foreground">
                          {o.label}
                        </div>
                        <div className="text-xs text-primary-foreground/40 mt-0.5">
                          {o.desc}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-foreground/80 mb-2">
                  Begrüßung
                </label>
                <textarea
                  value={form.greeting}
                  onChange={(e) => update("greeting", e.target.value)}
                  rows={2}
                  placeholder="Kanzlei Bergmann, mein Name ist Anna. Wie kann ich Ihnen helfen?"
                  className="w-full px-4 py-3 rounded-xl border border-white/[0.08] bg-white/[0.03] text-primary-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/30 placeholder:text-primary-foreground/30"
                />
              </div>

              <div>
                <Field
                  label="Notfall-Nummer (Eskalation)"
                  value={form.notfall_nummer}
                  onChange={(v) => update("notfall_nummer", v)}
                  placeholder="+49 30 123 456 99"
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-display font-bold text-primary-foreground mb-1">
                  Daten-Migration
                </h2>
                <p className="text-sm text-primary-foreground/40">
                  Aus welchem System sollen wir Ihre Bestandsdaten übernehmen?
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { v: "ra_micro" as const, label: "RA-MICRO", desc: "XML/CSV-Export" },
                  { v: "datev" as const, label: "DATEV", desc: "Anwalt classic" },
                  { v: "advoware" as const, label: "Advoware", desc: "XML-Export" },
                  { v: "excel" as const, label: "Excel/CSV", desc: "KI-Mapping" },
                  { v: "kein" as const, label: "Keine Migration", desc: "Frisch starten" },
                ].map((o) => (
                  <button
                    key={o.v}
                    type="button"
                    onClick={() => update("daten_quelle", o.v)}
                    className={`text-left p-4 rounded-2xl border transition-all ${
                      form.daten_quelle === o.v
                        ? "border-accent/50 bg-accent/[0.08]"
                        : "border-white/[0.08] bg-white/[0.02] hover:border-white/20"
                    }`}
                  >
                    <Database
                      className={`h-5 w-5 mb-2 ${
                        form.daten_quelle === o.v
                          ? "text-accent"
                          : "text-primary-foreground/30"
                      }`}
                    />
                    <div className="text-sm font-semibold text-primary-foreground">
                      {o.label}
                    </div>
                    <div className="text-xs text-primary-foreground/40">{o.desc}</div>
                  </button>
                ))}
              </div>

              {form.daten_quelle !== "kein" && (
                <div className="p-5 rounded-xl border border-accent/20 bg-accent/[0.04]">
                  <div className="flex items-start gap-3">
                    <Sparkles className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                    <div className="text-sm text-primary-foreground/70">
                      Nach Setup-Abschluss erhalten Sie eine Anleitung für den
                      Export aus {tierMeta[form.tier].label}-tauglich. Customer
                      Success Lead begleitet die Migration persönlich (T+6h).
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-display font-bold text-primary-foreground mb-1">
                  Bestätigung
                </h2>
                <p className="text-sm text-primary-foreground/40">
                  Letzter Check, dann legen wir Ihren Tenant an.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <Summary label="Kanzlei" value={form.kanzlei_name || "—"} />
                <Summary label="Inhaber" value={form.inhaber_name || "—"} />
                <Summary label="E-Mail" value={form.email || "—"} />
                <Summary label="Domain" value={form.domain || "—"} />
                <Summary label="Tarif" value={tier.label} />
                <Summary
                  label="Setup-Fee"
                  value={`${tier.setup.toLocaleString("de-DE")}€ einmalig`}
                />
                <Summary label="MRR" value={`${tier.monthly}€/Monat`} />
                <Summary label="Tonalität" value={form.tonalitaet} />
                <Summary
                  label="Voice"
                  value={
                    form.voice_choice === "cloning"
                      ? "Voice-Cloning"
                      : form.voice_choice === "standard_f"
                      ? "Anna (weiblich)"
                      : "Markus (männlich)"
                  }
                />
                <Summary
                  label="Daten-Migration"
                  value={
                    form.daten_quelle === "kein"
                      ? "Keine"
                      : form.daten_quelle.toUpperCase()
                  }
                />
              </div>

              <div className="p-5 rounded-xl border border-accent/20 bg-accent/[0.04]">
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                  <div className="text-sm text-primary-foreground/70">
                    <strong className="text-primary-foreground">
                      Welcome-Call in T+2h:
                    </strong>{" "}
                    Customer-Success-Lead ruft Sie zu Ihrem hinterlegten
                    Telefon zurück. Vapi-Telefonnummer ist in 12h aktiv.
                    Live-Schaltung in 24h.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={prev}
            disabled={step === 0}
            className="text-primary-foreground/60 hover:text-primary-foreground hover:bg-white/[0.04]"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück
          </Button>

          <div className="text-xs text-primary-foreground/40 hidden sm:block">
            Schritt {step + 1} von {steps.length}
          </div>

          {step < steps.length - 1 ? (
            <Button variant="gold" onClick={next} className="rounded-xl">
              Weiter
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button variant="gold" onClick={finish} className="rounded-xl glow-sm-gold">
              <Sparkles className="mr-2 h-4 w-4" />
              Tenant anlegen & Dashboard öffnen
            </Button>
          )}
        </div>
      </main>
    </div>
  );
};

const Field = ({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) => (
  <div>
    <label className="block text-sm font-medium text-primary-foreground/80 mb-2">
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-4 py-3 rounded-xl border border-white/[0.08] bg-white/[0.03] text-primary-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/30 placeholder:text-primary-foreground/30"
    />
  </div>
);

const ColorField = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) => (
  <div>
    <label className="block text-sm font-medium text-primary-foreground/80 mb-2">
      {label}
    </label>
    <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-transparent text-primary-foreground text-sm font-mono focus:outline-none"
      />
    </div>
  </div>
);

const Summary = ({ label, value }: { label: string; value: string }) => (
  <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
    <div className="text-[10px] uppercase tracking-wider text-primary-foreground/40 mb-1">
      {label}
    </div>
    <div className="text-sm font-medium text-primary-foreground truncate">
      {value}
    </div>
  </div>
);

export default Onboarding;
