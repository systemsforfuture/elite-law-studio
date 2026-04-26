import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Phone,
  PhoneIncoming,
  Send,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { useTenant } from "@/contexts/TenantContext";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Turn {
  speaker: "ai" | "anrufer";
  text: string;
}

const FAKE_RESPONSES = [
  "Kanzlei Bergmann, mein Name ist Anna. Wie kann ich Ihnen helfen?",
  "Das tut mir leid zu hören. Damit ich Sie an die richtige Person weiterleiten kann: Können Sie mir kurz schildern, worum es genau geht?",
  "Verstehe. Ich biete Ihnen einen Erstgespräch-Termin am 03. Mai um 14 Uhr an. Passt das?",
  "Termin ist gebucht. Sie bekommen gleich eine Bestätigung per E-Mail. Soll ich Ihnen vorab eine Liste mit Unterlagen schicken, die Sie mitbringen sollten?",
];

const VoiceTestDialog = ({ open, onOpenChange }: Props) => {
  const { tenant } = useTenant();
  const [turns, setTurns] = useState<Turn[]>([
    { speaker: "ai", text: tenant.branding_config.greeting ?? FAKE_RESPONSES[0] },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage = input.trim();
    setTurns((t) => [...t, { speaker: "anrufer", text: userMessage }]);
    setInput("");
    setThinking(true);

    // Simulate thinking + response (would be triage-inbox edge function in production)
    setTimeout(
      () => {
        const reply =
          FAKE_RESPONSES[Math.min(turns.length / 2, FAKE_RESPONSES.length - 1)];
        setTurns((t) => [...t, { speaker: "ai", text: reply }]);
        setThinking(false);
      },
      900 + Math.random() * 800,
    );
  };

  const reset = () =>
    setTurns([
      {
        speaker: "ai",
        text: tenant.branding_config.greeting ?? FAKE_RESPONSES[0],
      },
    ]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PhoneIncoming className="h-5 w-5 text-emerald-600" />
            Voice-Agent · Test-Anruf
            <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full ml-auto flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500/60" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              Live-Demo
            </span>
          </DialogTitle>
          <DialogDescription>
            Simulation eines Anrufers. Tippen Sie was ein Mandant sagen würde —
            die SYSTEMS-Voice-KI antwortet wie im Live-Betrieb.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3 py-3 -mx-2 px-2">
          {turns.map((t, i) => (
            <div
              key={i}
              className={`flex gap-3 ${t.speaker === "ai" ? "" : "flex-row-reverse"}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-bold shrink-0 ${
                  t.speaker === "ai"
                    ? "bg-accent/15 text-accent"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {t.speaker === "ai" ? "KI" : "Sie"}
              </div>
              <div
                className={`flex-1 p-3 rounded-xl text-sm ${
                  t.speaker === "ai"
                    ? "bg-accent/[0.06] border border-accent/15"
                    : "bg-muted/40"
                }`}
              >
                <div className="text-[10px] text-muted-foreground mb-1 font-mono">
                  {t.speaker === "ai"
                    ? `Anna (KI · ${tenant.branding_config.tonalitaet})`
                    : "Anrufer"}
                </div>
                <div className="text-foreground">{t.text}</div>
              </div>
            </div>
          ))}

          {thinking && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-accent/15 text-accent shrink-0">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              </div>
              <div className="flex-1 p-3 rounded-xl text-sm bg-accent/[0.06] border border-accent/15">
                <div className="text-[10px] text-muted-foreground font-mono">
                  KI denkt nach…
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-border/50 pt-3 space-y-2">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Was würde der Anrufer sagen…"
              className="flex-1 px-4 py-2.5 rounded-xl border border-border/50 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
              disabled={thinking}
              autoFocus
            />
            <Button
              variant="gold"
              size="sm"
              className="rounded-xl"
              disabled={!input.trim() || thinking}
              onClick={handleSend}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-accent" />
              Tonalität: {tenant.branding_config.tonalitaet}
            </span>
            <button
              onClick={reset}
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              Neu starten
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VoiceTestDialog;
