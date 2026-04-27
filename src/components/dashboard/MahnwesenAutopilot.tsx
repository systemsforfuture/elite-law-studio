import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  CheckCircle2,
  SkipForward,
  Send,
  Loader2,
  Receipt,
  ArrowRight,
} from "lucide-react";
import type { Rechnung } from "@/data/types";
import { useGenerateMahnung } from "@/lib/queries/use-rechnungen";
import { findMandant, mandantName } from "@/data/mockData";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  rechnungen: Rechnung[];
}

interface Result {
  rechnung_id: string;
  outcome: "approved" | "skipped";
}

const MahnwesenAutopilot = ({ open, onOpenChange, rechnungen }: Props) => {
  const [step, setStep] = useState(0);
  const [generated, setGenerated] = useState<string>("");
  const [editing, setEditing] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const generate = useGenerateMahnung();

  const current = rechnungen[step];
  const total = rechnungen.length;
  const done = step >= total;

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setGenerated("");
    setEditing(false);
    setResults([]);
  }, [open]);

  useEffect(() => {
    if (!open || !current || generated || generate.isPending) return;
    void (async () => {
      try {
        const res = await generate.mutateAsync(current.id);
        if (res) setGenerated(res.mahn_text);
      } catch (e) {
        toast.error("KI-Generierung fehlgeschlagen", {
          description: e instanceof Error ? e.message : "Unbekannt",
        });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id, open]);

  const next = (outcome: Result["outcome"]) => {
    if (current) {
      setResults((r) => [...r, { rechnung_id: current.id, outcome }]);
    }
    setGenerated("");
    setEditing(false);
    setStep((s) => s + 1);
  };

  const handleApprove = () => {
    toast.success("Mahnung freigegeben", {
      description: `Wird per Email versendet · Stufe ${(current?.mahnstufe ?? 0) + 1}`,
    });
    next("approved");
  };

  const handleSkip = () => next("skipped");

  const closeDone = () => {
    onOpenChange(false);
    const approved = results.filter((r) => r.outcome === "approved").length;
    if (approved > 0) {
      toast.success(`${approved} Mahnungen versendet`, {
        description: "Auto-Pilot abgeschlossen",
      });
    }
  };

  if (total === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" />
              Auto-Pilot
            </DialogTitle>
            <DialogDescription>
              Aktuell sind keine Rechnungen für die nächste Mahn-Stufe fällig.
              Sehr gut!
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => onOpenChange(false)} variant="outline">
            Schließen
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent" />
            Mahnwesen-Auto-Pilot
          </DialogTitle>
          <DialogDescription>
            {done
              ? `Fertig — ${results.filter((r) => r.outcome === "approved").length} freigegeben, ${results.filter((r) => r.outcome === "skipped").length} übersprungen.`
              : `Schritt ${step + 1} von ${total} · KI generiert juristisch korrekte Formulierung pro Stufe.`}
          </DialogDescription>
        </DialogHeader>

        {/* Progress */}
        <div className="flex gap-1 my-1">
          {Array.from({ length: total }).map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full ${
                i < step
                  ? "bg-emerald-500"
                  : i === step
                  ? "bg-accent"
                  : "bg-muted"
              }`}
            />
          ))}
        </div>

        {done ? (
          <div className="text-center py-8">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="h-7 w-7 text-emerald-600" />
            </div>
            <h3 className="text-lg font-display font-bold text-foreground mb-1">
              Auto-Pilot abgeschlossen
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              {results.filter((r) => r.outcome === "approved").length} Mahnungen
              versendet,{" "}
              {results.filter((r) => r.outcome === "skipped").length} manuell
              vermerkt.
            </p>
            <Button onClick={closeDone} variant="gold">
              Schließen
            </Button>
          </div>
        ) : current ? (
          <div className="space-y-4">
            {/* Rechnung-Header */}
            <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Receipt className="h-3 w-3" />
                    Rechnung
                    <span className="font-mono text-foreground">
                      {current.rechnungsnummer}
                    </span>
                  </div>
                  <div className="text-base font-semibold text-foreground mt-0.5">
                    {mandantName(findMandant(current.mandant_id))}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Fällig{" "}
                    {new Date(current.faelligkeit).toLocaleDateString("de-DE")}{" "}
                    · Aktuell Stufe {current.mahnstufe}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-display font-bold text-foreground tabular-nums">
                    {current.betrag_brutto.toLocaleString("de-DE")}€
                  </div>
                  <div className="flex items-center gap-1 text-xs mt-1 text-accent font-semibold">
                    Stufe {current.mahnstufe}
                    <ArrowRight className="h-3 w-3" />
                    {Math.min(current.mahnstufe + 1, 4)}
                  </div>
                </div>
              </div>
            </div>

            {/* KI-Vorschlag */}
            <div className="rounded-xl border border-accent/30 bg-accent/[0.03] p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-3.5 w-3.5 text-accent" />
                <span className="text-xs uppercase tracking-wider font-semibold text-accent">
                  SYSTEMS-KI Entwurf
                </span>
              </div>
              {generate.isPending && !generated ? (
                <div className="py-6 text-center">
                  <Loader2 className="h-5 w-5 text-accent mx-auto animate-spin mb-2" />
                  <p className="text-xs text-muted-foreground">
                    KI formuliert juristisch korrekt …
                  </p>
                </div>
              ) : editing ? (
                <textarea
                  value={generated}
                  onChange={(e) => setGenerated(e.target.value)}
                  rows={10}
                  className="w-full text-sm bg-transparent border border-border/50 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-accent/30 font-mono"
                />
              ) : (
                <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed">
                  {generated}
                </pre>
              )}
              {generated && !editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="text-xs text-accent hover:text-gold-dark mt-3"
                >
                  Text bearbeiten
                </button>
              )}
              {editing && (
                <button
                  onClick={() => setEditing(false)}
                  className="text-xs text-muted-foreground hover:text-foreground mt-3"
                >
                  Vorschau
                </button>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 flex-wrap pt-2">
              <Button
                variant="outline"
                onClick={handleSkip}
                className="flex-1 sm:flex-none"
                disabled={generate.isPending}
              >
                <SkipForward className="mr-2 h-3.5 w-3.5" />
                Überspringen
              </Button>
              <Button
                variant="gold"
                onClick={handleApprove}
                className="flex-1"
                disabled={!generated || generate.isPending}
              >
                <Send className="mr-2 h-3.5 w-3.5" />
                Freigeben & Versenden
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default MahnwesenAutopilot;
