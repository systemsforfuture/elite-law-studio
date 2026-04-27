/**
 * Mock-Mode Tests für die 4 Provider-Hooks.
 * In Mock-Mode (kein Supabase) werden alle Calls simuliert; wir prüfen
 * dass die Hooks sauber initialisieren und sinnvolle Defaults liefern.
 */
import { describe, expect, it } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import {
  useProviderConfig,
  useProviderHealth,
} from "@/lib/queries/use-provider-config";

const wrapper = ({ children }: { children: ReactNode }) => {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
};

describe("useProviderConfig", () => {
  it("liefert default-Schema in Mock-Mode", async () => {
    const { result } = renderHook(() => useProviderConfig("tnt_test"), { wrapper });
    await waitFor(() => expect(result.current.data).toBeDefined());
    const cfg = result.current.data!;
    expect(cfg.voice.enabled).toBe(false);
    expect(cfg.voice.status).toBe("not_provisioned");
    expect(cfg.whatsapp.verification_status).toBe("pending");
    expect(cfg.email.verification_status).toBe("pending");
    expect(cfg.email.dns_records).toEqual([]);
    expect(cfg.stripe.charges_enabled).toBe(false);
    expect(cfg.stripe.payouts_enabled).toBe(false);
  });

  it("ist disabled wenn tenantId fehlt", () => {
    const { result } = renderHook(() => useProviderConfig(undefined), { wrapper });
    // Query enabled=false → keine Daten geladen
    expect(result.current.data).toBeUndefined();
    expect(result.current.fetchStatus).toBe("idle");
  });
});

describe("useProviderHealth", () => {
  it("liefert default-Health in Mock-Mode", async () => {
    const { result } = renderHook(() => useProviderHealth(), { wrapper });
    await waitFor(() => expect(result.current.data).toBeDefined());
    const h = result.current.data!;
    expect(h.voice.configured).toBe(false);
    expect(h.voice.status).toBe("not_provisioned");
    expect(h.whatsapp.verification_status).toBe("pending");
    expect(h.email.verification_status).toBe("pending");
    expect(h.stripe.charges_enabled).toBe(false);
  });
});
