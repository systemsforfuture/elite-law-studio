import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Keyboard } from "lucide-react";

interface Shortcut {
  keys: string[];
  label: string;
  group: "Navigation" | "KI-Assistent" | "Allgemein";
}

const shortcuts: Shortcut[] = [
  { keys: ["⌘", "K"], label: "Command-Palette öffnen (Mandanten/Akten suchen)", group: "Navigation" },
  { keys: ["⌘", "/"], label: "KI-Assistent öffnen/schließen", group: "KI-Assistent" },
  { keys: ["Esc"], label: "Dialog schließen", group: "Allgemein" },
  { keys: ["?"], label: "Diese Übersicht zeigen", group: "Allgemein" },
];

const isMac =
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

const renderKey = (key: string): string => {
  if (key === "⌘") return isMac ? "⌘" : "Strg";
  return key;
};

const KeyboardShortcutsModal = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) => {
  const groups = Array.from(new Set(shortcuts.map((s) => s.group)));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-accent" />
            Tastatur-Kürzel
          </DialogTitle>
          <DialogDescription>
            Schneller arbeiten ohne Maus.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5 mt-2">
          {groups.map((g) => (
            <div key={g}>
              <h3 className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/70 mb-2">
                {g}
              </h3>
              <div className="space-y-2">
                {shortcuts
                  .filter((s) => s.group === g)
                  .map((s) => (
                    <div
                      key={s.label}
                      className="flex items-center justify-between gap-3"
                    >
                      <span className="text-sm text-foreground">{s.label}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        {s.keys.map((k, i) => (
                          <kbd
                            key={i}
                            className="px-2 py-1 rounded-md border border-border/60 bg-muted/40 text-[10px] font-mono font-semibold text-foreground min-w-[28px] text-center"
                          >
                            {renderKey(k)}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const useKeyboardShortcutsModal = () => {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Skip wenn Fokus auf Eingabefeld liegt
      const tag = (e.target as HTMLElement | null)?.tagName;
      const isEditable =
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        (e.target as HTMLElement | null)?.isContentEditable;
      if (isEditable) return;
      if (e.key === "?" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  return { open, setOpen };
};

export default KeyboardShortcutsModal;
