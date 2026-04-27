import { CreditCard, Phone, Sparkles, ArrowUpRight, Download, Cpu, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTenant } from "@/contexts/TenantContext";
import { useLlmUsage } from "@/lib/queries/use-llm-usage";

const tierMeta = {
  foundation: { label: "Foundation", monthly: 490, setup: 3900, kiTokens: 300_000 },
  growth: { label: "Growth", monthly: 990, setup: 7900, kiTokens: 2_000_000 },
  premium: { label: "Premium", monthly: 1890, setup: 14900, kiTokens: 999_999_999 },
};

const TASK_LABEL: Record<string, string> = {
  voice_triage: "Voice-Anruf-Triage",
  email_triage: "E-Mail-Triage",
  whatsapp_chat: "WhatsApp",
  doc_analysis: "Dokumenten-Analyse",
  strategy_gen: "Akten-Strategie",
  mahnung_gen: "Mahnungs-Texte",
  assistant_chat: "KI-Assistent",
  lead_capture: "Lead-Erfassung",
};

const AbrechnungPage = () => {
  const { tenant } = useTenant();
  const tier = tierMeta[tenant.subscription_tier];
  const { data: llmUsage = [] } = useLlmUsage();

  const totalTokens = llmUsage.reduce((s, r) => s + r.input_tokens_sum + r.output_tokens_sum, 0);
  const totalCost = llmUsage.reduce((s, r) => s + Number(r.cost_eur_sum), 0);
  const totalCalls = llmUsage.reduce((s, r) => s + r.call_count, 0);
  const limitPct = Math.min(100, (totalTokens / tier.kiTokens) * 100);
  const overLimit = totalTokens > tier.kiTokens;

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="glass-card p-6 border-accent/30 bg-accent/[0.03] lg:col-span-2">
          <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
            <div>
              <div className="text-xs uppercase tracking-wider text-accent font-semibold mb-1">
                Aktiver Tarif
              </div>
              <h2 className="text-2xl font-display font-bold text-foreground">
                {tier.label}
              </h2>
              <div className="text-xs text-muted-foreground mt-1">
                Aktiv seit{" "}
                {new Date(tenant.onboarded_at).toLocaleDateString("de-DE")} ·
                Status:{" "}
                <span className="text-emerald-700 font-semibold">
                  {tenant.subscription_status}
                </span>
              </div>
            </div>
            <Button variant="outline" size="sm" className="rounded-xl">
              <ArrowUpRight className="mr-2 h-3.5 w-3.5" />
              Upgrade
            </Button>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <Mini label="Monatlich" value={`${tier.monthly}€`} />
            <Mini label="Mandanten" value={(tenant.mandanten_count ?? 0).toLocaleString("de-DE")} />
            <Mini label="MRR" value={`${tier.monthly}€`} accent="emerald" />
          </div>
        </div>

        <div className="glass-card p-6 border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <Phone className="h-4 w-4 text-accent" />
            <h3 className="text-sm font-display font-bold text-foreground">
              Telefon-Guthaben
            </h3>
          </div>
          <div className="text-3xl font-display font-black text-foreground tabular-nums">
            184<span className="text-lg text-muted-foreground">€</span>
          </div>
          <div className="text-xs text-muted-foreground mb-4">
            ~610 Restminuten · 12 Tage
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-gradient-to-r from-accent to-gold-dark"
              style={{ width: "61%" }}
            />
          </div>
          <Button variant="gold" size="sm" className="w-full rounded-xl">
            <Sparkles className="mr-2 h-3.5 w-3.5" />
            300€ aufladen
          </Button>
          <div className="text-[10px] text-muted-foreground mt-2 text-center">
            Auto-Top-up bei &lt; 50€ aktivierbar
          </div>
        </div>

        {/* KI-Verbrauch im aktuellen Monat */}
        <div className="glass-card p-6 border-border/50 lg:col-span-3">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h3 className="font-display font-bold text-foreground flex items-center gap-2">
              <Cpu className="h-4 w-4 text-accent" />
              SYSTEMS-KI-Verbrauch · Aktueller Monat
            </h3>
            <div className="text-xs text-muted-foreground">
              {totalCalls.toLocaleString("de-DE")} Aufrufe · {Math.round(totalTokens / 1000)}k Tokens · {totalCost.toFixed(2)} €
            </div>
          </div>

          {/* Limit-Bar */}
          {tenant.subscription_tier !== "premium" && (
            <div className="mb-5">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-muted-foreground">
                  {totalTokens.toLocaleString("de-DE")} / {tier.kiTokens.toLocaleString("de-DE")} Tokens
                </span>
                <span className={`font-semibold ${overLimit ? "text-rose-600" : limitPct > 80 ? "text-amber-600" : "text-emerald-600"}`}>
                  {limitPct.toFixed(0)}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    overLimit ? "bg-rose-500" : limitPct > 80 ? "bg-amber-500" : "bg-emerald-500"
                  }`}
                  style={{ width: `${limitPct}%` }}
                />
              </div>
              {limitPct > 80 && (
                <div className="mt-2 text-xs flex items-center gap-1.5 text-amber-700">
                  <AlertCircle className="h-3 w-3" />
                  {overLimit ? "Limit überschritten — KI antwortet nur noch eingeschränkt." : "Limit fast erreicht — Tier upgraden?"}
                </div>
              )}
            </div>
          )}

          {/* Per-Task-Breakdown */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted-foreground/70 border-b border-border/40">
                <tr>
                  <th className="text-left py-2 font-semibold">Modul</th>
                  <th className="text-right py-2 font-semibold">Aufrufe</th>
                  <th className="text-right py-2 font-semibold">Tokens</th>
                  <th className="text-right py-2 font-semibold">Kosten</th>
                </tr>
              </thead>
              <tbody>
                {llmUsage.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-xs text-muted-foreground">
                      Noch kein Verbrauch in diesem Monat
                    </td>
                  </tr>
                )}
                {llmUsage.map((row, i) => (
                  <tr key={`${row.task}-${row.provider}-${i}`} className="border-b border-border/30 last:border-0">
                    <td className="py-2 text-foreground">
                      {TASK_LABEL[row.task] ?? row.task}
                    </td>
                    <td className="py-2 text-right tabular-nums text-foreground">
                      {row.call_count.toLocaleString("de-DE")}
                    </td>
                    <td className="py-2 text-right tabular-nums text-muted-foreground">
                      {((row.input_tokens_sum + row.output_tokens_sum) / 1000).toFixed(1)}k
                    </td>
                    <td className="py-2 text-right tabular-nums font-semibold text-foreground">
                      {Number(row.cost_eur_sum).toFixed(2)} €
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-card p-6 border-border/50 lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-foreground flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-accent" />
              Letzte Rechnungen
            </h3>
            <Button variant="outline" size="sm" className="rounded-xl">
              <Download className="mr-2 h-3.5 w-3.5" />
              Alle exportieren
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted-foreground/70 border-b border-border/40">
                <tr>
                  <th className="text-left py-3 font-semibold">Rechnung</th>
                  <th className="text-left py-3 font-semibold">Periode</th>
                  <th className="text-left py-3 font-semibold">Position</th>
                  <th className="text-right py-3 font-semibold">Betrag</th>
                  <th className="text-right py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    nr: "SYS-2026-04-018",
                    period: "Apr 2026",
                    pos: "Growth-Subscription · Telefon 187€",
                    sum: 1177,
                    status: "Bezahlt",
                  },
                  {
                    nr: "SYS-2026-03-012",
                    period: "Mär 2026",
                    pos: "Growth-Subscription · Telefon 142€",
                    sum: 1132,
                    status: "Bezahlt",
                  },
                  {
                    nr: "SYS-2026-02-008",
                    period: "Feb 2026",
                    pos: "Setup-Fee + erste Subscription",
                    sum: 8890,
                    status: "Bezahlt",
                  },
                ].map((r) => (
                  <tr
                    key={r.nr}
                    className="border-b border-border/30 last:border-0"
                  >
                    <td className="py-3 font-mono text-foreground">{r.nr}</td>
                    <td className="py-3 text-muted-foreground">{r.period}</td>
                    <td className="py-3 text-foreground">{r.pos}</td>
                    <td className="py-3 text-right font-bold text-foreground tabular-nums">
                      {r.sum.toLocaleString("de-DE")}€
                    </td>
                    <td className="py-3 text-right">
                      <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-500/15 px-2 py-1 rounded">
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const Mini = ({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "emerald";
}) => (
  <div className="p-3 rounded-xl bg-background/50 border border-border/40">
    <div className="text-[10px] uppercase tracking-wider text-muted-foreground/70 mb-0.5">
      {label}
    </div>
    <div
      className={`text-lg font-display font-bold tabular-nums ${
        accent === "emerald" ? "text-emerald-600" : "text-foreground"
      }`}
    >
      {value}
    </div>
  </div>
);

export default AbrechnungPage;
