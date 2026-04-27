/**
 * warnMockFallback de-dupliziert Warnings pro Schlüssel und Session.
 */
import { describe, expect, it, beforeEach, vi } from "vitest";
import { warnMockFallback, __resetWarnedKeys } from "@/lib/queries/warn-fallback";

vi.mock("sonner", () => ({
  toast: { error: vi.fn() },
}));
vi.mock("@/lib/supabase", () => ({
  isSupabaseConfigured: true,
  supabase: null,
}));

import { toast } from "sonner";

describe("warnMockFallback", () => {
  beforeEach(() => {
    __resetWarnedKeys();
    vi.clearAllMocks();
  });

  it("ruft toast.error genau einmal pro Key", () => {
    warnMockFallback("akten", "boom");
    warnMockFallback("akten", "again");
    warnMockFallback("akten", "third");
    expect(toast.error).toHaveBeenCalledTimes(1);
  });

  it("Toast pro Key separat", () => {
    warnMockFallback("akten", "boom");
    warnMockFallback("mandanten", "boom");
    warnMockFallback("rechnungen", "boom");
    expect(toast.error).toHaveBeenCalledTimes(3);
  });

  it("nach __resetWarnedKeys wieder Toast", () => {
    warnMockFallback("akten", "boom");
    expect(toast.error).toHaveBeenCalledTimes(1);
    __resetWarnedKeys();
    warnMockFallback("akten", "boom");
    expect(toast.error).toHaveBeenCalledTimes(2);
  });
});
