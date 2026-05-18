import { useState } from "react";
import { Lock, Unlock, ShieldOff, ShieldCheck } from "lucide-react";
import { useEncryption } from "@/contexts/EncryptionContext";
import EncryptionUnlockDialog from "./EncryptionUnlockDialog";
import EncryptionSetupDialog from "./EncryptionSetupDialog";

/**
 * Header-Indikator für den Verschlüsselungs-Status:
 *
 *   1. e2e nicht aktiviert         → grauer „Verschlüsseln" Button (öffnet Setup)
 *   2. e2e aktiv + unlocked        → grünes Schloss „Verschlüsselt"
 *   3. e2e aktiv + nicht unlocked  → orange Schloss „Gesperrt" (öffnet Unlock)
 *
 * Loading wird stumm dargestellt — kein Spinner-Spektakel im Header.
 */
const EncryptionIndicator = () => {
  const enc = useEncryption();
  const [setupOpen, setSetupOpen] = useState(false);
  const [unlockOpen, setUnlockOpen] = useState(false);

  if (enc.loading) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-muted-foreground/60">
        <Lock className="h-3.5 w-3.5" />
      </span>
    );
  }

  if (!enc.enabled) {
    return (
      <>
        <button
          onClick={() => setSetupOpen(true)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border/60 text-xs text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
          title="Mandatsgeheimnis-Verschlüsselung einrichten"
        >
          <ShieldOff className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Verschlüsselung einrichten</span>
        </button>
        <EncryptionSetupDialog open={setupOpen} onOpenChange={setSetupOpen} />
      </>
    );
  }

  if (enc.unlocked) {
    return (
      <button
        onClick={() => enc.lock()}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors"
        style={{
          color: "hsl(var(--status-success))",
          background: "hsl(var(--status-success-soft))",
        }}
        title="Aktiv — klicken zum Sperren"
      >
        <ShieldCheck className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Verschlüsselt</span>
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setUnlockOpen(true)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors"
        style={{
          color: "hsl(var(--status-warning))",
          background: "hsl(var(--status-warning-soft))",
        }}
        title="Verschlüsselte Felder entsperren"
      >
        <Unlock className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Entsperren</span>
      </button>
      <EncryptionUnlockDialog open={unlockOpen} onOpenChange={setUnlockOpen} />
    </>
  );
};

export default EncryptionIndicator;
