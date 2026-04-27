import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Phone,
  MessageCircle,
  Mail,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Copy,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTenant } from "@/contexts/TenantContext";
import {
  useProviderConfig,
  useProvisionVoice,
  useLinkWhatsapp,
  useVerifyEmailDomain,
  useConnectStripe,
} from "@/lib/queries/use-provider-config";
import type {
  EmailIntegration,
  StripeIntegration,
  VoiceIntegration,
  WhatsappIntegration,
} from "@/data/types";
import { toast } from "sonner";

const IntegrationenPage = () => {
  const { tenant } = useTenant();
  const { data: cfg } = useProviderConfig(tenant.id);
  const [params, setParams] = useSearchParams();
  const stripe = useConnectStripe();

  // Stripe-OAuth-Return: triggert automatischen Status-Refresh wenn Anwalt
  // gerade aus dem KYC zurückkommt. Param wird danach aus der URL entfernt.
  useEffect(() => {
    const stripeFlag = params.get("stripe");
    if (stripeFlag === "return" || stripeFlag === "refresh") {
      params.delete("stripe");
      setParams(params, { replace: true });
      // Status-Refresh anstoßen — Toast zeigt's
      void (async () => {
        try {
          const t = (await import("sonner")).toast;
          const ld = t.loading("Zahlungs-Status wird aktualisiert…");
          const res = await stripe.mutateAsync();
          if (res.charges_enabled && res.payouts_enabled) {
            t.success("Zahlungen sind live", { id: ld });
          } else {
            t.info("KYC noch nicht abgeschlossen", {
              id: ld,
              description: "Stripe verifiziert noch — kann ein paar Minuten dauern.",
            });
          }
        } catch {
          /* still ok */
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.get("stripe")]);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground">
          Integrationen
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          KI-Telefonnummer, WhatsApp, E-Mail-Domain und Zahlungen — alles wird
          über die SYSTEMS-Plattform abgewickelt. Sie sehen keine technischen
          Details, nur Ihre Kanzlei-Daten.
        </p>
      </div>

      {!cfg ? (
        <div className="glass-card p-8 border-border/50 text-center">
          <Loader2 className="h-5 w-5 animate-spin mx-auto" />
        </div>
      ) : (
        <div className="space-y-4">
          <VoiceCard config={cfg.voice} />
          <WhatsappCard config={cfg.whatsapp} />
          <EmailCard config={cfg.email} />
          <StripeCard config={cfg.stripe} />
        </div>
      )}
    </div>
  );
};

// =====================================================================
// Voice Card — Plattform provisioniert KI-Telefonnummer
// =====================================================================

const VoiceCard = ({ config }: { config: VoiceIntegration }) => {
  const provision = useProvisionVoice();
  const [areaCode, setAreaCode] = useState("030");
  const [greeting, setGreeting] = useState(config.greeting ?? "");
  const [open, setOpen] = useState(!config.phone_number);

  const handleProvision = async () => {
    const t = toast.loading("KI-Telefonnummer wird angelegt…", {
      description: "Das dauert bis zu 30 Sekunden.",
    });
    try {
      const res = await provision.mutateAsync({
        area_code: areaCode,
        greeting: greeting || undefined,
      });
      if (res.ok) {
        toast.success("Telefonnummer aktiv", {
          id: t,
          description: res.phone_number ? `Ihre Nummer: ${res.phone_number}` : res.message,
        });
      } else {
        toast.error("Anlage fehlgeschlagen", { id: t, description: res.message });
      }
    } catch (e) {
      toast.error("Fehler", {
        id: t,
        description: e instanceof Error ? e.message : "Unbekannt",
      });
    }
  };

  const status = config.phone_number
    ? config.status === "active"
      ? { label: "Aktiv", cls: "bg-emerald-500/15 text-emerald-700", Icon: CheckCircle2 }
      : { label: "Wird eingerichtet", cls: "bg-amber-500/15 text-amber-700", Icon: Loader2 }
    : { label: "Noch keine Nummer", cls: "bg-muted text-muted-foreground", Icon: AlertCircle };

  return (
    <Card
      icon={Phone}
      title="KI-Telefon (24/7 Anrufannahme)"
      description="Eigene Telefonnummer für Ihre Kanzlei. Anrufe werden 24/7 von der KI angenommen, qualifiziert und bei Bedarf eskaliert."
      statusLabel={status.label}
      statusCls={status.cls}
      StatusIcon={status.Icon}
      open={open}
      onToggle={() => setOpen(!open)}
    >
      {config.phone_number ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.04] p-4">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-emerald-700 mb-1">
              Ihre KI-Telefonnummer
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-display font-bold text-foreground">
                {config.phone_number}
              </span>
              <CopyButton value={config.phone_number} />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Drucken Sie diese Nummer auf Ihre Visitenkarten, Website, E-Mail-Signatur.
              Sie erreichen Sie 24/7 über die KI.
            </p>
          </div>

          <div>
            <label className="text-xs font-medium text-foreground block mb-1.5">
              Begrüßungstext (was die KI sagt)
            </label>
            <textarea
              rows={2}
              value={greeting}
              onChange={(e) => setGreeting(e.target.value)}
              placeholder={`${"Kanzlei"} Müller, mein Name ist Anna. Wie kann ich Ihnen helfen?`}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 resize-none"
            />
          </div>

          <Button variant="outline" disabled>
            Begrüßung speichern
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border border-accent/20 bg-accent/[0.04] p-4 flex gap-3">
            <Sparkles className="h-4 w-4 text-accent shrink-0 mt-0.5" />
            <div className="text-sm text-foreground/80">
              <strong className="text-foreground">In 30 Sekunden zur eigenen KI-Nummer.</strong>{" "}
              Wählen Sie eine Vorwahl, die KI legt sofort eine Telefonnummer für
              Ihre Kanzlei an.
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">
                Vorwahl
              </label>
              <input
                value={areaCode}
                onChange={(e) => setAreaCode(e.target.value)}
                placeholder="030 (Berlin), 040 (Hamburg), 089 (München)…"
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-foreground block mb-1.5">
              Begrüßungstext (optional)
            </label>
            <textarea
              rows={2}
              value={greeting}
              onChange={(e) => setGreeting(e.target.value)}
              placeholder={`Kanzlei [Name], mein Name ist Anna. Wie kann ich Ihnen helfen?`}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 resize-none"
            />
          </div>

          <Button variant="gold" onClick={handleProvision} disabled={provision.isPending}>
            {provision.isPending ? (
              <>
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                Lege Nummer an…
              </>
            ) : (
              "KI-Nummer anlegen"
            )}
          </Button>
        </div>
      )}
    </Card>
  );
};

// =====================================================================
// WhatsApp Card — Kanzlei trägt eigene WA-Nummer ein
// =====================================================================

const WhatsappCard = ({ config }: { config: WhatsappIntegration }) => {
  const link = useLinkWhatsapp();
  const [phone, setPhone] = useState(config.phone_number ?? "");
  const [open, setOpen] = useState(!config.phone_number);

  const handleLink = async () => {
    const trimmed = phone.trim();
    if (!/^\+\d{10,15}$/.test(trimmed)) {
      toast.error("Ungültiges Format", {
        description: "Bitte international: +491234567890",
      });
      return;
    }
    const t = toast.loading("WhatsApp wird eingerichtet…");
    try {
      const res = await link.mutateAsync({ phone_number: trimmed });
      if (res.ok) {
        toast.success("Eingerichtet", {
          id: t,
          description: res.message ?? "WhatsApp-Nummer registriert.",
        });
      } else {
        toast.error("Fehlgeschlagen", { id: t, description: res.message });
      }
    } catch (e) {
      toast.error("Fehler", {
        id: t,
        description: e instanceof Error ? e.message : "Unbekannt",
      });
    }
  };

  const status =
    config.verification_status === "verified"
      ? { label: "Verifiziert", cls: "bg-emerald-500/15 text-emerald-700", Icon: CheckCircle2 }
      : config.phone_number
        ? { label: "Wird verifiziert", cls: "bg-amber-500/15 text-amber-700", Icon: Loader2 }
        : { label: "Noch keine Nummer", cls: "bg-muted text-muted-foreground", Icon: AlertCircle };

  return (
    <Card
      icon={MessageCircle}
      title="WhatsApp-Business"
      description="Mandanten erreichen Sie über Ihre WhatsApp-Business-Nummer. KI antwortet empathisch, eskaliert juristische Fragen."
      statusLabel={status.label}
      statusCls={status.cls}
      StatusIcon={status.Icon}
      open={open}
      onToggle={() => setOpen(!open)}
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-accent/20 bg-accent/[0.04] p-4 text-sm text-foreground/80">
          <strong className="text-foreground">Voraussetzung:</strong> Sie haben
          bereits eine WhatsApp-Business-Nummer (separate Geschäftsleitung,
          nicht Ihre Privatnummer). Wir verbinden sie mit der Plattform — Sie
          müssen sich nirgends sonst registrieren.
        </div>
        <div>
          <label className="text-xs font-medium text-foreground block mb-1.5">
            Ihre WhatsApp-Business-Nummer
          </label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+493012345678"
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
          <p className="text-[10px] text-muted-foreground mt-1.5">
            International mit +. Wenn die Nummer schon in WhatsApp Personal
            verwendet wird, müssen Sie sie dort vorher abmelden.
          </p>
        </div>
        <Button variant="gold" onClick={handleLink} disabled={link.isPending}>
          {link.isPending ? (
            <>
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              Wird eingerichtet…
            </>
          ) : config.phone_number ? (
            "Nummer aktualisieren"
          ) : (
            "WhatsApp einrichten"
          )}
        </Button>
        {config.phone_number && config.verification_status !== "verified" && (
          <div className="text-xs text-muted-foreground">
            Status: <strong className="text-foreground">Verifizierung läuft.</strong>{" "}
            Wir benachrichtigen Sie sobald Mandanten WhatsApps schicken können
            (typisch 1–3 Tage, Meta-Approval-Prozess).
          </div>
        )}
      </div>
    </Card>
  );
};

// =====================================================================
// Email Card — Custom-Domain einrichten
// =====================================================================

const EmailCard = ({ config }: { config: EmailIntegration }) => {
  const verify = useVerifyEmailDomain();
  const [domain, setDomain] = useState(config.custom_domain ?? "");
  const [fromEmail, setFromEmail] = useState(config.from_email ?? "");
  const [open, setOpen] = useState(!config.custom_domain);

  const handleSetup = async () => {
    const trimmedDomain = domain.trim().toLowerCase();
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(trimmedDomain)) {
      toast.error("Ungültige Domain", { description: "z.B. deine-kanzlei.de" });
      return;
    }
    const t = toast.loading("Domain wird angelegt…");
    try {
      const res = await verify.mutateAsync({
        custom_domain: trimmedDomain,
        from_email: fromEmail.trim() || undefined,
        action: "setup",
      });
      if (res.ok) {
        toast.success("DNS-Records bereit", {
          id: t,
          description: "Trage die Records bei deinem DNS-Provider ein.",
        });
      } else {
        toast.error("Fehlgeschlagen", { id: t, description: res.message });
      }
    } catch (e) {
      toast.error("Fehler", {
        id: t,
        description: e instanceof Error ? e.message : "Unbekannt",
      });
    }
  };

  const handlePoll = async () => {
    if (!config.custom_domain) return;
    const t = toast.loading("Prüfe DNS…");
    try {
      const res = await verify.mutateAsync({
        custom_domain: config.custom_domain,
        action: "poll",
      });
      if (res.verification_status === "verified") {
        toast.success("Domain verifiziert", { id: t });
      } else {
        toast.warning("Noch nicht verifiziert", {
          id: t,
          description: "DNS-Propagation kann bis zu 24h dauern.",
        });
      }
    } catch (e) {
      toast.error("Fehler", {
        id: t,
        description: e instanceof Error ? e.message : "Unbekannt",
      });
    }
  };

  const status =
    config.verification_status === "verified"
      ? { label: "Verifiziert", cls: "bg-emerald-500/15 text-emerald-700", Icon: CheckCircle2 }
      : config.custom_domain
        ? { label: "DNS ausstehend", cls: "bg-amber-500/15 text-amber-700", Icon: AlertCircle }
        : { label: "Keine Domain", cls: "bg-muted text-muted-foreground", Icon: AlertCircle };

  return (
    <Card
      icon={Mail}
      title="E-Mail (eigene Domain)"
      description="Mandanten-E-Mails kommen von Ihrer Kanzlei-Adresse. Eingehende E-Mails werden von der KI vorsortiert und beantwortet."
      statusLabel={status.label}
      statusCls={status.cls}
      StatusIcon={status.Icon}
      open={open}
      onToggle={() => setOpen(!open)}
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-accent/20 bg-accent/[0.04] p-4 text-sm text-foreground/80">
          Tragen Sie Ihre Kanzlei-Domain ein. Wir geben Ihnen{" "}
          <strong className="text-foreground">3 DNS-Einträge</strong> die Sie
          bei Ihrem Domain-Provider (Hetzner, Cloudflare, IONOS…) eintragen.
          Sobald die DNS aktiv sind, können Sie unter{" "}
          <code className="text-accent">kontakt@deine-kanzlei.de</code> senden
          und empfangen.
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-foreground block mb-1.5">
              Kanzlei-Domain
            </label>
            <input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="deine-kanzlei.de"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground block mb-1.5">
              Absender-Adresse
            </label>
            <input
              value={fromEmail}
              onChange={(e) => setFromEmail(e.target.value)}
              placeholder="kontakt@deine-kanzlei.de"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button variant="gold" onClick={handleSetup} disabled={verify.isPending}>
            {verify.isPending ? (
              <>
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                Lade DNS-Records…
              </>
            ) : config.custom_domain ? (
              "DNS-Records neu generieren"
            ) : (
              "Domain einrichten"
            )}
          </Button>
          {config.custom_domain && config.verification_status !== "verified" && (
            <Button variant="outline" onClick={handlePoll} disabled={verify.isPending}>
              Verifizierung prüfen
            </Button>
          )}
        </div>

        {config.dns_records && config.dns_records.length > 0 && (
          <div className="rounded-xl border border-border/50 overflow-hidden">
            <div className="px-4 py-2.5 bg-muted/30 text-xs font-semibold text-foreground">
              DNS-Einträge ({config.dns_records.length})
            </div>
            <div className="divide-y divide-border/50">
              {config.dns_records.map((r, i) => (
                <div key={i} className="px-3 sm:px-4 py-3 flex items-start gap-2 sm:gap-3 text-xs font-mono">
                  <span className="font-bold text-accent uppercase shrink-0 w-12">{r.type}</span>
                  <div className="space-y-0.5 break-all flex-1 min-w-0">
                    <div className="text-foreground">{r.name}</div>
                    <div className="text-muted-foreground">{r.value}</div>
                  </div>
                  <div className="shrink-0">
                    <CopyButton value={r.value} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

// =====================================================================
// Stripe Card — Connect-Account verbinden
// =====================================================================

const StripeCard = ({ config }: { config: StripeIntegration }) => {
  const connect = useConnectStripe();
  const [open, setOpen] = useState(!config.connect_account_id);

  const handleConnect = async () => {
    const t = toast.loading("Verbinde mit Zahlungsanbieter…");
    try {
      const res = await connect.mutateAsync();
      if (res.ok && !res.oauth_url) {
        toast.success("Status aktualisiert", {
          id: t,
          description: res.message,
        });
      }
    } catch (e) {
      toast.error("Fehler", {
        id: t,
        description: e instanceof Error ? e.message : "Unbekannt",
      });
    }
  };

  const status = !config.connect_account_id
    ? { label: "Nicht verbunden", cls: "bg-muted text-muted-foreground", Icon: AlertCircle }
    : config.charges_enabled
      ? { label: "Zahlungen aktiv", cls: "bg-emerald-500/15 text-emerald-700", Icon: CheckCircle2 }
      : { label: "Verifizierung läuft", cls: "bg-amber-500/15 text-amber-700", Icon: Loader2 };

  return (
    <Card
      icon={CreditCard}
      title="Mandanten-Zahlungen"
      description="Mandanten zahlen Ihre Rechnungen direkt im Portal per Karte oder SEPA. Geld geht direkt auf Ihr Bankkonto."
      statusLabel={status.label}
      statusCls={status.cls}
      StatusIcon={status.Icon}
      open={open}
      onToggle={() => setOpen(!open)}
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-accent/20 bg-accent/[0.04] p-4 text-sm text-foreground/80">
          <strong className="text-foreground">Sicher + direkt:</strong> Wir leiten
          Sie zur sicheren KYC-Verifizierung weiter (Steuer-ID, Bankkonto). Das
          dauert ~3 Minuten. Danach gehen Mandanten-Zahlungen ohne Umweg auf
          Ihr Konto.
        </div>
        {config.connect_account_id ? (
          <div className="space-y-2">
            <Row
              label="Karten-Zahlungen"
              ok={config.charges_enabled}
              okText="Aktiv"
              warnText="Verifizierung ausstehend"
            />
            <Row
              label="Auszahlungen aufs Bankkonto"
              ok={config.payouts_enabled}
              okText="Aktiv"
              warnText="Bankkonto noch nicht hinterlegt"
            />
            <Button variant="outline" onClick={handleConnect} disabled={connect.isPending} className="mt-2">
              Status aktualisieren
            </Button>
          </div>
        ) : (
          <Button variant="gold" onClick={handleConnect} disabled={connect.isPending}>
            {connect.isPending ? (
              <>
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                Lädt…
              </>
            ) : (
              "Zahlungs-Konto verbinden"
            )}
          </Button>
        )}
      </div>
    </Card>
  );
};

// =====================================================================
// Generic Card-Wrapper
// =====================================================================

interface CardProps {
  icon: typeof Phone;
  title: string;
  description: string;
  statusLabel: string;
  statusCls: string;
  StatusIcon: typeof CheckCircle2;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const Card = ({
  icon: Icon,
  title,
  description,
  statusLabel,
  statusCls,
  StatusIcon,
  open,
  onToggle,
  children,
}: CardProps) => (
  <div className="glass-card border-border/50 overflow-hidden">
    <button
      onClick={onToggle}
      className="w-full p-5 flex items-center gap-4 hover:bg-muted/20 transition-colors text-left"
    >
      <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center shrink-0">
        <Icon className="h-5 w-5 text-accent" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 flex-wrap">
          <h3 className="text-base font-display font-bold text-foreground">{title}</h3>
          <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded inline-flex items-center gap-1 ${statusCls}`}>
            <StatusIcon className="h-3 w-3" />
            {statusLabel}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>
      <span className="text-xs text-muted-foreground">{open ? "▴" : "▾"}</span>
    </button>
    {open && <div className="border-t border-border/50 p-5">{children}</div>}
  </div>
);

const Row = ({
  label,
  ok,
  okText,
  warnText,
}: {
  label: string;
  ok: boolean;
  okText: string;
  warnText: string;
}) => (
  <div className="flex items-center justify-between text-sm">
    <span className="text-foreground">{label}</span>
    <span className={`text-xs font-semibold inline-flex items-center gap-1 ${ok ? "text-emerald-700" : "text-amber-700"}`}>
      {ok ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
      {ok ? okText : warnText}
    </span>
  </div>
);

const CopyButton = ({ value }: { value: string }) => (
  <button
    onClick={async () => {
      await navigator.clipboard.writeText(value);
      toast.success("Kopiert");
    }}
    className="p-1.5 rounded-lg hover:bg-accent/10 text-accent transition-colors"
    title="Kopieren"
    aria-label="Wert kopieren"
  >
    <Copy className="h-3.5 w-3.5" />
  </button>
);

export default IntegrationenPage;
