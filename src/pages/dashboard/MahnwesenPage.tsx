import { useState } from "react";
import {
  Receipt,
  AlertOctagon,
  Sparkles,
  Send,
  Gavel,
  CheckCircle2,
  ArrowLeft,
  TrendingUp,
} from "lucide-react";
import { findMandant, mandantName } from "@/data/mockData";
import type { Rechnung, RechnungStatus } from "@/data/types";
import { useGenerateMahnung, useRechnungenQuery } from "@/lib/queries/use-rechnungen";
import { toast } from "sonner";
import { Loader2, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/dashboard/EmptyState";

const statusLabel: Record<RechnungStatus, string> = {
  entwurf: "Entwurf",
  versendet: "Versendet",
  bezahlt: "Bezahlt",
  ueberfaellig: "Überfällig",
  mahnung_1: "Mahnung 1",
  mahnung_2: "Mahnung 2",
  mahnung_3: "Mahnung 3",
  gerichtlich: "Gerichtlich",
};

const statusCls: Record<RechnungStatus, string> = {
  entwurf: "bg-muted text-muted-foreground",
  versendet: "bg-sky-500/15 text-sky-700",
  bezahlt: "bg-emerald-500/15 text-emerald-700",
  ueberfaellig: "bg-amber-500/15 text-amber-700",
  mahnung_1: "bg-amber-500/15 text-amber-700",
  mahnung_2: "bg-orange-500/15 text-orange-700",
  mahnung_3: "bg-rose-500/15 text-rose-700",
  gerichtlich: "bg-rose-500/20 text-rose-800",
};

const eskalationsStufen = [
  {
    stufe: 1,
    titel: "Zahlungserinnerung",
    desc: "Freundlicher Hinweis, +7 Tage Zahlungsziel.",
    text:
      "Sehr geehrter Herr Müller, leider haben wir Ihre Zahlung der Rechnung 2026-0142 noch nicht erhalten. Möglicherweise ist der Bescheid Ihnen entgangen — bitte überweisen Sie den ausstehenden Betrag bis 30.04.2026.",
  },
  {
    stufe: 2,
    titel: "Erste Mahnung",
    desc: "Mahnkosten + Verzugszinsen, +7 Tage.",
    text:
      "Trotz unseres Schreibens vom … ist die Rechnung 2026-0142 weiterhin offen. Wir berechnen Ihnen Mahnkosten in Höhe von 5,00 € sowie Verzugszinsen gemäß §288 BGB.",
  },
  {
    stufe: 3,
    titel: "Letzte Mahnung",
    desc: "Androhung gerichtl. Mahnverfahren.",
    text:
      "Letzte Aufforderung. Sollte die Zahlung nicht bis spätestens … eingehen, werden wir ohne weitere Ankündigung das gerichtliche Mahnverfahren einleiten.",
  },
  {
    stufe: 4,
    titel: "Gerichtliches Mahnverfahren",
    desc: "Übergabe an Mahngericht, Vollstreckungstitel.",
    text:
      "Antrag auf Erlass eines Mahnbescheids beim zuständigen Mahngericht. Übergabe via beA.",
  },
];

const MahnwesenPage = () => {
  const [selected, setSelected] = useState<Rechnung | null>(null);
  const { data: rechnungen = [], isLoading } = useRechnungenQuery();
  const offen = rechnungen.filter((r) => r.status !== "bezahlt");
  const generateMahnung = useGenerateMahnung();
  const [generatedText, setGeneratedText] = useState<string | null>(null);

  const handleGenerate = async (id: string) => {
    const t = toast.loading("SYSTEMS-Mahnwesen-KI formuliert…", {
      description: "Juristisch korrekte Formulierungen werden geprüft",
    });
    try {
      const result = await generateMahnung.mutateAsync(id);
      if (result) {
        setGeneratedText(result.mahn_text);
        toast.success(`Mahnung Stufe ${result.stufe} generiert`, { id: t });
      }
    } catch (e) {
      toast.error("Generierung fehlgeschlagen", {
        id: t,
        description: e instanceof Error ? e.message : String(e),
      });
    }
  };
  const summeOffen = offen.reduce((s, r) => s + r.betrag_brutto, 0);
  const zurueckGeholt = 18420;

  if (selected) {
    const md = findMandant(selected.mandant_id);
    const aktStufe = selected.mahnstufe;
    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelected(null)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück
        </button>

        <div className="glass-card p-6 border-border/50">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-xl font-display font-bold text-foreground">
                Rechnung {selected.rechnungsnummer}
              </h2>
              <div className="text-xs text-muted-foreground mt-1">
                {mandantName(md)} · Fällig{" "}
                {new Date(selected.faelligkeit).toLocaleDateString("de-DE")}
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-display font-black text-foreground tabular-nums">
                {selected.betrag_brutto.toLocaleString("de-DE")}€
              </div>
              <span
                className={`text-[10px] uppercase font-bold px-2 py-1 rounded inline-block mt-1 ${statusCls[selected.status]}`}
              >
                {statusLabel[selected.status]}
              </span>
            </div>
          </div>
        </div>

        <div className="glass-card p-6 border-border/50">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display font-bold text-foreground">
              Eskalations-Pipeline
            </h3>
            <span className="text-xs text-muted-foreground">
              KI-Mahnungs-Eskalator aktiv
            </span>
          </div>

          <div className="space-y-3">
            {eskalationsStufen.map((s) => {
              const erledigt = aktStufe >= s.stufe;
              const aktiv = aktStufe + 1 === s.stufe;
              return (
                <div
                  key={s.stufe}
                  className={`p-5 rounded-2xl border transition-all ${
                    erledigt
                      ? "border-emerald-500/30 bg-emerald-500/[0.03]"
                      : aktiv
                      ? "border-accent/40 bg-accent/[0.04] shadow-lg"
                      : "border-border/50 bg-muted/20 opacity-60"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                        erledigt
                          ? "bg-emerald-500/15 text-emerald-700"
                          : aktiv
                          ? "bg-accent/15 text-accent"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {erledigt ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : s.stufe === 4 ? (
                        <Gavel className="h-5 w-5" />
                      ) : (
                        <Send className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h4 className="font-semibold text-foreground">
                          Stufe {s.stufe} · {s.titel}
                        </h4>
                        {erledigt && (
                          <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-500/15 px-2 py-0.5 rounded">
                            Erledigt
                          </span>
                        )}
                        {aktiv && (
                          <span className="text-[10px] uppercase font-bold text-accent bg-accent/15 px-2 py-0.5 rounded">
                            Nächster Schritt
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {s.desc}
                      </p>
                      {aktiv && (
                        <>
                          <div className="text-xs text-foreground p-3 rounded-lg bg-background/60 border border-border/50 mb-3 whitespace-pre-line">
                            {generatedText ?? s.text}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="gold"
                              size="sm"
                              className="rounded-lg"
                              disabled={generateMahnung.isPending}
                              onClick={() => handleGenerate(selected.id)}
                            >
                              {generateMahnung.isPending ? (
                                <>
                                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                  Formuliere…
                                </>
                              ) : generatedText ? (
                                <>
                                  <Sparkles className="mr-2 h-3 w-3" />
                                  Erneut generieren
                                </>
                              ) : (
                                <>
                                  <Sparkles className="mr-2 h-3 w-3" />
                                  KI-Mahn-Text generieren
                                </>
                              )}
                            </Button>
                            {generatedText && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-lg"
                                onClick={() => {
                                  navigator.clipboard.writeText(generatedText);
                                  toast.success("In Zwischenablage kopiert");
                                }}
                              >
                                Text kopieren
                              </Button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-4 gap-4">
        <Stat
          label="Offene Forderungen"
          value={`${summeOffen.toLocaleString("de-DE")}€`}
          sub={`${offen.length} Rechnungen`}
          accent="amber"
        />
        <Stat
          label="In Mahnung"
          value={String(rechnungen.filter((r) => r.mahnstufe > 0).length)}
          sub="Stufe 1-3 aktiv"
          accent="rose"
        />
        <Stat
          label="Zurückgeholt 30 Tage"
          value={`${zurueckGeholt.toLocaleString("de-DE")}€`}
          sub="Durch KI-Eskalation"
          accent="emerald"
        />
        <Stat
          label="Ø Außenstand"
          value="11 Tage"
          sub="−42% vs. Vorquartal"
          accent="emerald"
        />
      </div>

      <div className="glass-card p-5 border-accent/20 bg-accent/[0.04]">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="h-4 w-4 text-accent" />
          <h3 className="text-sm font-display font-bold text-foreground">
            Mahnungs-Eskalator schlägt vor
          </h3>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          3 Rechnungen sind heute fällig für die nächste Eskalations-Stufe.
        </p>
        <Button variant="gold" size="sm" className="rounded-xl">
          <TrendingUp className="mr-2 h-3.5 w-3.5" />
          Alle 3 Vorschläge prüfen
        </Button>
      </div>

      {!isLoading && rechnungen.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="Noch keine offenen Rechnungen"
          description="Sobald Sie Rechnungen erstellen oder Mandanten Honorar-Forderungen offen haben, übernimmt der Mahnungs-Eskalator. Stufen 1-3 vollautomatisch."
        />
      ) : (
      <div className="glass-card border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wider text-muted-foreground/70 bg-muted/20">
              <tr>
                <th className="text-left p-4 font-semibold">Rechnung</th>
                <th className="text-left p-4 font-semibold">Mandant</th>
                <th className="text-right p-4 font-semibold">Betrag</th>
                <th className="text-left p-4 font-semibold">Fällig</th>
                <th className="text-left p-4 font-semibold">Stufe</th>
                <th className="text-left p-4 font-semibold">Status</th>
                <th className="text-left p-4 font-semibold">Nächste Aktion</th>
              </tr>
            </thead>
            <tbody>
              {rechnungen.map((r) => {
                const md = findMandant(r.mandant_id);
                return (
                  <tr
                    key={r.id}
                    onClick={() => setSelected(r)}
                    className="border-t border-border/30 hover:bg-muted/20 transition-colors cursor-pointer"
                  >
                    <td className="p-4 font-mono text-foreground">
                      {r.rechnungsnummer}
                    </td>
                    <td className="p-4 text-foreground">{mandantName(md)}</td>
                    <td className="p-4 text-right font-bold text-foreground tabular-nums">
                      {r.betrag_brutto.toLocaleString("de-DE")}€
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {new Date(r.faelligkeit).toLocaleDateString("de-DE")}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        {[0, 1, 2, 3].map((i) => (
                          <span
                            key={i}
                            className={`w-2 h-5 rounded-sm ${
                              r.mahnstufe >= i
                                ? i === 3
                                  ? "bg-rose-500"
                                  : i === 2
                                  ? "bg-orange-500"
                                  : i === 1
                                  ? "bg-amber-500"
                                  : "bg-sky-500"
                                : "bg-muted"
                            }`}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${statusCls[r.status]}`}
                      >
                        {statusLabel[r.status]}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-muted-foreground">
                      {r.naechste_aktion_am
                        ? new Date(r.naechste_aktion_am).toLocaleDateString(
                            "de-DE",
                          )
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      )}
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
  accent?: "emerald" | "amber" | "rose";
}) => {
  const cls =
    accent === "emerald"
      ? "text-emerald-600"
      : accent === "amber"
      ? "text-amber-600"
      : accent === "rose"
      ? "text-rose-600"
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

export default MahnwesenPage;
