import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { warnMockFallback } from "@/lib/queries/warn-fallback";
import type {
  ProviderConfig,
  ProviderHealth,
  ProviderName,
  VapiConfig,
  WhatsappConfig,
  ResendConfig,
  StripeConfig,
} from "@/data/types";

const shouldMock = () => !isSupabaseConfigured || !supabase;

const mockConfig: ProviderConfig = {
  vapi: {
    enabled: false,
    api_key: null,
    assistant_id: null,
    phone_number_id: null,
    webhook_secret: null,
    last_test_at: null,
    last_test_ok: null,
  },
  whatsapp: {
    enabled: false,
    provider: "360dialog",
    api_key: null,
    phone_number_id: null,
    webhook_secret: null,
    last_test_at: null,
    last_test_ok: null,
  },
  resend: {
    enabled: false,
    api_key: null,
    from_email: null,
    verified_domain: null,
    inbound_webhook_secret: null,
    last_test_at: null,
    last_test_ok: null,
  },
  stripe: {
    enabled: false,
    secret_key: null,
    webhook_secret: null,
    connect_account_id: null,
    last_test_at: null,
    last_test_ok: null,
  },
};

const mockHealth: ProviderHealth = {
  vapi: { enabled: false, configured: false, last_test_at: null, last_test_ok: null },
  whatsapp: { enabled: false, configured: false, last_test_at: null, last_test_ok: null },
  resend: { enabled: false, configured: false, verified_domain: null, last_test_at: null, last_test_ok: null },
  stripe: { enabled: false, configured: false, last_test_at: null, last_test_ok: null },
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
      // Felder mergen damit fehlende Slots Default-Werte haben
      return { ...mockConfig, ...cfg };
    },
    staleTime: 30_000,
  });

interface UpdateInput {
  tenant_id: string;
  provider: ProviderName;
  patch: Partial<VapiConfig | WhatsappConfig | ResendConfig | StripeConfig>;
}

export const useUpdateProviderConfig = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ tenant_id, provider, patch }: UpdateInput) => {
      if (shouldMock()) {
        await new Promise((r) => setTimeout(r, 300));
        Object.assign(mockConfig[provider] as Record<string, unknown>, patch);
        return mockConfig[provider];
      }
      // RPC oder direkter UPDATE — Trigger blockt non-owner.
      const { data: existing, error: fetchErr } = await supabase!
        .from("tenants")
        .select("provider_config")
        .eq("id", tenant_id)
        .single();
      if (fetchErr) throw fetchErr;
      const merged = {
        ...(existing.provider_config as Record<string, unknown>),
        [provider]: {
          ...(existing.provider_config as Record<string, Record<string, unknown>>)[provider],
          ...patch,
        },
      };
      const { error } = await supabase!
        .from("tenants")
        .update({ provider_config: merged })
        .eq("id", tenant_id);
      if (error) throw error;
      return merged[provider];
    },
    onSuccess: (_, { tenant_id }) => {
      qc.invalidateQueries({ queryKey: ["provider-config", tenant_id] });
      qc.invalidateQueries({ queryKey: ["provider-health"] });
    },
  });
};

export const useProviderHealth = () =>
  useQuery({
    queryKey: ["provider-health"],
    queryFn: async (): Promise<ProviderHealth> => {
      if (shouldMock()) return mockHealth;
      const { data, error } = await supabase!.rpc("provider_health");
      if (error) {
        warnMockFallback("provider-health", error.message);
        return mockHealth;
      }
      return data as unknown as ProviderHealth;
    },
    staleTime: 60_000,
  });

interface TestResult {
  ok: boolean;
  message: string;
  details?: unknown;
}

/**
 * Pingt den Provider mit den eingetragenen Credentials.
 * In Mock-Mode: simulierte Antwort. In Production: echter API-Call.
 */
export const useTestProvider = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      provider,
    }: {
      provider: ProviderName;
    }): Promise<TestResult> => {
      if (shouldMock()) {
        await new Promise((r) => setTimeout(r, 800));
        return {
          ok: false,
          message: `Demo-Modus: bitte echte ${provider}-Credentials eintragen + deployen.`,
        };
      }
      const { data, error } = await supabase!.functions.invoke<TestResult>(
        "test-provider",
        { body: { provider } },
      );
      if (error) throw error;
      if (!data) throw new Error("Keine Antwort vom Test-Endpoint");
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["provider-health"] });
      qc.invalidateQueries({ queryKey: ["provider-config"] });
    },
  });
};
