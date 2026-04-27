import { useEffect, useRef, useState } from "react";
import {
  Sparkles,
  X,
  Send,
  Loader2,
  Trash2,
  Cpu,
} from "lucide-react";
import { useAskAssistant, type AssistantMessage } from "@/lib/queries/use-assistant";
import { useProviderHealth } from "@/lib/queries/use-provider-config";

const STORAGE_KEY = "systems-assistant-history";
const MAX_HISTORY = 30;

const SUGGESTIONS_DEFAULT = [
  "Was muss ich heute priorisieren?",
  "Welche Fristen laufen diese Woche kritisch?",
  "RVG-Berechnung für Streitwert 8.500€",
  "Entwirf ein Erinnerungsschreiben (Stufe 1)",
];

const SUGGESTIONS_SETUP = [
  "Wie richte ich die KI-Telefonnummer ein?",
  "Welche DNS-Records brauche ich für meine Email-Domain?",
  "Welche Integrationen muss ich für Mandanten-Onboarding aktivieren?",
  "Was kann die KI heute für mich tun?",
];

const AssistantWidget = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  // Synchron aus localStorage initialisieren — sonst überschreibt der save-Effect
  // beim ersten Render mit leerem Array bevor der load-Effect feuern kann.
  const [history, setHistory] = useState<AssistantMessage[]>(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      return raw ? (JSON.parse(raw) as AssistantMessage[]) : [];
    } catch {
      return [];
    }
  });
  const ask = useAskAssistant();
  const { data: health } = useProviderHealth();
  const integrationsReady = [
    health?.voice?.enabled && health?.voice?.status === "active",
    health?.email?.enabled && health?.email?.verification_status === "verified",
    health?.whatsapp?.enabled && health?.whatsapp?.verification_status === "verified",
    health?.stripe?.enabled && health?.stripe?.charges_enabled,
  ].filter(Boolean).length;
  // In Setup-Phase (< 2 Integrationen) → Setup-orientierte Suggestions
  const SUGGESTIONS = integrationsReady < 2 ? SUGGESTIONS_SETUP : SUGGESTIONS_DEFAULT;
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(-MAX_HISTORY)));
    } catch {
      /* ignore */
    }
  }, [history]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, ask.isPending]);

  // ESC schließt, ⌘/ öffnet
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) setOpen(false);
      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault();
        setOpen((v) => !v);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const submit = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || ask.isPending) return;
    const userMsg: AssistantMessage = { role: "user", content: msg };
    setHistory((h) => [...h, userMsg]);
    setInput("");
    try {
      const res = await ask.mutateAsync({ message: msg, history });
      setHistory((h) => [...h, { role: "assistant", content: res.reply }]);
    } catch (e) {
      setHistory((h) => [
        ...h,
        {
          role: "assistant",
          content: `Fehler: ${e instanceof Error ? e.message : "Unbekannt"}`,
        },
      ]);
    }
  };

  const clear = () => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  };

  return (
    <>
      {/* Floating launcher */}
      <button
        onClick={() => {
          setOpen(true);
          setTimeout(() => inputRef.current?.focus(), 80);
        }}
        className={`fixed bottom-6 right-6 z-30 w-14 h-14 rounded-full bg-accent text-navy-dark shadow-2xl shadow-accent/30 hover:scale-110 transition-transform flex items-center justify-center group ${
          open ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
        aria-label="SYSTEMS-KI öffnen"
        title="SYSTEMS-KI · ⌘/"
      >
        <Sparkles className="h-6 w-6" />
        <span className="absolute inset-0 rounded-full ring-2 ring-accent/40 animate-pulse" />
      </button>

      {/* Drawer */}
      <div
        className={`fixed inset-0 z-40 transition-opacity ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div
          className="absolute inset-0 bg-navy-dark/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="SYSTEMS-KI Assistent"
          className={`absolute right-0 top-0 bottom-0 w-full sm:w-[420px] bg-background shadow-2xl border-l border-border/50 flex flex-col transition-transform duration-300 ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/50 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-accent/15 flex items-center justify-center">
                <Cpu className="h-4 w-4 text-accent" />
              </div>
              <div>
                <div className="text-sm font-display font-bold text-foreground">
                  SYSTEMS-KI
                </div>
                <div className="text-[10px] text-muted-foreground">
                  Kontextsensitiv · vertraulich · DSGVO
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {history.length > 0 && (
                <button
                  onClick={clear}
                  className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  title="Verlauf löschen"
                  aria-label="Verlauf löschen"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Schließen"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
            {history.length === 0 && (
              <div className="space-y-4">
                <div className="text-center py-6">
                  <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="h-7 w-7 text-accent" />
                  </div>
                  <h3 className="text-base font-display font-bold text-foreground">
                    Wie kann ich helfen?
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                    Frag zu Mandanten, Akten, Fristen, RVG-Berechnung,
                    Schriftsatz-Skizzen oder Tagesprios.
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-semibold px-1">
                    Vorschläge
                  </div>
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => submit(s)}
                      className="w-full text-left text-sm px-3 py-2.5 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/40 hover:border-accent/30 transition-colors text-foreground"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {history.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-accent text-navy-dark rounded-br-sm"
                      : "bg-muted/60 text-foreground rounded-bl-sm"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {ask.isPending && (
              <div className="flex justify-start">
                <div className="bg-muted/60 px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />
                  <span className="text-xs text-muted-foreground">denkt nach…</span>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
            className="border-t border-border/50 p-4 shrink-0"
          >
            <div className="flex gap-2 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    submit();
                  }
                }}
                placeholder="Frage stellen…"
                rows={1}
                className="flex-1 px-3 py-2 rounded-xl border border-border/50 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/30 resize-none max-h-32"
              />
              <button
                type="submit"
                disabled={!input.trim() || ask.isPending}
                className="w-10 h-10 rounded-xl bg-accent text-navy-dark hover:bg-gold-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center shrink-0"
                aria-label="Senden"
              >
                {ask.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>
            <div className="text-[10px] text-muted-foreground/60 mt-2 px-1">
              Enter senden · Shift+Enter Zeilenumbruch · ⌘/ Toggle
            </div>
          </form>
        </aside>
      </div>
    </>
  );
};

export default AssistantWidget;
