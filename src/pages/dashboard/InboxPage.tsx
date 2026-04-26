import { useMemo, useState } from "react";
import {
  Mail,
  MessageCircle,
  Filter,
  ArrowLeft,
  Bot,
  AlertTriangle,
  Send,
  Sparkles,
  Phone,
} from "lucide-react";
import { findMandant, mandantName } from "@/data/mockData";
import type { Konversation } from "@/data/types";
import { useKonversationenQuery } from "@/lib/queries/use-konversationen";
import { Button } from "@/components/ui/button";

type Filter = "all" | "email" | "whatsapp" | "escalated" | "ai";

const InboxPage = () => {
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<Konversation | null>(null);
  const [reply, setReply] = useState("");
  const { data: konversationen = [] } = useKonversationenQuery();

  const items = useMemo(() => {
    return konversationen
      .filter((k) => k.kanal === "email" || k.kanal === "whatsapp" || k.kanal === "sms")
      .filter((k) => {
        if (filter === "email") return k.kanal === "email";
        if (filter === "whatsapp") return k.kanal === "whatsapp";
        if (filter === "escalated") return k.status === "escalated";
        if (filter === "ai") return k.ai_handled;
        return true;
      })
      .sort((a, b) => b.zeitpunkt.localeCompare(a.zeitpunkt));
  }, [filter, konversationen]);

  if (selected) {
    const md = findMandant(selected.mandant_id);
    const aiSuggestion =
      selected.kanal === "whatsapp"
        ? "Vielen Dank für Ihre Nachricht. Die Klageerwiderung ist beim Gericht eingereicht. Antwort der Gegenseite läuft, wir informieren Sie sofort. Bei akuten Fragen erreichen Sie mich unter +49 30 …"
        : "Sehr geehrter Herr/Frau …, vielen Dank für Ihre Anfrage. Gerne können wir einen Termin vereinbaren. Hier ist mein Kalender: <Link>. Mit freundlichen Grüßen — Ihre Kanzlei.";

    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelected(null)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück zur Inbox
        </button>

        <div className="grid lg:grid-cols-[1.3fr_1fr] gap-6">
          <div className="space-y-4">
            <div className="glass-card p-6 border-border/50">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                      selected.kanal === "whatsapp"
                        ? "bg-green-500/15 text-green-600"
                        : "bg-sky-500/15 text-sky-600"
                    }`}
                  >
                    {selected.kanal === "whatsapp" ? (
                      <MessageCircle className="h-5 w-5" />
                    ) : (
                      <Mail className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-foreground">
                      {md ? mandantName(md) : "Unbekannter Absender"}
                    </h2>
                    <span className="text-xs text-muted-foreground">
                      {md?.email ?? ""} ·{" "}
                      {new Date(selected.zeitpunkt).toLocaleString("de-DE")}
                    </span>
                  </div>
                </div>
                {selected.status === "escalated" && (
                  <span className="px-3 py-1 rounded-lg text-xs font-medium bg-amber-500/15 text-amber-700">
                    Eskaliert
                  </span>
                )}
              </div>
              {selected.betreff && (
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  {selected.betreff}
                </h3>
              )}
              <div className="text-sm text-foreground leading-relaxed">
                {selected.preview}
              </div>
            </div>

            <div className="glass-card p-6 border-accent/30 bg-accent/[0.04]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-accent" />
                  <h3 className="text-sm font-display font-bold text-foreground">
                    KI-Vorschlag
                  </h3>
                </div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-accent bg-accent/15 px-2 py-0.5 rounded">
                  Konfidenz 0.91
                </span>
              </div>
              <p className="text-sm text-foreground/80 italic mb-4">
                „{aiSuggestion}"
              </p>
              <div className="flex gap-2">
                <Button
                  variant="gold"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => setReply(aiSuggestion)}
                >
                  <Sparkles className="mr-2 h-3.5 w-3.5" />
                  Übernehmen & senden
                </Button>
                <Button variant="outline" size="sm" className="rounded-xl">
                  Anpassen
                </Button>
              </div>
            </div>

            <div className="glass-card p-6 border-border/50">
              <h3 className="text-sm font-display font-bold text-foreground mb-3">
                Antwort
              </h3>
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={6}
                placeholder="Ihre Antwort..."
                className="w-full px-4 py-3 rounded-xl border border-border/50 bg-background/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
              <div className="flex justify-between items-center mt-3">
                <span className="text-xs text-muted-foreground">
                  Wird über SYSTEMS Mail-Engine zugestellt
                </span>
                <Button variant="gold" size="sm" className="rounded-xl">
                  <Send className="mr-2 h-3.5 w-3.5" />
                  Senden
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="glass-card p-5 border-border/50">
              <h3 className="text-sm font-display font-bold text-foreground mb-3">
                Mandant
              </h3>
              {md ? (
                <div className="space-y-2 text-sm">
                  <Field label="Name" value={mandantName(md)} />
                  <Field label="E-Mail" value={md.email} />
                  <Field label="Telefon" value={md.telefon} />
                  <Field
                    label="Rechtsgebiet"
                    value={md.rechtsgebiet ?? "—"}
                  />
                  <Field label="Status" value={md.status} />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Kein Mandanten-Datensatz verknüpft. KI hat noch nicht angelegt.
                </p>
              )}
            </div>

            {selected.status === "escalated" && (
              <div className="glass-card p-5 border-amber-500/30 bg-amber-500/[0.03]">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-display font-bold text-foreground mb-1">
                      Warum eskaliert?
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Juristische Sachfrage erkannt. Confidence (0.74) unter
                      Threshold (0.85). Anwalt-Antwort erforderlich.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="glass-card p-5 border-border/50">
              <h3 className="text-sm font-display font-bold text-foreground mb-3 flex items-center gap-2">
                <Phone className="h-4 w-4 text-accent" />
                Schnell-Aktionen
              </h3>
              <div className="space-y-2">
                <Button variant="outline" className="w-full rounded-xl justify-start" size="sm">
                  Termin-Link senden
                </Button>
                <Button variant="outline" className="w-full rounded-xl justify-start" size="sm">
                  Akte öffnen
                </Button>
                <Button variant="outline" className="w-full rounded-xl justify-start" size="sm">
                  Als erledigt markieren
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-4 gap-4">
        <Stat label="Heute eingegangen" value="142" sub="119 von KI gelöst" />
        <Stat
          label="WhatsApp"
          value="28"
          sub="22 KI · 6 eskaliert"
          accent="green"
        />
        <Stat label="Email" value="142" sub="84% Auto-Antwort" accent="sky" />
        <Stat label="Eskaliert offen" value="12" sub="Sie · Sarah · Julia" accent="amber" />
      </div>

      <div className="glass-card border-border/50 overflow-hidden">
        <div className="p-5 border-b border-border/50 flex items-center justify-between flex-wrap gap-3">
          <h3 className="font-display font-bold text-foreground">Inbox</h3>
          <div className="flex gap-2 items-center flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground" />
            {(
              [
                { v: "all" as const, label: "Alle" },
                { v: "email" as const, label: "Email" },
                { v: "whatsapp" as const, label: "WhatsApp" },
                { v: "escalated" as const, label: "Eskaliert" },
                { v: "ai" as const, label: "KI" },
              ]
            ).map((f) => (
              <button
                key={f.v}
                onClick={() => setFilter(f.v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filter === f.v
                    ? "bg-navy text-primary-foreground"
                    : "bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="divide-y divide-border/40">
          {items.length === 0 && (
            <div className="p-12 text-center text-sm text-muted-foreground">
              Keine Nachrichten gefunden.
            </div>
          )}
          {items.map((k) => {
            const md = findMandant(k.mandant_id);
            return (
              <button
                key={k.id}
                onClick={() => setSelected(k)}
                className={`w-full text-left p-5 hover:bg-muted/20 transition-colors ${
                  k.ungelesen ? "bg-accent/[0.02]" : ""
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      k.kanal === "whatsapp"
                        ? "bg-green-500/15 text-green-600"
                        : "bg-sky-500/15 text-sky-600"
                    }`}
                  >
                    {k.kanal === "whatsapp" ? (
                      <MessageCircle className="h-4 w-4" />
                    ) : (
                      <Mail className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-semibold text-foreground">
                        {md ? mandantName(md) : "Unbekannt"}
                      </span>
                      {k.ungelesen && (
                        <span className="w-2 h-2 rounded-full bg-accent shrink-0" />
                      )}
                      {k.status === "escalated" && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-500/15 px-2 py-0.5 rounded">
                          eskaliert
                        </span>
                      )}
                      {k.ai_handled && k.status !== "escalated" && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-500/15 px-2 py-0.5 rounded">
                          KI
                        </span>
                      )}
                    </div>
                    {k.betreff && (
                      <div className="text-sm font-medium text-foreground/90 truncate">
                        {k.betreff}
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                      {k.preview}
                    </p>
                  </div>
                  <div className="text-[10px] text-muted-foreground shrink-0">
                    {new Date(k.zeitpunkt).toLocaleString("de-DE", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </button>
            );
          })}
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
  accent?: "green" | "sky" | "amber";
}) => {
  const cls =
    accent === "green"
      ? "text-green-600"
      : accent === "sky"
      ? "text-sky-600"
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
    <span className="text-xs font-medium text-foreground truncate">{value}</span>
  </div>
);

export default InboxPage;
