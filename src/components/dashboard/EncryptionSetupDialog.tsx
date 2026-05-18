import { useState } from "react";
import { Lock, Shield, AlertTriangle, Copy, Check, Eye, EyeOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useEncryption } from "@/contexts/EncryptionContext";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = "intro" | "set-passphrase" | "show-recovery" | "verify" | "done";

const passphraseStrength = (
  s: string,
): { score: 0 | 1 | 2 | 3 | 4; label: string } => {
  if (s.length < 10) return { score: 0, label: "zu kurz (≥ 10 Zeichen)" };
  let pts = 0;
  if (s.length >= 14) pts++;
  if (/[a-z]/.test(s) && /[A-Z]/.test(s)) pts++;
  if (/\d/.test(s)) pts++;
  if (/[^a-zA-Z0-9]/.test(s)) pts++;
  const labels = ["schwach", "ausreichend", "gut", "stark", "sehr stark"];
  return { score: Math.min(4, pts) as 0 | 1 | 2 | 3 | 4, label: labels[pts] };
};

/**
 * 4-Step Onboarding-Dialog für E2E-Verschlüsselung. Anwalt setzt eine
 * Passphrase, kriegt einen 12-Wort Recovery-Code, muss ihn 1× bestätigen,
 * dann ist E2E aktiv.
 */
const EncryptionSetupDialog = ({ open, onOpenChange }: Props) => {
  const enc = useEncryption();
  const [step, setStep] = useState<Step>("intro");
  const [passphrase, setPassphrase] = useState("");
  const [passphraseAgain, setPassphraseAgain] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [recovery, setRecovery] = useState<string | null>(null);
  const [recoveryConfirm, setRecoveryConfirm] = useState("");
  const [recoveryCopied, setRecoveryCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const strength = passphraseStrength(passphrase);

  const reset = () => {
    setStep("intro");
    setPassphrase("");
    setPassphraseAgain("");
    setRecovery(null);
    setRecoveryConfirm("");
    setRecoveryCopied(false);
  };

  const handleClose = (next: boolean) => {
    if (!next && step !== "intro" && step !== "done") {
      const ok = confirm(
        "Setup abbrechen? Die Verschlüsselung wird nicht aktiviert.",
      );
      if (!ok) return;
    }
    if (!next) reset();
    onOpenChange(next);
  };

  const handleStartSetup = async () => {
    if (strength.score < 2) {
      toast.error("Passphrase zu schwach", {
        description: "Mindestens 14 Zeichen + Mix aus Groß/Klein/Zahl empfohlen.",
      });
      return;
    }
    if (passphrase !== passphraseAgain) {
      toast.error("Passphrasen stimmen nicht überein.");
      return;
    }
    setSubmitting(true);
    try {
      const bootstrap = await enc.setup(passphrase);
      setRecovery(bootstrap.recovery_mnemonic);
      setStep("show-recovery");
    } catch (e) {
      toast.error("Setup fehlgeschlagen", {
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyRecovery = () => {
    if (recoveryConfirm.trim().toLowerCase() !== recovery?.trim().toLowerCase()) {
      toast.error("Recovery-Code stimmt nicht.", {
        description:
          "Bitte kopieren Sie den Code 1:1. Groß-/Kleinschreibung wird ignoriert.",
      });
      return;
    }
    setStep("done");
    toast.success("E2E-Verschlüsselung aktiv", {
      description: "Ab sofort sind sensible Felder Mandatsgeheimnis-konform.",
    });
  };

  const handleCopyRecovery = async () => {
    if (!recovery) return;
    await navigator.clipboard.writeText(recovery);
    setRecoveryCopied(true);
    toast.success("In Zwischenablage kopiert");
    setTimeout(() => setRecoveryCopied(false), 2200);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-success" />
            Mandatsgeheimnis-Verschlüsselung einrichten
          </DialogTitle>
          <DialogDescription>
            §203 StGB-konform. Sensible Felder werden client-side
            verschlüsselt — auch wir können sie nicht lesen.
          </DialogDescription>
        </DialogHeader>

        {step === "intro" && (
          <div className="space-y-4 py-2">
            <div className="surface-info p-4 space-y-2">
              <div className="text-xs uppercase tracking-wider font-semibold text-info">
                Was wird verschlüsselt
              </div>
              <ul className="text-sm space-y-1 text-foreground">
                <li>• Anwalts-Strategien (Sachverhalt, rechtliche Einordnung, Risiken)</li>
                <li>• Mandanten-Notizen</li>
                <li>• Akten-Beschreibung + nächste Schritte</li>
              </ul>
              <p className="text-xs text-muted-foreground pt-2">
                Stammdaten (Name, Aktenzeichen, Termine) bleiben unverschlüsselt —
                sonst kann die KI-Empfangskraft sie nicht nutzen.
              </p>
            </div>

            <div className="surface-warning p-4 space-y-1">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-semibold text-warning">
                <AlertTriangle className="h-3.5 w-3.5" />
                Wichtig
              </div>
              <p className="text-sm text-foreground">
                Sie wählen eine Passphrase. SYSTEMS speichert sie NICHT. Wenn Sie
                sie vergessen UND den Recovery-Code verlieren, sind die
                verschlüsselten Daten endgültig weg.
              </p>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => handleClose(false)}>
                Abbrechen
              </Button>
              <Button onClick={() => setStep("set-passphrase")}>
                Verstanden, weiter
              </Button>
            </div>
          </div>
        )}

        {step === "set-passphrase" && (
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1.5">
                Passphrase
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  placeholder="Mindestens 14 Zeichen"
                  className="w-full px-3 py-2.5 pr-10 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPass ? "verbergen" : "zeigen"}
                >
                  {showPass ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {passphrase && (
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full transition-all"
                      style={{
                        width: `${(strength.score / 4) * 100}%`,
                        background:
                          strength.score >= 3
                            ? "hsl(var(--status-success))"
                            : strength.score >= 2
                              ? "hsl(var(--status-warning))"
                              : "hsl(var(--status-critical))",
                      }}
                    />
                  </div>
                  <span className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">
                    {strength.label}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1.5">
                Passphrase wiederholen
              </label>
              <input
                type={showPass ? "text" : "password"}
                value={passphraseAgain}
                onChange={(e) => setPassphraseAgain(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setStep("intro")}>
                Zurück
              </Button>
              <Button
                onClick={handleStartSetup}
                disabled={
                  submitting ||
                  passphrase.length < 10 ||
                  passphrase !== passphraseAgain
                }
              >
                {submitting ? "Setup läuft …" : "Verschlüsselung aktivieren"}
              </Button>
            </div>
          </div>
        )}

        {step === "show-recovery" && recovery && (
          <div className="space-y-4 py-2">
            <div className="surface-warning p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <span className="text-xs uppercase tracking-wider font-semibold text-warning">
                  Drucken Sie diesen Code aus
                </span>
              </div>
              <p className="text-sm text-foreground">
                Wenn Sie die Passphrase vergessen, ist das der einzige Weg
                zurück zu Ihren Daten. Verwahren Sie ihn im Tresor — niemals
                digital.
              </p>
            </div>

            <div className="p-5 rounded-lg border-2 border-dashed border-border bg-muted/30">
              <div className="font-mono text-base leading-relaxed tracking-wide text-foreground">
                {recovery.split(" ").map((w, i) => (
                  <span key={i} className="inline-block mr-3 mb-1">
                    <span className="text-[10px] text-muted-foreground tabular-nums mr-1">
                      {i + 1}.
                    </span>
                    {w}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyRecovery}
                className="flex-1"
              >
                {recoveryCopied ? (
                  <>
                    <Check className="mr-2 h-3.5 w-3.5" />
                    Kopiert
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-3.5 w-3.5" />
                    Kopieren
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="flex-1"
              >
                Drucken
              </Button>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={() => setStep("verify")}>
                Habe ich gespeichert — weiter
              </Button>
            </div>
          </div>
        )}

        {step === "verify" && (
          <div className="space-y-4 py-2">
            <p className="text-sm text-foreground">
              Bitte tippen oder fügen Sie den Recovery-Code zur Bestätigung ein.
            </p>
            <textarea
              value={recoveryConfirm}
              onChange={(e) => setRecoveryConfirm(e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/30 resize-none"
              autoFocus
            />
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setStep("show-recovery")}>
                Code nochmal anzeigen
              </Button>
              <Button
                onClick={handleVerifyRecovery}
                disabled={!recoveryConfirm.trim()}
              >
                Bestätigen
              </Button>
            </div>
          </div>
        )}

        {step === "done" && (
          <div className="space-y-4 py-2 text-center">
            <div className="mx-auto h-14 w-14 rounded-full surface-success flex items-center justify-center">
              <Lock className="h-7 w-7 text-success" />
            </div>
            <div>
              <h3 className="text-base font-display font-semibold text-foreground">
                E2E-Verschlüsselung aktiv
              </h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-prose mx-auto">
                Ihre sensiblen Daten werden ab sofort vor dem Speichern
                verschlüsselt. Beim nächsten Login geben Sie Ihre Passphrase ein.
              </p>
            </div>
            <Button
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
            >
              Fertig
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EncryptionSetupDialog;
