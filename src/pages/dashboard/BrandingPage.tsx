import { useState } from "react";
import { Palette, Globe, Mic, Sparkles, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTenant } from "@/contexts/TenantContext";
import { useUpdateBranding } from "@/lib/queries/use-tenant";
import { toast } from "sonner";
import type { Tonalitaet } from "@/data/types";

const BrandingPage = () => {
  const { tenant } = useTenant();
  const [primary, setPrimary] = useState(tenant.branding_config.primary_color);
  const [accent, setAccent] = useState(tenant.branding_config.accent_color);
  const [tonalitaet, setTonalitaet] = useState<Tonalitaet>(
    tenant.branding_config.tonalitaet,
  );
  const [greeting, setGreeting] = useState(
    tenant.branding_config.greeting ?? "",
  );
  const updateBranding = useUpdateBranding();

  const handleSave = async () => {
    const t = toast.loading("Branding wird gespeichert…");
    try {
      await updateBranding.mutateAsync({
        primary_color: primary,
        accent_color: accent,
        tonalitaet,
        greeting,
      });
      toast.success("Branding gespeichert", {
        id: t,
        description: "Voice-Engine + Mandanten-Portal nutzen ab sofort die neuen Werte.",
      });
    } catch (err) {
      toast.error("Speichern fehlgeschlagen", {
        id: t,
        description:
          err instanceof Error ? err.message : "Bitte erneut versuchen.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-card p-6 border-border/50 space-y-5">
          <div>
            <h3 className="font-display font-bold text-foreground flex items-center gap-2 mb-1">
              <Globe className="h-4 w-4 text-accent" />
              Domain
            </h3>
            <p className="text-xs text-muted-foreground">
              Eigene Domain für Mandanten-Portal & Lead-Funnel
            </p>
          </div>
          <div className="space-y-3">
            <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.04]">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wider text-emerald-700 font-semibold">
                    Aktiv
                  </div>
                  <div className="font-mono text-sm font-semibold text-foreground">
                    {tenant.domain}
                  </div>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
            </div>
            <div className="p-3 rounded-xl border border-border/50 bg-muted/20">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                Subdomain
              </div>
              <div className="font-mono text-sm text-foreground">
                {tenant.subdomain}
              </div>
            </div>
            <Button variant="outline" size="sm" className="rounded-xl">
              <ExternalLink className="mr-2 h-3.5 w-3.5" />
              Domain-Setup öffnen
            </Button>
          </div>
        </div>

        <div className="glass-card p-6 border-border/50 space-y-5">
          <div>
            <h3 className="font-display font-bold text-foreground flex items-center gap-2 mb-1">
              <Palette className="h-4 w-4 text-accent" />
              Farben & Logo
            </h3>
            <p className="text-xs text-muted-foreground">
              Wird auf Lead-Funnel + Mandanten-Portal angewendet
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <ColorBlock
              label="Primärfarbe"
              value={primary}
              onChange={setPrimary}
            />
            <ColorBlock
              label="Akzentfarbe"
              value={accent}
              onChange={setAccent}
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground/70 block mb-2">
              Logo-Upload
            </label>
            <div className="border-2 border-dashed border-border/50 rounded-xl p-6 text-center bg-muted/10 hover:bg-muted/20 transition-colors cursor-pointer">
              <p className="text-xs text-muted-foreground">
                SVG, PNG · Max 2 MB · Empfohlen 200x60px
              </p>
            </div>
          </div>
        </div>

        <div className="glass-card p-6 border-border/50 lg:col-span-2 space-y-5">
          <div>
            <h3 className="font-display font-bold text-foreground flex items-center gap-2 mb-1">
              <Mic className="h-4 w-4 text-accent" />
              Voice-Branding
            </h3>
            <p className="text-xs text-muted-foreground">
              Begrüßung & Stimme der KI-Empfangskraft
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground/70 block mb-2">
                Begrüßung
              </label>
              <textarea
                rows={3}
                value={greeting}
                onChange={(e) => setGreeting(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border/50 bg-background/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground/70 block mb-2">
                Tonalität
              </label>
              <select
                value={tonalitaet}
                onChange={(e) => setTonalitaet(e.target.value as Tonalitaet)}
                className="w-full px-4 py-3 rounded-xl border border-border/50 bg-background/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
              >
                <option value="formal">Formal</option>
                <option value="freundlich">Freundlich</option>
                <option value="empathisch">Empathisch</option>
                <option value="direkt">Direkt</option>
              </select>
              <div className="mt-3 p-3 rounded-xl border border-accent/20 bg-accent/[0.03]">
                <div className="text-[10px] uppercase tracking-wider text-accent font-semibold mb-1">
                  Aktive Voice-ID
                </div>
                <div className="font-mono text-xs text-foreground">
                  {tenant.branding_config.voice_id}
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">
                  SYSTEMS Voice-Cloning · 99% Naturklang
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          variant="gold"
          className="rounded-xl glow-sm-gold"
          onClick={handleSave}
          disabled={updateBranding.isPending}
        >
          {updateBranding.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Speichere…
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Branding speichern & deployen
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

const ColorBlock = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) => (
  <div>
    <label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground/70 block mb-2">
      {label}
    </label>
    <div className="flex items-center gap-3 p-2 rounded-xl border border-border/50 bg-background/50">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-transparent text-foreground text-sm font-mono focus:outline-none"
      />
    </div>
  </div>
);

export default BrandingPage;
