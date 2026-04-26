import { useState } from "react";
import {
  DatabaseZap,
  Upload,
  Check,
  ArrowRight,
  Sparkles,
  FileSpreadsheet,
  FolderArchive,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const sources = [
  {
    v: "ra_micro",
    label: "RA-MICRO",
    desc: "XML/CSV-Export",
    icon: FolderArchive,
  },
  {
    v: "datev",
    label: "DATEV Anwalt",
    desc: "DATEV-Export",
    icon: FolderArchive,
  },
  {
    v: "advoware",
    label: "Advoware",
    desc: "XML-Export",
    icon: FolderArchive,
  },
  {
    v: "excel",
    label: "Excel / CSV",
    desc: "KI-Mapping",
    icon: FileSpreadsheet,
  },
];

const ImportPage = () => {
  const [step, setStep] = useState(0);
  const [src, setSrc] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="glass-card p-6 border-border/50">
        <div className="flex items-center gap-3 mb-2">
          <DatabaseZap className="h-5 w-5 text-accent" />
          <h2 className="text-xl font-display font-bold text-foreground">
            Daten-Importer
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Migration aus Ihrem bestehenden System in 30 Minuten. Idempotenter
          Sicherer Hintergrund-Job — bei Fehlern automatischer Restart ohne
          Duplikate.
        </p>
      </div>

      <div className="flex items-center gap-2 mb-2">
        {["Quelle wählen", "Upload", "Mapping", "Validierung", "Import"].map(
          (s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium ${
                  i === step
                    ? "bg-accent/15 text-accent ring-2 ring-accent/20"
                    : i < step
                    ? "bg-emerald-500/15 text-emerald-700"
                    : "bg-muted/40 text-muted-foreground"
                }`}
              >
                {i < step ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <span className="font-bold tabular-nums">{i + 1}</span>
                )}
                <span className="hidden sm:inline">{s}</span>
              </div>
              {i < 4 && (
                <div
                  className={`flex-1 h-px ${i < step ? "bg-emerald-500/40" : "bg-border"}`}
                />
              )}
            </div>
          ),
        )}
      </div>

      {step === 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {sources.map((s) => {
            const SrcIcon = s.icon;
            const sel = src === s.v;
            return (
              <button
                key={s.v}
                onClick={() => setSrc(s.v)}
                className={`p-6 rounded-2xl border text-left transition-all ${
                  sel
                    ? "border-accent bg-accent/[0.06] shadow-2xl shadow-accent/10"
                    : "border-border/50 bg-card hover:border-accent/30"
                }`}
              >
                <SrcIcon
                  className={`h-7 w-7 mb-3 ${sel ? "text-accent" : "text-muted-foreground"}`}
                />
                <div className="font-display font-bold text-foreground">
                  {s.label}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {s.desc}
                </div>
                {s.v === "excel" && (
                  <span className="text-[10px] uppercase font-bold text-accent bg-accent/15 px-2 py-0.5 rounded mt-3 inline-block">
                    KI-Auto-Mapping
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {step === 1 && (
        <div className="glass-card p-12 border-2 border-dashed border-accent/20 bg-accent/[0.02] text-center">
          <Upload className="h-14 w-14 text-accent mx-auto mb-4" />
          <h3 className="text-xl font-display font-bold text-foreground mb-2">
            Datei hochladen
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            {src === "excel"
              ? "Excel oder CSV mit Mandanten-Liste"
              : "Export-Datei aus Ihrem aktuellen System"}
          </p>
          <Button variant="gold" size="lg" className="rounded-xl">
            Datei auswählen
          </Button>
          <p className="text-[11px] text-muted-foreground/60 mt-4">
            Max 100 MB · Speicherung erfolgt verschlüsselt in Frankfurt
          </p>
        </div>
      )}

      {step === 2 && (
        <div className="glass-card p-6 border-border/50">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-4 w-4 text-accent" />
            <h3 className="font-display font-bold text-foreground">
              KI-Spalten-Mapping
            </h3>
            <span className="text-[10px] uppercase font-bold text-accent bg-accent/15 px-2 py-0.5 rounded">
              Auto-erkannt
            </span>
          </div>
          <p className="text-xs text-muted-foreground mb-5">
            Die SYSTEMS-KI hat Ihre Spalten automatisch zugeordnet.
            Korrigieren Sie wo nötig.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted-foreground/70 border-b border-border/40">
                <tr>
                  <th className="text-left py-3 font-semibold">Quell-Spalte</th>
                  <th className="text-left py-3 font-semibold">Beispiel</th>
                  <th className="text-left py-3 font-semibold">→ SYSTEMS-Feld</th>
                  <th className="text-right py-3 font-semibold">Konfidenz</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    src: "Vorname",
                    ex: "Maximilian",
                    target: "mandant.vorname",
                    conf: 0.99,
                  },
                  {
                    src: "Nachname",
                    ex: "Müller",
                    target: "mandant.nachname",
                    conf: 0.99,
                  },
                  {
                    src: "E-Mail-Adresse",
                    ex: "max.mueller@email.de",
                    target: "mandant.email",
                    conf: 0.97,
                  },
                  {
                    src: "Tel.",
                    ex: "+49 170…",
                    target: "mandant.telefon",
                    conf: 0.95,
                  },
                  {
                    src: "Sachgebiet",
                    ex: "Familienrecht",
                    target: "mandant.rechtsgebiet",
                    conf: 0.91,
                  },
                  {
                    src: "Aktenzeichen",
                    ex: "1234/23",
                    target: "akte.aktenzeichen",
                    conf: 0.96,
                  },
                ].map((m) => (
                  <tr
                    key={m.src}
                    className="border-b border-border/30 last:border-0"
                  >
                    <td className="py-3 font-semibold text-foreground">
                      {m.src}
                    </td>
                    <td className="py-3 text-muted-foreground italic">
                      {m.ex}
                    </td>
                    <td className="py-3 font-mono text-accent">{m.target}</td>
                    <td className="py-3 text-right">
                      <span className="text-xs font-bold text-emerald-700 tabular-nums">
                        {(m.conf * 100).toFixed(0)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-4">
            <Stat label="Gesamt" value="1.247" sub="Datensätze" />
            <Stat
              label="Validiert"
              value="1.241"
              sub="99.5% sauber"
              accent="emerald"
            />
            <Stat
              label="Probleme"
              value="6"
              sub="Manuelle Prüfung"
              accent="amber"
            />
          </div>

          <div className="glass-card p-6 border-border/50">
            <h3 className="font-display font-bold text-foreground mb-3">
              Stichproben-Vorschau (10 zufällige Datensätze)
            </h3>
            <div className="space-y-2">
              {[
                { name: "Müller, Maximilian", email: "max.mueller@email.de", ok: true },
                { name: "Weber, Anna", email: "anna.weber@gmx.de", ok: true },
                { name: "Schmidt Logistik GmbH", email: "kontakt@schmidt-logistik.de", ok: true },
                { name: "Klein, Petra", email: "p.klein@web.de", ok: true },
                { name: "(leer)", email: "muster@…", ok: false, problem: "Nachname fehlt" },
              ].map((row, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    row.ok
                      ? "border-border/50 bg-muted/20"
                      : "border-amber-500/30 bg-amber-500/[0.04]"
                  }`}
                >
                  {row.ok ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Loader2 className="h-4 w-4 text-amber-600" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-foreground">
                      {row.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {row.email}
                    </div>
                  </div>
                  {!row.ok && (
                    <span className="text-xs text-amber-700">
                      {row.problem}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="glass-card p-12 border-accent/30 bg-accent/[0.04] text-center">
          <CheckCircle2 className="h-16 w-16 text-emerald-600 mx-auto mb-4" />
          <h3 className="text-2xl font-display font-bold text-foreground mb-2">
            Import läuft im Hintergrund
          </h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            1.241 Datensätze werden gerade in Batches á 100 importiert. Sie
            können diese Seite verlassen — wir benachrichtigen Sie per Mail,
            sobald fertig.
          </p>
          <div className="max-w-md mx-auto mb-6">
            <div className="flex justify-between text-xs text-muted-foreground mb-2">
              <span>247 / 1.241 Datensätze</span>
              <span className="tabular-nums">20%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-accent to-gold-dark transition-all"
                style={{ width: "20%" }}
              />
            </div>
          </div>
          <Button variant="outline" className="rounded-xl">
            Im Hintergrund laufen lassen
          </Button>
        </div>
      )}

      <div className="flex items-center justify-between pt-4">
        <Button
          variant="ghost"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
        >
          Zurück
        </Button>
        <Button
          variant="gold"
          className="rounded-xl"
          onClick={() => setStep((s) => Math.min(4, s + 1))}
          disabled={step === 0 && !src}
        >
          {step === 4 ? "Fertig" : "Weiter"}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

const Stat = ({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent?: "emerald" | "amber";
}) => {
  const cls =
    accent === "emerald"
      ? "text-emerald-600"
      : accent === "amber"
      ? "text-amber-600"
      : "text-foreground";
  return (
    <div className="glass-card p-5 border-border/50">
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
        {label}
      </div>
      <div className={`text-3xl font-display font-black tabular-nums ${cls}`}>
        {value}
      </div>
      <div className="text-xs text-muted-foreground mt-1">{sub}</div>
    </div>
  );
};

export default ImportPage;
