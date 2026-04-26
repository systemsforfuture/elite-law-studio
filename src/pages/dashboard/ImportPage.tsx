import { useRef, useState } from "react";
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
  AlertTriangle,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { parseCsv, useImportData, type ImportResult } from "@/lib/queries/use-import";

type Source = "ra_micro" | "datev" | "advoware" | "excel" | "csv";

const sources: {
  v: Source;
  label: string;
  desc: string;
  icon: typeof FolderArchive;
}[] = [
  {
    v: "ra_micro",
    label: "RA-MICRO",
    desc: "CSV-Export aus Adressbuch",
    icon: FolderArchive,
  },
  {
    v: "datev",
    label: "DATEV Anwalt",
    desc: "Mandanten-CSV",
    icon: FolderArchive,
  },
  {
    v: "advoware",
    label: "Advoware",
    desc: "CSV-Export",
    icon: FolderArchive,
  },
  {
    v: "excel",
    label: "Excel / CSV",
    desc: "Universal mit KI-Mapping",
    icon: FileSpreadsheet,
  },
];

const STEP_LABELS = ["Quelle", "Upload", "Mapping", "Vorschau", "Import"];

const ImportPage = () => {
  const [step, setStep] = useState(0);
  const [src, setSrc] = useState<Source | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [filename, setFilename] = useState<string>("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const importer = useImportData();
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep(0);
    setSrc(null);
    setHeaders([]);
    setRows([]);
    setMappings({});
    setResult(null);
    setFilename("");
  };

  const handleFile = async (file: File) => {
    setFilename(file.name);
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Datei zu groß", { description: "Max. 10 MB" });
      return;
    }
    try {
      const text = await file.text();
      const parsed = parseCsv(text);
      if (parsed.rows.length === 0) {
        toast.error("Keine Datensätze gefunden", {
          description: "Datei scheint leer zu sein oder Format wird nicht erkannt.",
        });
        return;
      }
      setHeaders(parsed.headers);
      setRows(parsed.rows);
      // Heuristisches Initial-Mapping
      const initial: Record<string, string> = {};
      for (const h of parsed.headers) {
        const lower = h.toLowerCase();
        if (lower.includes("vorname") || lower.includes("first")) initial[h] = "vorname";
        else if (lower.includes("nachname") || lower.includes("last")) initial[h] = "nachname";
        else if (lower.includes("firma") || lower.includes("company")) initial[h] = "firmenname";
        else if (lower.includes("mail")) initial[h] = "email";
        else if (lower.includes("tel") || lower.includes("phone")) initial[h] = "telefon";
        else if (lower.includes("whatsapp") || lower.includes("handy")) initial[h] = "whatsapp";
        else if (lower.includes("sachgebiet") || lower.includes("rechtsgebiet"))
          initial[h] = "rechtsgebiet";
        else if (lower.includes("notiz") || lower.includes("note")) initial[h] = "notes_preview";
        else initial[h] = "skip";
      }
      setMappings(initial);
      setStep(2);
      toast.success(`${parsed.rows.length} Datensätze gelesen`);
    } catch (e) {
      toast.error("Datei konnte nicht gelesen werden", {
        description: e instanceof Error ? e.message : String(e),
      });
    }
  };

  const handleImport = async () => {
    if (!src) return;
    const t = toast.loading(`Importiere ${rows.length} Mandanten…`, {
      description: "Bulk-Insert in Batches á 100",
    });
    try {
      const r = await importer.mutateAsync({
        source: src,
        headers,
        rows,
        mapping: mappings,
      });
      setResult(r);
      setStep(4);
      toast.success(`${r.inserted} von ${r.total} importiert`, {
        id: t,
        description:
          r.errors.length > 0 ? `${r.errors.length} Zeilen mit Fehlern` : "Alles sauber",
      });
    } catch (e) {
      toast.error("Import fehlgeschlagen", {
        id: t,
        description: e instanceof Error ? e.message : String(e),
      });
    }
  };

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
          Mandanten aus Ihrem bestehenden System in 30 Minuten. KI mapped
          Spalten-Namen automatisch, Bulk-Insert in Batches, idempotent bei
          Fehlern.
        </p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2 mb-2 overflow-x-auto">
        {STEP_LABELS.map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1 min-w-fit">
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
        ))}
      </div>

      {/* STEP 0 — Quelle */}
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
                <div className="text-xs text-muted-foreground mt-1">{s.desc}</div>
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

      {/* STEP 1 — Upload */}
      {step === 1 && (
        <div
          className="glass-card p-12 border-2 border-dashed border-accent/20 bg-accent/[0.02] text-center"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (f) handleFile(f);
          }}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv,.txt"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          <Upload className="h-14 w-14 text-accent mx-auto mb-4" />
          <h3 className="text-xl font-display font-bold text-foreground mb-2">
            Datei hochladen
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            CSV-Datei mit Mandanten-Liste · Drag & Drop oder klicken
          </p>
          <Button
            variant="gold"
            size="lg"
            className="rounded-xl"
            onClick={() => fileRef.current?.click()}
          >
            Datei auswählen
          </Button>
          <p className="text-[11px] text-muted-foreground/60 mt-4">
            Max 10 MB · 5.000 Zeilen · UTF-8 · Trenner: , ; oder Tab
          </p>
        </div>
      )}

      {/* STEP 2 — Mapping */}
      {step === 2 && (
        <div className="glass-card p-6 border-border/50">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-4 w-4 text-accent" />
            <h3 className="font-display font-bold text-foreground">
              Spalten-Mapping
            </h3>
            <span className="text-[10px] uppercase font-bold text-accent bg-accent/15 px-2 py-0.5 rounded">
              {filename}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mb-5">
            Heuristisches Initial-Mapping. Korrigieren Sie wo nötig — KI macht
            die finale Zuordnung beim Import.
          </p>

          <div className="space-y-2">
            {headers.map((h) => (
              <div
                key={h}
                className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-muted/20"
              >
                <span className="text-sm font-semibold text-foreground flex-1 truncate">
                  {h}
                </span>
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  Beispiel: „{rows[0]?.[headers.indexOf(h)]?.slice(0, 30) ?? ""}"
                </span>
                <span className="text-xs text-muted-foreground">→</span>
                <select
                  value={mappings[h] ?? "skip"}
                  onChange={(e) =>
                    setMappings({ ...mappings, [h]: e.target.value })
                  }
                  className="text-xs px-2 py-1.5 rounded-lg border border-border/50 bg-background min-w-[140px] font-mono"
                >
                  <option value="skip">— ignorieren —</option>
                  <option value="vorname">vorname</option>
                  <option value="nachname">nachname</option>
                  <option value="firmenname">firmenname</option>
                  <option value="email">email</option>
                  <option value="telefon">telefon</option>
                  <option value="whatsapp">whatsapp</option>
                  <option value="rechtsgebiet">rechtsgebiet</option>
                  <option value="notes_preview">notes_preview</option>
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 3 — Vorschau */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-4">
            <Stat label="Gesamt" value={String(rows.length)} sub="Datensätze" />
            <Stat
              label="Aktive Mappings"
              value={String(
                Object.values(mappings).filter((m) => m !== "skip").length,
              )}
              sub="Spalten gemapped"
              accent="emerald"
            />
            <Stat
              label="Übersprungen"
              value={String(
                Object.values(mappings).filter((m) => m === "skip").length,
              )}
              sub="Spalten ignoriert"
              accent="amber"
            />
          </div>

          <div className="glass-card p-6 border-border/50">
            <h3 className="font-display font-bold text-foreground mb-3">
              Stichprobe (erste 5 Datensätze)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-muted-foreground/70 border-b border-border/40">
                  <tr>
                    {Object.entries(mappings)
                      .filter(([, t]) => t !== "skip")
                      .map(([src, target]) => (
                        <th
                          key={src}
                          className="text-left p-2 font-semibold whitespace-nowrap"
                        >
                          <span className="text-foreground">{target}</span>
                          <span className="text-muted-foreground/60 block text-[9px] font-normal mt-0.5">
                            ← {src}
                          </span>
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 5).map((row, i) => (
                    <tr key={i} className="border-b border-border/30">
                      {Object.entries(mappings)
                        .filter(([, t]) => t !== "skip")
                        .map(([src]) => (
                          <td key={src} className="p-2 text-foreground">
                            {row[headers.indexOf(src)]?.slice(0, 50) ?? "—"}
                          </td>
                        ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4 — Resultat */}
      {step === 4 && result && (
        <div className="space-y-4">
          <div className="glass-card p-12 border-emerald-500/30 bg-emerald-500/[0.04] text-center">
            <CheckCircle2 className="h-16 w-16 text-emerald-600 mx-auto mb-4" />
            <h3 className="text-2xl font-display font-bold text-foreground mb-2">
              Import abgeschlossen
            </h3>
            <p className="text-3xl font-display font-black text-emerald-700 tabular-nums my-4">
              {result.inserted} <span className="text-lg text-muted-foreground">/ {result.total}</span>
            </p>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Mandanten wurden in Ihre SYSTEMS-Plattform übernommen und sind ab
              sofort sichtbar — KI-Triage und Voice-Agent kennen sie.
            </p>
          </div>

          {result.errors.length > 0 && (
            <div className="glass-card p-6 border-amber-500/30 bg-amber-500/[0.04]">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <h3 className="font-display font-bold text-foreground">
                  {result.errors.length} Zeilen mit Fehlern
                </h3>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1 text-xs">
                {result.errors.slice(0, 20).map((e, i) => (
                  <div
                    key={i}
                    className="flex justify-between p-2 rounded bg-background/40 border border-amber-500/15"
                  >
                    <span className="text-muted-foreground">Zeile {e.row}</span>
                    <span className="text-foreground">{e.reason}</span>
                  </div>
                ))}
                {result.errors.length > 20 && (
                  <div className="text-muted-foreground italic">
                    + {result.errors.length - 20} weitere
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer-Navigation */}
      <div className="flex items-center justify-between pt-4">
        <Button
          variant="ghost"
          onClick={() => {
            if (step === 0) return;
            if (step === 4) {
              reset();
              return;
            }
            setStep(step - 1);
          }}
          disabled={step === 0}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {step === 4 ? "Neuer Import" : "Zurück"}
        </Button>

        {step === 0 && (
          <Button
            variant="gold"
            onClick={() => setStep(1)}
            disabled={!src}
            className="rounded-xl"
          >
            Weiter
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}

        {step === 2 && (
          <Button
            variant="gold"
            onClick={() => setStep(3)}
            className="rounded-xl"
          >
            Weiter zur Vorschau
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}

        {step === 3 && (
          <Button
            variant="gold"
            onClick={handleImport}
            disabled={importer.isPending}
            className="rounded-xl glow-sm-gold"
          >
            {importer.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importiere…
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                {rows.length} Mandanten importieren
              </>
            )}
          </Button>
        )}
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
