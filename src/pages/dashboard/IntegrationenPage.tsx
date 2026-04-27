import { useEffect, useState } from "react";
import {
  Phone,
  MessageCircle,
  Mail,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTenant } from "@/contexts/TenantContext";
import {
  useProviderConfig,
  useUpdateProviderConfig,
  useTestProvider,
} from "@/lib/queries/use-provider-config";
import type { ProviderConfig, ProviderName } from "@/data/types";
import { toast } from "sonner";

// Webhook-URLs die der Anwalt im Provider-Dashboard eintragen muss
const webhookUrl = (slug: string) => {
  const base = import.meta.env.VITE_SUPABASE_URL ?? "https://<project-ref>.supabase.co";
  return `${base}/functions/v1/${slug}`;
};

const IntegrationenPage = () => {
  const { tenant } = useTenant();
  const { data: cfg } = useProviderConfig(tenant.id);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground">Integrationen</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Verbinde Vapi (Voice), WhatsApp, Resend (Email) und Stripe mit
          deiner Kanzlei. API-Keys werden nur vom Owner gesehen.
        </p>
      </div>

      {!cfg ? (
        <div className="glass-card p-8 border-border/50 text-center">
          <Loader2 className="h-5 w-5 animate-spin mx-auto" />
        </div>
      ) : (
        <div className="space-y-6">
          <VapiCard config={cfg.vapi} tenantId={tenant.id} />
          <WhatsappCard config={cfg.whatsapp} tenantId={tenant.id} />
          <ResendCard config={cfg.resend} tenantId={tenant.id} />
          <StripeCard config={cfg.stripe} tenantId={tenant.id} />
        </div>
      )}
    </div>
  );
};

// =====================================================================
// Vapi Card
// =====================================================================

const VapiCard = ({
  config,
  tenantId,
}: {
  config: ProviderConfig["vapi"];
  tenantId: string;
}) => {
  return (
    <ProviderCard
      provider="vapi"
      title="Voice-Agent (Vapi)"
      description="Eingehende Anrufe werden 24/7 von der KI angenommen, qualifiziert und bei Bedarf eskaliert."
      icon={Phone}
      enabled={config.enabled}
      configured={Boolean(config.api_key)}
      lastTestAt={config.last_test_at}
      lastTestOk={config.last_test_ok}
      tenantId={tenantId}
      docsLink="/docs/PROVIDERS/VAPI.md"
      webhookSlug="webhook-vapi"
      fields={[
        { key: "api_key", label: "Vapi API-Key", placeholder: "vapi_xxxxx", type: "secret", required: true, current: config.api_key },
        { key: "assistant_id", label: "Assistant ID", placeholder: "asst_xxxxx", type: "text", current: config.assistant_id },
        { key: "phone_number_id", label: "Phone Number ID", placeholder: "pn_xxxxx", type: "text", current: config.phone_number_id },
        { key: "webhook_secret", label: "Webhook-Secret (HMAC)", placeholder: "wh_secret_xxxxx", type: "secret", current: config.webhook_secret },
      ]}
    />
  );
};

const WhatsappCard = ({
  config,
  tenantId,
}: {
  config: ProviderConfig["whatsapp"];
  tenantId: string;
}) => (
  <ProviderCard
    provider="whatsapp"
    title="WhatsApp (360dialog)"
    description="Eingehende WhatsApp-Nachrichten werden empathisch beantwortet, juristische Themen eskaliert."
    icon={MessageCircle}
    enabled={config.enabled}
    configured={Boolean(config.api_key)}
    lastTestAt={config.last_test_at}
    lastTestOk={config.last_test_ok}
    tenantId={tenantId}
    docsLink="/docs/PROVIDERS/360DIALOG.md"
    webhookSlug="webhook-whatsapp"
    fields={[
      { key: "api_key", label: "360dialog API-Key", placeholder: "D360-xxxxx", type: "secret", required: true, current: config.api_key },
      { key: "phone_number_id", label: "Phone Number ID", placeholder: "490301234567", type: "text", current: config.phone_number_id },
      { key: "webhook_secret", label: "Webhook-Secret", placeholder: "wh_secret_xxxxx", type: "secret", current: config.webhook_secret },
    ]}
  />
);

const ResendCard = ({
  config,
  tenantId,
}: {
  config: ProviderConfig["resend"];
  tenantId: string;
}) => (
  <ProviderCard
    provider="resend"
    title="Email (Resend)"
    description="Magic-Links + Mahnungen + Mandanten-Antworten. Inbound: Email-Triage durch KI."
    icon={Mail}
    enabled={config.enabled}
    configured={Boolean(config.api_key)}
    lastTestAt={config.last_test_at}
    lastTestOk={config.last_test_ok}
    tenantId={tenantId}
    docsLink="/docs/PROVIDERS/RESEND.md"
    webhookSlug="webhook-email"
    fields={[
      { key: "api_key", label: "Resend API-Key", placeholder: "re_xxxxx", type: "secret", required: true, current: config.api_key },
      { key: "from_email", label: "Absender-Adresse", placeholder: "kanzlei@deine-kanzlei.de", type: "text", required: true, current: config.from_email },
      { key: "verified_domain", label: "Verifizierte Domain", placeholder: "deine-kanzlei.de", type: "text", current: config.verified_domain },
      { key: "inbound_webhook_secret", label: "Inbound-Webhook-Secret", placeholder: "wh_secret_xxxxx", type: "secret", current: config.inbound_webhook_secret },
    ]}
  />
);

const StripeCard = ({
  config,
  tenantId,
}: {
  config: ProviderConfig["stripe"];
  tenantId: string;
}) => (
  <ProviderCard
    provider="stripe"
    title="Zahlungen (Stripe)"
    description="Mandanten zahlen Rechnungen direkt im Portal. Webhook aktualisiert Bezahl-Status automatisch."
    icon={CreditCard}
    enabled={config.enabled}
    configured={Boolean(config.secret_key)}
    lastTestAt={config.last_test_at}
    lastTestOk={config.last_test_ok}
    tenantId={tenantId}
    docsLink="/docs/PROVIDERS/STRIPE.md"
    webhookSlug="webhook-stripe"
    fields={[
      { key: "secret_key", label: "Secret-Key", placeholder: "sk_live_xxxxx", type: "secret", required: true, current: config.secret_key },
      { key: "webhook_secret", label: "Webhook-Signing-Secret", placeholder: "whsec_xxxxx", type: "secret", current: config.webhook_secret },
      { key: "connect_account_id", label: "Connect Account ID (optional)", placeholder: "acct_xxxxx", type: "text", current: config.connect_account_id },
    ]}
  />
);

// =====================================================================
// Generic Provider-Card
// =====================================================================

interface Field {
  key: string;
  label: string;
  placeholder: string;
  type: "text" | "secret";
  required?: boolean;
  current: string | null;
}

interface ProviderCardProps {
  provider: ProviderName;
  title: string;
  description: string;
  icon: typeof Phone;
  enabled: boolean;
  configured: boolean;
  lastTestAt: string | null;
  lastTestOk: boolean | null;
  tenantId: string;
  docsLink: string;
  webhookSlug: string;
  fields: Field[];
}

const ProviderCard = ({
  provider,
  title,
  description,
  icon: Icon,
  enabled,
  configured,
  lastTestAt,
  lastTestOk,
  tenantId,
  docsLink,
  webhookSlug,
  fields,
}: ProviderCardProps) => {
  const update = useUpdateProviderConfig();
  const test = useTestProvider();
  const [open, setOpen] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [values, setValues] = useState<Record<string, string>>({});

  // Sync incoming current values into state when card opens
  useEffect(() => {
    if (open) {
      const next: Record<string, string> = {};
      for (const f of fields) next[f.key] = f.current ?? "";
      setValues(next);
    }
  }, [open, fields]);

  const status = !configured
    ? { label: "Nicht konfiguriert", cls: "bg-muted text-muted-foreground", icon: AlertCircle }
    : lastTestOk === true
      ? { label: "Verbunden", cls: "bg-emerald-500/15 text-emerald-700", icon: CheckCircle2 }
      : lastTestOk === false
        ? { label: "Verbindung fehlerhaft", cls: "bg-rose-500/15 text-rose-700", icon: AlertCircle }
        : { label: "Konfiguriert · ungetestet", cls: "bg-amber-500/15 text-amber-700", icon: AlertCircle };
  const StatusIcon = status.icon;

  const save = async () => {
    const patch: Record<string, unknown> = { enabled: enabled };
    for (const f of fields) {
      const v = values[f.key]?.trim();
      patch[f.key] = v === "" ? null : v;
    }
    const t = toast.loading("Speichere…");
    try {
      await update.mutateAsync({ tenant_id: tenantId, provider, patch });
      toast.success(`${title} gespeichert`, { id: t });
    } catch (e) {
      toast.error("Speichern fehlgeschlagen", {
        id: t,
        description: e instanceof Error ? e.message : "Unbekannt",
      });
    }
  };

  const toggleEnabled = async () => {
    const t = toast.loading(enabled ? "Deaktiviere…" : "Aktiviere…");
    try {
      await update.mutateAsync({
        tenant_id: tenantId,
        provider,
        patch: { enabled: !enabled },
      });
      toast.success(enabled ? "Deaktiviert" : "Aktiviert", { id: t });
    } catch (e) {
      toast.error("Fehler", {
        id: t,
        description: e instanceof Error ? e.message : "Unbekannt",
      });
    }
  };

  const runTest = async () => {
    const t = toast.loading(`Teste ${title}…`);
    try {
      const res = await test.mutateAsync({ provider });
      if (res.ok) {
        toast.success("Verbindung ok", { id: t, description: res.message });
      } else {
        toast.error("Verbindung fehlerhaft", { id: t, description: res.message });
      }
    } catch (e) {
      toast.error("Test fehlgeschlagen", {
        id: t,
        description: e instanceof Error ? e.message : "Unbekannt",
      });
    }
  };

  const copyWebhook = async () => {
    const url = webhookUrl(webhookSlug);
    await navigator.clipboard.writeText(url);
    toast.success("Webhook-URL kopiert");
  };

  return (
    <div className="glass-card border-border/50 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full p-5 flex items-center gap-4 hover:bg-muted/20 transition-colors text-left"
      >
        <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center shrink-0">
          <Icon className="h-5 w-5 text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-base font-display font-bold text-foreground">{title}</h3>
            <span
              className={`text-[10px] uppercase font-bold px-2 py-1 rounded inline-flex items-center gap-1 ${status.cls}`}
            >
              <StatusIcon className="h-3 w-3" />
              {status.label}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
          {lastTestAt && (
            <p className="text-[10px] text-muted-foreground/60 mt-1">
              Zuletzt getestet: {new Date(lastTestAt).toLocaleString("de-DE")}
            </p>
          )}
        </div>
        <span className="text-xs text-muted-foreground">{open ? "▴" : "▾"}</span>
      </button>

      {open && (
        <div className="border-t border-border/50 p-5 space-y-4">
          <div className="rounded-xl border border-accent/20 bg-accent/[0.04] p-3">
            <div className="text-[10px] uppercase tracking-wider text-accent font-semibold mb-1">
              Webhook-URL
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs font-mono text-foreground break-all">
                {webhookUrl(webhookSlug)}
              </code>
              <button
                onClick={copyWebhook}
                className="p-1.5 rounded-lg hover:bg-accent/10 text-accent transition-colors"
                title="Kopieren"
                aria-label="Webhook-URL kopieren"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">
              Diese URL trägst du im {title}-Dashboard als Webhook-Empfänger ein.
            </p>
          </div>

          <div className="space-y-3">
            {fields.map((f) => (
              <div key={f.key}>
                <label className="text-xs font-medium text-foreground block mb-1.5">
                  {f.label}
                  {f.required && <span className="text-rose-500 ml-1">*</span>}
                </label>
                <div className="relative">
                  <input
                    type={f.type === "secret" && !showSecrets[f.key] ? "password" : "text"}
                    value={values[f.key] ?? ""}
                    onChange={(e) =>
                      setValues({ ...values, [f.key]: e.target.value })
                    }
                    placeholder={f.placeholder}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono pr-10 focus:outline-none focus:ring-2 focus:ring-accent/30"
                    autoComplete="off"
                    spellCheck={false}
                  />
                  {f.type === "secret" && (
                    <button
                      type="button"
                      onClick={() =>
                        setShowSecrets({
                          ...showSecrets,
                          [f.key]: !showSecrets[f.key],
                        })
                      }
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showSecrets[f.key] ? "Verbergen" : "Anzeigen"}
                    >
                      {showSecrets[f.key] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 flex-wrap pt-2">
            <Button variant="gold" onClick={save} disabled={update.isPending}>
              {update.isPending ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Speichere…
                </>
              ) : (
                "Speichern"
              )}
            </Button>
            <Button variant="outline" onClick={runTest} disabled={!configured || test.isPending}>
              {test.isPending ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Teste…
                </>
              ) : (
                "Verbindung testen"
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={toggleEnabled}
              disabled={!configured || update.isPending}
            >
              {enabled ? "Deaktivieren" : "Aktivieren"}
            </Button>
            <a
              href={docsLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sm text-accent hover:text-gold-dark ml-auto"
            >
              Setup-Anleitung
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntegrationenPage;
