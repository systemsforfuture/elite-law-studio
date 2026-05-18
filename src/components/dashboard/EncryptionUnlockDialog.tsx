import { useState } from "react";
import { Lock, Eye, EyeOff, KeyRound } from "lucide-react";
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

const EncryptionUnlockDialog = ({ open, onOpenChange }: Props) => {
  const enc = useEncryption();
  const [mode, setMode] = useState<"pass" | "recovery">("pass");
  const [passphrase, setPassphrase] = useState("");
  const [mnemonic, setMnemonic] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleUnlock = async () => {
    setSubmitting(true);
    try {
      if (mode === "pass") {
        await enc.unlock(passphrase);
      } else {
        await enc.unlockRecovery(mnemonic);
      }
      toast.success("Entsperrt", {
        description: "Verschlüsselte Felder sind jetzt sichtbar.",
      });
      setPassphrase("");
      setMnemonic("");
      onOpenChange(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(
        msg === "invalid_passphrase"
          ? "Passphrase falsch"
          : msg === "invalid_recovery"
            ? "Recovery-Code falsch"
            : "Entsperren fehlgeschlagen",
        { description: msg },
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-info" />
            Verschlüsselte Daten entsperren
          </DialogTitle>
          <DialogDescription>
            Geben Sie Ihre Passphrase ein. Der Schlüssel bleibt nur in dieser
            Browser-Session.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="flex gap-1 border-b border-border/50">
            <button
              onClick={() => setMode("pass")}
              className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                mode === "pass"
                  ? "border-accent text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Passphrase
            </button>
            <button
              onClick={() => setMode("recovery")}
              className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                mode === "recovery"
                  ? "border-accent text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <KeyRound className="h-3.5 w-3.5" />
              Recovery-Code
            </button>
          </div>

          {mode === "pass" ? (
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && passphrase) handleUnlock();
                }}
                placeholder="Ihre Passphrase"
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
          ) : (
            <textarea
              value={mnemonic}
              onChange={(e) => setMnemonic(e.target.value)}
              rows={3}
              placeholder="12 Wörter aus dem Recovery-Code, durch Leerzeichen getrennt"
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/30 resize-none"
              autoFocus
            />
          )}

          <div className="flex gap-2 justify-end pt-1">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Später
            </Button>
            <Button
              onClick={handleUnlock}
              disabled={
                submitting ||
                (mode === "pass" ? !passphrase : !mnemonic.trim())
              }
            >
              {submitting ? "Entsperre …" : "Entsperren"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EncryptionUnlockDialog;
