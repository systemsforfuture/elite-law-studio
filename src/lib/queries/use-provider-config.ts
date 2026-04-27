import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { warnMockFallback } from "@/lib/queries/warn-fallback";
import type {
  EmailDnsRecord,
  IntegrationHealth,
  ProviderConfig,
} from "@/data/types";

const shouldMock = () => !isSupabaseConfigured || !supabase;

const mockConfig: ProviderConfig = {
  voice: {
    enabled: false,
    phone_number: null,
    phone_number_id: null,
    voice_id: "anna_de_friendly",
    greeting: null,
    provisioned_at: null,
    status: "not_provisioned",
  },
  whatsapp: {
    enabled: false,
    phone_number: null,
    verification_status: "pending",
    verified_at: null,
    requested_at: null,
  },
  email: {
    enabled: false,
    custom_domain: null,
    from_email: null,
    verification_status: "pending",
    dns_records: [],
    verified_at: null,
  },
  stripe: {
    enabled: false,
    connect_account_id: null,
    charges_enabled: false,
    payouts_enabled: false,
    connected_at: null,
  },
};

const mockHealth: IntegrationHealth = {
  voice: { enabled: false, configured: false, phone_number: null, status: "not_provisioned" },
  whatsapp: { enabled: false, configured: false, phone_number: null, verification_status: "pending" },
  email: {
    enabled: false,
    configured: false,
    custom_domain: null,
    from_email: null,
    verification_status: "pending",
  },
  stripe: { enabled: false, configured: false, charges_enabled: false, payouts_enabled: false },
};

export const useProviderConfig = (tenantId: string | undefined) =>
  useQuery({
    queryKey: ["provider-config", tenantId],
    enabled: Boolean(tenantId),
    queryFn: async (): Promise<ProviderConfig> => {
      if (shouldMock() || !tenantId) return mockConfig;
      const { data, error } = await supabase!
        .from("tenants")
        .select("provider_config")
        .eq("id", tenantId)
        .maybeSingle();
      if (error) {
        warnMockFallback("provider-config", error.message);
        return mockConfig;
      }
      const cfg = (data?.provider_config ?? {}) as Partial<ProviderConfig>;
      return { ...mockConfig, ...cfg };
    },
    staleTime: 30_000,
  });

export const useProviderHealth = () =>
  useQuery({
    queryKey: ["provider-health"],
    queryFn: async (): Promise<IntegrationHealth> => {
      if (shouldMock()) return mockHealth;
      const { data, error } = await supabase!.rpc("provider_health");
      if (error) {
        warnMockFallback("provider-health", error.message);
        return mockHealth;
      }
      return data as unknown as IntegrationHealth;
    },
    staleTime: 30_000,
  });

// =============================================================
// Voice — KI-Telefonnummer provisionieren
// =============================================================

interface ProvisionVoiceInput {
  area_code?: string;
  greeting?: string;
}

interface ProvisionVoiceResult {
  ok: boolean;
  phone_number?: string;
  message?: string;
}

export const useProvisionVoice = () => {
  const qc = useQueryClient();
  return useMutation<ProvisionVoiceResult, Error, ProvisionVoiceInput>({
    mutationFn: async (input) => {
      if (shouldMock()) {
        await new Promise((r) => setTimeout(r, 1500));
        return {
          ok: true,
          phone_number: `+49 30 ${input.area_code ?? "5556677"}-${Math.floor(Math.random() * 9000) + 1000}`,
          message: "Demo-Modus: provisionierte Telefon-Nummer ist nicht real",
        };
      }
      const { data, error } = await supabase!.functions.invoke<ProvisionVoiceResult>(
        "provision-voice-number",
        { body: input },
      );
      if (error) throw error;
      if (!data) throw new Error("Keine Antwort");
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["provider-config"] });
      qc.invalidateQueries({ queryKey: ["provider-health"] });
    },
  });
};

// =============================================================
// WhatsApp — eigene Nummer einrichten lassen
// =============================================================

interface LinkWhatsappInput {
  phone_number: string;
}

interface LinkWhatsappResult {
  ok: boolean;
  message?: string;
}

export const useLinkWhatsapp = () => {
  const qc = useQueryClient();
  return useMutation<LinkWhatsappResult, Error, LinkWhatsappInput>({
    mutationFn: async (input) => {
      if (shouldMock()) {
        await new Promise((r) => setTimeout(r, 800));
        return {
          ok: true,
          message: "Demo-Modus: WhatsApp-Verlinkung simuliert. Production: SYSTEMS-Team meldet sich in 24h.",
        };
      }
      const { data, error } = await supabase!.functions.invoke<LinkWhatsappResult>(
        "link-whatsapp-number",
        { body: input },
      );
      if (error) throw error;
      if (!data) throw new Error("Keine Antwort");
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["provider-config"] });
      qc.invalidateQueries({ queryKey: ["provider-health"] });
    },
  });
};

// =============================================================
// Email-Domain — verifizieren
// =============================================================

interface VerifyEmailInput {
  custom_domain: string;
  from_email?: string;
  /** Bei action="poll" nur Status checken, kein neues Setup */
  action?: "setup" | "poll";
}

interface VerifyEmailResult {
  ok: boolean;
  verification_status: "pending" | "verified" | "failed";
  dns_records?: EmailDnsRecord[];
  message?: string;
}

export const useVerifyEmailDomain = () => {
  const qc = useQueryClient();
  return useMutation<VerifyEmailResult, Error, VerifyEmailInput>({
    mutationFn: async (input) => {
      if (shouldMock()) {
        await new Promise((r) => setTimeout(r, 1000));
        return {
          ok: true,
          verification_status: "pending",
          dns_records: [
            { type: "TXT", name: `send.${input.custom_domain}`, value: "v=spf1 include:_spf.systems-tm.de ~all" },
            { type: "TXT", name: `_systems._domainkey.${input.custom_domain}`, value: "k=rsa; p=DEMO_DKIM_KEY" },
            { type: "MX", name: `inbound.${input.custom_domain}`, value: "feedback-smtp.systems-tm.de", ttl: 3600 },
          ],
          message: "Demo: trage diese 3 DNS-Records bei deinem Provider ein",
        };
      }
      const { data, error } = await supabase!.functions.invoke<VerifyEmailResult>(
        "verify-email-domain",
        { body: input },
      );
      if (error) throw error;
      if (!data) throw new Error("Keine Antwort");
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["provider-config"] });
      qc.invalidateQueries({ queryKey: ["provider-health"] });
    },
  });
};

// =============================================================
// Stripe — Connect-Account verbinden
// =============================================================

interface ConnectStripeResult {
  ok: boolean;
  /** OAuth-URL zu Stripe — Frontend leitet hierhin */
  oauth_url?: string;
  /** Status-Update wenn schon connected */
  charges_enabled?: boolean;
  payouts_enabled?: boolean;
  message?: string;
}

export const useConnectStripe = () => {
  const qc = useQueryClient();
  return useMutation<ConnectStripeResult, Error, void>({
    mutationFn: async () => {
      if (shouldMock()) {
        await new Promise((r) => setTimeout(r, 600));
        return {
          ok: true,
          message: "Demo-Modus: Stripe-Connect-Onboarding wird in Production zu Stripe weitergeleitet.",
        };
      }
      const { data, error } = await supabase!.functions.invoke<ConnectStripeResult>(
        "connect-stripe",
        { body: {} },
      );
      if (error) throw error;
      if (!data) throw new Error("Keine Antwort");
      // Wenn OAuth-URL kommt, redirecten
      if (data.oauth_url) {
        window.location.href = data.oauth_url;
      }
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["provider-config"] });
      qc.invalidateQueries({ queryKey: ["provider-health"] });
    },
  });
};
