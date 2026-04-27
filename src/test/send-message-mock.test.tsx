/**
 * useSendMessage Mock-Mode Verhalten:
 * Ohne Supabase-Config returnt {ok: true, mock_mode: true} mit ~600ms Delay.
 */
import { describe, expect, it } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useSendMessage } from "@/lib/queries/use-send-message";

const wrapper = ({ children }: { children: ReactNode }) => {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
};

describe("useSendMessage Mock-Mode", () => {
  it("returnt mock_mode=true bei Email-Versand", async () => {
    const { result } = renderHook(() => useSendMessage(), { wrapper });
    const promise = result.current.mutateAsync({
      channel: "email",
      to: "test@example.de",
      subject: "Test",
      text: "Body",
    });
    await waitFor(() => expect(result.current.isPending).toBe(true));
    const res = await promise;
    expect(res.ok).toBe(true);
    expect(res.mock_mode).toBe(true);
  });

  it("returnt mock_mode=true bei WhatsApp-Versand", async () => {
    const { result } = renderHook(() => useSendMessage(), { wrapper });
    const res = await result.current.mutateAsync({
      channel: "whatsapp",
      to: "+491234567890",
      text: "Hallo",
    });
    expect(res.ok).toBe(true);
    expect(res.mock_mode).toBe(true);
  });
});
