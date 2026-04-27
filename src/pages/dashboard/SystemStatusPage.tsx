import { Link } from "react-router-dom";
import {
  Phone,
  MessageCircle,
  Mail,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ArrowRight,
  Cpu,
  Database,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { useProviderHealth } from "@/lib/queries/use-provider-config";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useTenant } from "@/contexts/TenantContext";

const SystemStatusPage = () => {
  const { tenant } = useTenant();
  const { data: health, isLoading } = useProviderHealth();

  const items = [
    {
      key: "vapi",
      name: "Voice-Agent (Vapi)",
      icon: Phone,
      whatItProvides: "Eingehende Anrufe 24/7 KI-beantwortet",
      health: health?.vapi,
    },
    {
      key: "whatsapp",
      name: "WhatsApp",
      icon: MessageCircle,
      whatItProvides: "Mandanten-Chat empathisch + KI-eskaliert",
      health: health?.whatsapp,
    },
    {
      key: "resend",
      name: "Email (Resend)",
      icon: Mail,
      whatItProvides: "Magic-Links, Mahnungen, Antworten",
      health: health?.resend,
    },
    {
      key: "stripe",
      name: "Zahlungen (Stripe)",
      icon: CreditCard,
      whatItProvides: "Mandanten zahlen direkt im Portal",
      health: health?.stripe,
    },
  ];

  const ready = items.filter((i) => i.health?.enabled && i.health?.last_test_ok === true).length;
  const total = items.length;
  const overallReady = ready === total;

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground">System-Status</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Diese Seite zeigt was {tenant.kanzlei_name} aktuell live KI-betreiben kann.
          Vor dem Onboarding eines Mandanten sollten alle relevanten Provider grün sein.
        </p>
      </div>

      {/* Overall Bar */}
      <div
        className={`glass-card p-5 ${
          overallReady
            ? "border-emerald-500/30 bg-emerald-500/[0.04]"
            : "border-amber-500/30 bg-amber-500/[0.04]"
        }`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
              overallReady
                ? "bg-emerald-500/15 text-emerald-700"
                : "bg-amber-500/15 text-amber-700"
            }`}
          >
            {overallReady ? <CheckCircle2 className="h-7 w-7" /> : <AlertCircle className="h-7 w-7" />}
          </div>
          <div className="flex-1">
            <h3 className="text-base font-display font-bold text-foreground">
              {overallReady
                ? "Alles bereit für Mandanten-Onboarding"
                : `${ready} von ${total} Integrationen produktiv`}
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {overallReady
                ? "Anrufe, WhatsApp, Email und Zahlungen funktionieren live mit KI."
                : "Erst alle Provider verbinden, dann produktiv onboarden. Demo bleibt verfügbar."}
            </p>
          </div>
          {!overallReady && (
            <Link to="/dashboard/integrationen">
              <button className="px-4 py-2 rounded-xl bg-accent text-navy-dark font-semibold text-sm hover:bg-gold-dark transition-colors flex items-center gap-2">
                Integrationen einrichten
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </Link>
          )}
        </div>
      </div>

      {/* Foundation-Layer */}
      <section>
        <h3 className="text-sm uppercase tracking-wider font-semibold text-muted-foreground mb-3">
          Foundation
        </h3>
        <div className="grid sm:grid-cols-3 gap-3">
          <FoundationTile
            icon={Database}
            label="Datenbank + RLS"
            ok={isSupabaseConfigured}
            okText="Supabase verbunden"
            warnText="Demo-Modus (Mock-Daten)"
          />
          <FoundationTile
            icon={Cpu}
            label="SYSTEMS-KI"
            ok={isSupabaseConfigured}
            okText="Edge Functions live"
            warnText="KI-Aufrufe simuliert"
          />
          <FoundationTile
            icon={ShieldCheck}
            label="DSGVO + Audit"
            ok={true}
            okText="Konform · Hosting Frankfurt"
            warnText=""
          />
        </div>
      </section>

      {/* Integration-Layer */}
      <section>
        <h3 className="text-sm uppercase tracking-wider font-semibold text-muted-foreground mb-3">
          Externe Provider
        </h3>
        {isLoading ? (
          <div className="glass-card p-8 border-border/50 text-center">
            <Loader2 className="h-5 w-5 animate-spin mx-auto" />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {items.map((it) => {
              const Icon = it.icon;
              const status = !it.health
                ? { label: "—", cls: "text-muted-foreground", IconComp: AlertCircle }
                : !it.health.configured
                  ? { label: "Nicht konfiguriert", cls: "text-muted-foreground", IconComp: XCircle }
                  : !it.health.enabled
                    ? { label: "Aus", cls: "text-amber-700", IconComp: AlertCircle }
                    : it.health.last_test_ok === true
                      ? { label: "Live", cls: "text-emerald-700", IconComp: CheckCircle2 }
                      : it.health.last_test_ok === false
                        ? { label: "Verbindung fehlerhaft", cls: "text-rose-700", IconComp: XCircle }
                        : { label: "Konfiguriert · ungetestet", cls: "text-amber-700", IconComp: AlertCircle };
              const StatusIcon = status.IconComp;
              return (
                <Link
                  key={it.key}
                  to="/dashboard/integrationen"
                  className="glass-card p-5 border-border/50 hover:border-accent/30 transition-colors block"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                      <Icon className="h-4 w-4 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <h4 className="text-sm font-display font-bold text-foreground">
                          {it.name}
                        </h4>
                        <span className={`text-xs font-semibold inline-flex items-center gap-1 ${status.cls}`}>
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {it.whatItProvides}
                      </p>
                      {it.health?.last_test_at && (
                        <p className="text-[10px] text-muted-foreground/60 mt-1.5">
                          Test: {new Date(it.health.last_test_at).toLocaleString("de-DE")}
                        </p>
                      )}
                      {it.key === "resend" && it.health && "verified_domain" in it.health && it.health.verified_domain && (
                        <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                          Domain: {it.health.verified_domain}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Onboarding-Readiness */}
      <section className="glass-card p-5 border-border/50">
        <h3 className="text-sm font-display font-bold text-foreground mb-3">
          Was funktioniert ohne welcher Provider?
        </h3>
        <div className="space-y-2 text-sm">
          <Row
            ok={isSupabaseConfigured}
            label="Login + Mandanten-CRM + Akten + Termine + Audit-Log"
            req="Supabase"
          />
          <Row
            ok={Boolean(health?.resend?.last_test_ok)}
            label="Mandant kriegt Magic-Link per Email · Anwalt sendet Antworten"
            req="Resend"
          />
          <Row
            ok={Boolean(health?.vapi?.last_test_ok)}
            label="Mandant ruft an, KI nimmt Anruf entgegen + qualifiziert"
            req="Vapi"
          />
          <Row
            ok={Boolean(health?.whatsapp?.last_test_ok)}
            label="Mandant schreibt WhatsApp, KI antwortet empathisch"
            req="360dialog (WhatsApp Business API)"
          />
          <Row
            ok={Boolean(health?.stripe?.last_test_ok)}
            label="Mandant zahlt Rechnung im Portal"
            req="Stripe"
          />
        </div>
      </section>
    </div>
  );
};

const FoundationTile = ({
  icon: Icon,
  label,
  ok,
  okText,
  warnText,
}: {
  icon: typeof Cpu;
  label: string;
  ok: boolean;
  okText: string;
  warnText: string;
}) => (
  <div className={`glass-card p-4 ${ok ? "border-emerald-500/30 bg-emerald-500/[0.03]" : "border-amber-500/30 bg-amber-500/[0.03]"}`}>
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${ok ? "bg-emerald-500/15 text-emerald-700" : "bg-amber-500/15 text-amber-700"}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <div className="text-sm font-display font-bold text-foreground">{label}</div>
        <div className="text-[10px] text-muted-foreground">{ok ? okText : warnText}</div>
      </div>
    </div>
  </div>
);

const Row = ({ ok, label, req }: { ok: boolean; label: string; req: string }) => (
  <div className="flex items-start gap-2 text-foreground">
    {ok ? (
      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
    ) : (
      <XCircle className="h-4 w-4 text-rose-500/60 shrink-0 mt-0.5" />
    )}
    <div className="flex-1">
      <div className={ok ? "text-foreground" : "text-muted-foreground"}>{label}</div>
      <div className="text-[10px] text-muted-foreground/60">benötigt: {req}</div>
    </div>
  </div>
);

export default SystemStatusPage;
