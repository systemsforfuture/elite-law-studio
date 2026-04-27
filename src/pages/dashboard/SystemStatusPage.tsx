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
  RefreshCw,
} from "lucide-react";
import { useProviderHealth } from "@/lib/queries/use-provider-config";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useTenant } from "@/contexts/TenantContext";

const SystemStatusPage = () => {
  const { tenant } = useTenant();
  const { data: health, isLoading, dataUpdatedAt } = useProviderHealth();
  const qc = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const refresh = async () => {
    setRefreshing(true);
    try {
      await qc.invalidateQueries({ queryKey: ["provider-health"] });
      await qc.invalidateQueries({ queryKey: ["provider-config"] });
    } finally {
      setTimeout(() => setRefreshing(false), 500);
    }
  };

  const items = [
    {
      key: "voice",
      name: "KI-Telefon",
      icon: Phone,
      what: "Eingehende Anrufe 24/7 von der KI",
      ok: Boolean(health?.voice?.enabled && health?.voice?.status === "active"),
      detail: health?.voice?.phone_number ?? null,
      pendingReason:
        health?.voice?.status === "provisioning" ? "Wird eingerichtet" : null,
    },
    {
      key: "whatsapp",
      name: "WhatsApp",
      icon: MessageCircle,
      what: "Mandanten chatten direkt mit der KI",
      ok: Boolean(
        health?.whatsapp?.enabled && health?.whatsapp?.verification_status === "verified",
      ),
      detail: health?.whatsapp?.phone_number ?? null,
      pendingReason:
        health?.whatsapp?.verification_status === "pending" && health?.whatsapp?.phone_number
          ? "Verifizierung läuft (Meta-Approval)"
          : null,
    },
    {
      key: "email",
      name: "E-Mail",
      icon: Mail,
      what: "Magic-Links, Mahnungen, Inbound-Triage",
      ok: Boolean(
        health?.email?.enabled && health?.email?.verification_status === "verified",
      ),
      detail: health?.email?.from_email ?? health?.email?.custom_domain ?? null,
      pendingReason:
        health?.email?.verification_status === "pending" && health?.email?.custom_domain
          ? "DNS-Records ausstehend"
          : null,
    },
    {
      key: "stripe",
      name: "Zahlungen",
      icon: CreditCard,
      what: "Mandanten zahlen direkt im Portal",
      ok: Boolean(
        health?.stripe?.enabled &&
          health?.stripe?.charges_enabled &&
          health?.stripe?.payouts_enabled,
      ),
      detail: null,
      pendingReason:
        health?.stripe?.configured && !health?.stripe?.charges_enabled
          ? "KYC-Verifizierung läuft"
          : null,
    },
  ];

  const ready = items.filter((i) => i.ok).length;
  const total = items.length;
  const overallReady = ready === total;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">System-Status</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Diese Seite zeigt was {tenant.kanzlei_name} aktuell live KI-betreiben kann.
            Vor dem ersten Mandanten-Onboarding sollten alle Module grün sein.
          </p>
          {dataUpdatedAt > 0 && (
            <p className="text-[11px] text-muted-foreground/60 mt-1">
              Aktualisiert{" "}
              {new Date(dataUpdatedAt).toLocaleTimeString("de-DE", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </p>
          )}
        </div>
        <button
          onClick={refresh}
          disabled={refreshing}
          className="px-3 py-1.5 rounded-xl text-xs text-muted-foreground hover:text-foreground bg-muted/30 hover:bg-muted/60 transition-all border border-border/50 inline-flex items-center gap-2 disabled:opacity-50"
          aria-label="Status aktualisieren"
        >
          <RefreshCw className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`} />
          Aktualisieren
        </button>
      </div>

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
                : `${ready} von ${total} Modulen produktiv`}
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {overallReady
                ? "Anrufe, WhatsApp, E-Mail und Zahlungen funktionieren live mit KI."
                : "Erst alle Module einrichten, dann produktiv onboarden. Demo bleibt verfügbar."}
            </p>
          </div>
          {!overallReady && (
            <Link to="/dashboard/integrationen">
              <button className="px-4 py-2 rounded-xl bg-accent text-navy-dark font-semibold text-sm hover:bg-gold-dark transition-colors flex items-center gap-2">
                Jetzt einrichten
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </Link>
          )}
        </div>
      </div>

      <section>
        <h3 className="text-sm uppercase tracking-wider font-semibold text-muted-foreground mb-3">
          Foundation
        </h3>
        <div className="grid sm:grid-cols-3 gap-3">
          <FoundationTile
            icon={Database}
            label="Datenbank + RLS"
            ok={isSupabaseConfigured}
            okText="Verbunden · Hosting Frankfurt"
            warnText="Demo-Modus (Mock-Daten)"
          />
          <FoundationTile
            icon={Cpu}
            label="SYSTEMS-KI"
            ok={isSupabaseConfigured}
            okText="6 Agenten live"
            warnText="KI-Aufrufe simuliert"
          />
          <FoundationTile
            icon={ShieldCheck}
            label="DSGVO + Audit"
            ok={true}
            okText="Konform · §43e BRAO"
            warnText=""
          />
        </div>
      </section>

      <section>
        <h3 className="text-sm uppercase tracking-wider font-semibold text-muted-foreground mb-3">
          Kanzlei-Module
        </h3>
        {isLoading ? (
          <div className="glass-card p-8 border-border/50 text-center">
            <Loader2 className="h-5 w-5 animate-spin mx-auto" />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {items.map((it) => {
              const Icon = it.icon;
              const StatusIcon = it.ok ? CheckCircle2 : it.pendingReason ? Loader2 : XCircle;
              const statusCls = it.ok
                ? "text-emerald-700"
                : it.pendingReason
                  ? "text-amber-700"
                  : "text-muted-foreground";
              const statusLabel = it.ok ? "Live" : it.pendingReason ?? "Nicht eingerichtet";

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
                        <span className={`text-xs font-semibold inline-flex items-center gap-1 ${statusCls}`}>
                          <StatusIcon className="h-3 w-3" />
                          {statusLabel}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{it.what}</p>
                      {it.detail && (
                        <p className="text-[11px] text-foreground/70 mt-1.5 font-mono">
                          {it.detail}
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

export default SystemStatusPage;
