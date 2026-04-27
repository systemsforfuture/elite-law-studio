import { useMemo, useState } from "react";
import {
  FileText,
  ArrowLeft,
  Upload,
  ScanLine,
  AlertOctagon,
  ShieldCheck,
  FileCheck2,
  Sparkles,
  Search,
} from "lucide-react";
import { findMandant, mandantName } from "@/data/mockData";
import type { Dokument, DokumentStatus } from "@/data/types";
import { useDokumenteQuery, useUploadDokument, useSignedUrl } from "@/lib/queries/use-dokumente";
import { useTenant } from "@/contexts/TenantContext";
import { isSameDay } from "@/lib/date-utils";
import { toast } from "sonner";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { SkeletonRow } from "@/components/dashboard/SkeletonLoaders";

const statusBadge: Record<DokumentStatus, { label: string; cls: string }> = {
  neu: { label: "Neu", cls: "bg-sky-500/15 text-sky-700" },
  ki_analysiert: {
    label: "KI-analysiert",
    cls: "bg-purple-500/15 text-purple-700",
  },
  geprueft: { label: "Geprüft", cls: "bg-emerald-500/15 text-emerald-700" },
  freigegeben: {
    label: "Freigegeben",
    cls: "bg-emerald-500/15 text-emerald-700",
  },
  veraltet: { label: "Veraltet", cls: "bg-muted text-muted-foreground" },
};

const formatBytes = (b: number) => {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
};

const DokumentePage = () => {
  const [selected, setSelected] = useState<Dokument | null>(null);
  const [query, setQuery] = useState("");
  const { data: dokumente = [], isLoading } = useDokumenteQuery();
  const upload = useUploadDokument();
  const { tenant } = useTenant();
  const fileRef = useRef<HTMLInputElement>(null);
  const { url: previewUrl } = useSignedUrl(selected?.storage_path);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (file.size > 25 * 1024 * 1024) {
      toast.error("Datei zu groß", { description: "Maximal 25 MB" });
      return;
    }
    const t = toast.loading(`Lade ${file.name} hoch…`);
    try {
      await upload.mutateAsync({ tenant_id: tenant.id, file });
      toast.success("Upload abgeschlossen", {
        id: t,
        description: "KI-Analyse läuft im Hintergrund.",
      });
    } catch (err) {
      toast.error("Upload fehlgeschlagen", {
        id: t,
        description: err instanceof Error ? err.message : String(err),
      });
    }
  };

  if (selected) {
    const md = findMandant(selected.mandant_id);
    const ai = selected.ai_extracted;

    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelected(null)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück zur Dokumentenliste
        </button>

        <div className="grid lg:grid-cols-[1fr_1.3fr] gap-6">
          <div className="glass-card p-6 border-border/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center shrink-0">
                <FileText className="h-5 w-5 text-rose-600" />
              </div>
              <div className="min-w-0">
                <h2 className="font-display font-bold text-foreground truncate">
                  {selected.dateiname}
                </h2>
                <div className="text-xs text-muted-foreground">
                  {formatBytes(selected.groesse_bytes)} ·{" "}
                  {selected.mime_type}
                </div>
              </div>
            </div>

            {previewUrl ? (
              selected.mime_type?.startsWith("image/") ? (
                <img
                  src={previewUrl}
                  alt={selected.dateiname}
                  className="w-full rounded-xl mb-4 border border-border/40 max-h-[480px] object-contain bg-muted/20"
                />
              ) : (
                <iframe
                  src={previewUrl}
                  title={selected.dateiname}
                  className="w-full h-[480px] rounded-xl mb-4 border border-border/40 bg-white"
                />
              )
            ) : (
              <div className="bg-muted/30 rounded-xl p-12 flex items-center justify-center mb-4 border border-border/40">
                <div className="text-center">
                  <FileText className="h-16 w-16 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-xs text-muted-foreground">
                    Vorschau nicht verfügbar
                  </p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">
                    Datei im Demo-Modus oder Storage nicht erreichbar
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2 text-sm">
              <Field
                label="Mandant"
                value={md ? mandantName(md) : "—"}
              />
              <Field
                label="Hochgeladen"
                value={new Date(selected.uploaded_at).toLocaleString("de-DE")}
              />
              <Field label="Quelle" value={selected.uploaded_by} />
              <Field
                label="Status"
                value={statusBadge[selected.status].label}
              />
            </div>

            <div className="flex gap-2 mt-5">
              <Button variant="gold" size="sm" className="rounded-xl flex-1">
                Freigeben
              </Button>
              <Button variant="outline" size="sm" className="rounded-xl">
                Download
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {ai ? (
              <>
                <div className="glass-card p-6 border-purple-500/30 bg-purple-500/[0.03]">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <ScanLine className="h-4 w-4 text-purple-600" />
                      <h3 className="text-sm font-display font-bold text-foreground">
                        KI-Extraktion
                      </h3>
                    </div>
                    <span className="text-[10px] uppercase tracking-wider font-bold text-purple-700 bg-purple-500/15 px-2 py-0.5 rounded">
                      Konfidenz {(ai.konfidenz * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground/70 mb-1">
                        Dokument-Typ
                      </div>
                      <div className="text-sm font-semibold text-foreground">
                        {ai.dokument_typ}
                      </div>
                    </div>
                    {ai.parteien && ai.parteien.length > 0 && (
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground/70 mb-1">
                          Parteien
                        </div>
                        <ul className="text-sm text-foreground space-y-0.5">
                          {ai.parteien.map((p) => (
                            <li key={p}>· {p}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground/70 mb-1">
                        Zusammenfassung
                      </div>
                      <p className="text-sm text-foreground/80 leading-relaxed">
                        {ai.zusammenfassung}
                      </p>
                    </div>
                  </div>
                </div>

                {ai.kritische_klauseln && ai.kritische_klauseln.length > 0 && (
                  <div className="glass-card p-6 border-amber-500/30 bg-amber-500/[0.03]">
                    <h3 className="text-sm font-display font-bold text-foreground mb-3 flex items-center gap-2">
                      <AlertOctagon className="h-4 w-4 text-amber-600" />
                      Kritische Klauseln
                    </h3>
                    <div className="space-y-2">
                      {ai.kritische_klauseln.map((k, i) => (
                        <div
                          key={i}
                          className="p-3 rounded-xl border border-amber-500/20 bg-background/40"
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded shrink-0 mt-0.5 ${
                                k.risiko === "high"
                                  ? "bg-rose-500/15 text-rose-700"
                                  : k.risiko === "medium"
                                  ? "bg-amber-500/15 text-amber-700"
                                  : "bg-sky-500/15 text-sky-700"
                              }`}
                            >
                              {k.risiko}
                            </span>
                            <p className="text-sm text-foreground flex-1">
                              {k.text}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {ai.fristen && ai.fristen.length > 0 && (
                  <div className="glass-card p-6 border-border/50">
                    <h3 className="text-sm font-display font-bold text-foreground mb-3">
                      Erkannte Fristen
                    </h3>
                    <div className="space-y-2">
                      {ai.fristen.map((f, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20"
                        >
                          <span className="text-sm text-foreground">
                            {f.titel}
                          </span>
                          <span className="text-sm font-bold tabular-nums text-foreground">
                            {new Date(f.datum).toLocaleDateString("de-DE")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="glass-card p-8 border-border/50 text-center">
                <ScanLine className="h-10 w-10 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-sm font-semibold text-foreground mb-2">
                  KI-Analyse läuft…
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  Dokument wurde gerade hochgeladen. Analyse-Dauer ~30 Sek.
                </p>
                <Button variant="gold" size="sm" className="rounded-xl">
                  <Sparkles className="mr-2 h-3.5 w-3.5" />
                  Analyse jetzt starten
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const filtered = dokumente.filter((d) =>
    !query || d.dateiname.toLowerCase().includes(query.toLowerCase()),
  );

  const stats = useMemo(() => {
    const total = dokumente.length;
    const totalBytes = dokumente.reduce((s, d) => s + (d.groesse_bytes ?? 0), 0);
    const analysiert = dokumente.filter(
      (d) => d.status !== "neu" || d.ai_extracted,
    ).length;
    const aiPct = total === 0 ? 0 : Math.round((analysiert / total) * 100);
    const today = dokumente.filter((d) => isSameDay(d.uploaded_at));
    const todayMandant = today.filter((d) => d.uploaded_by === "mandant").length;
    const risikoKlauseln = dokumente.reduce(
      (s, d) => s + (d.ai_extracted?.kritische_klauseln?.length ?? 0),
      0,
    );
    const risikoHigh = dokumente.reduce(
      (s, d) =>
        s +
        (d.ai_extracted?.kritische_klauseln?.filter((k) => k.risiko === "high")
          .length ?? 0),
      0,
    );
    return {
      total,
      totalBytes,
      analysiert,
      aiPct,
      todayCount: today.length,
      todayMandant,
      risikoKlauseln,
      risikoHigh,
    };
  }, [dokumente]);

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-4 gap-4">
        <Stat
          label="Dokumente gesamt"
          value={stats.total.toLocaleString("de-DE")}
          sub={stats.totalBytes === 0 ? "—" : `${formatBytes(stats.totalBytes)} Storage`}
        />
        <Stat
          label="KI-analysiert"
          value={stats.analysiert.toLocaleString("de-DE")}
          sub={stats.total === 0 ? "—" : `${stats.aiPct}% Auto-Quote`}
          accent="emerald"
        />
        <Stat
          label="Heute hochgeladen"
          value={stats.todayCount.toString()}
          sub={stats.todayCount === 0 ? "—" : `${stats.todayMandant} von Mandanten`}
          accent="purple"
        />
        <Stat
          label="Risiko-Klauseln"
          value={stats.risikoKlauseln.toString()}
          sub={stats.risikoHigh === 0 ? "Keine kritisch" : `${stats.risikoHigh} kritisch`}
          accent="amber"
        />
      </div>

      <div className="grid lg:grid-cols-[1fr_3fr] gap-6">
        <div
          className="glass-card p-6 border-2 border-dashed border-accent/20 bg-accent/[0.02] text-center"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFiles(e.dataTransfer.files);
          }}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,image/png,image/jpeg"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <div className="w-14 h-14 rounded-2xl bg-accent/15 flex items-center justify-center mx-auto mb-3">
            <Upload className="h-6 w-6 text-accent" />
          </div>
          <h3 className="text-sm font-display font-bold text-foreground mb-1">
            Upload
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            Drag & Drop oder klicken
          </p>
          <Button
            variant="gold"
            size="sm"
            className="rounded-xl"
            disabled={upload.isPending}
            onClick={() => fileRef.current?.click()}
          >
            {upload.isPending ? "Lade hoch…" : "Datei auswählen"}
          </Button>
          <p className="text-[10px] text-muted-foreground/60 mt-3">
            PDF, JPG, PNG · Max 25 MB
          </p>
          <div className="mt-5 pt-5 border-t border-border/40 text-left space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="h-3 w-3 text-accent" />
              KI-Auto-Tagging
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <FileCheck2 className="h-3 w-3 text-emerald-600" />
              Akten-Zuordnung
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-3 w-3 text-sky-600" />
              Pro-Tenant verschlüsselt
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Dokumente suchen…"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border/50 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </div>

          <div className="glass-card border-border/50 overflow-hidden">
            <div className="divide-y divide-border/40">
              {isLoading && filtered.length === 0 && (
                <>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <SkeletonRow key={i} />
                  ))}
                </>
              )}
              {!isLoading && filtered.length === 0 && (
                <div className="p-12 text-center">
                  <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-sm text-foreground font-medium">
                    Keine Dokumente
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                    Hochgeladene Dokumente werden hier angezeigt — die KI
                    analysiert automatisch Vertragsparteien, Fristen und
                    kritische Klauseln.
                  </p>
                </div>
              )}
              {filtered.map((d) => {
                const md = findMandant(d.mandant_id);
                return (
                  <button
                    key={d.id}
                    onClick={() => setSelected(d)}
                    className="w-full text-left p-4 hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center shrink-0">
                        <FileText className="h-4 w-4 text-rose-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-foreground truncate">
                            {d.dateiname}
                          </span>
                          <span
                            className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${statusBadge[d.status].cls}`}
                          >
                            {statusBadge[d.status].label}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {md ? mandantName(md) : "—"} ·{" "}
                          {formatBytes(d.groesse_bytes)} ·{" "}
                          {new Date(d.uploaded_at).toLocaleDateString("de-DE")}
                        </div>
                        {d.ai_extracted && (
                          <p className="text-xs text-muted-foreground/70 line-clamp-1 mt-1 italic">
                            {d.ai_extracted.zusammenfassung}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
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
  accent?: "emerald" | "purple" | "amber";
}) => {
  const cls =
    accent === "emerald"
      ? "text-emerald-600"
      : accent === "purple"
      ? "text-purple-600"
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

const Field = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between gap-3">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className="text-xs font-medium text-foreground truncate">
      {value}
    </span>
  </div>
);

export default DokumentePage;
