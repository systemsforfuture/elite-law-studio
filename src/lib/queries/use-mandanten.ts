import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { warnMockFallback } from "@/lib/queries/warn-fallback";
import { mandanten as mockMandanten } from "@/data/mockData";
import type { Mandant } from "@/data/types";

const QK = ["mandanten"] as const;

const shouldMock = () => !isSupabaseConfigured || !supabase;

/**
 * Mandanten-Liste. Greift auf Supabase zu wenn konfiguriert, sonst Mock.
 */
export const useMandantenQuery = () =>
  useQuery({
    queryKey: QK,
    queryFn: async (): Promise<Mandant[]> => {
      if (shouldMock()) return mockMandanten;
      const { data, error } = await supabase!
        .from("mandanten")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        warnMockFallback("mandanten", error.message);
        return mockMandanten;
      }
      return (data ?? []) as unknown as Mandant[];
    },
    staleTime: 30_000,
  });

export const useMandantQuery = (id: string | undefined | null) =>
  useQuery({
    queryKey: [...QK, id],
    enabled: Boolean(id),
    queryFn: async (): Promise<Mandant | null> => {
      if (!id) return null;
      if (shouldMock()) {
        return mockMandanten.find((m) => m.id === id) ?? null;
      }
      const { data, error } = await supabase!
        .from("mandanten")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) {
        warnMockFallback("mandant", error.message);
        return mockMandanten.find((m) => m.id === id) ?? null;
      }
      return data as unknown as Mandant | null;
    },
    staleTime: 30_000,
  });

export const useCreateMandant = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: Omit<Mandant, "id" | "created_at" | "tenant_id" | "last_contact"> & {
        tenant_id?: string;
        last_contact?: string;
      },
    ): Promise<Mandant> => {
      if (shouldMock()) {
        // No-op in mock mode
        const fake: Mandant = {
          ...input,
          id: `mock_${Date.now()}`,
          created_at: new Date().toISOString(),
          tenant_id: input.tenant_id ?? "tnt_mock",
          last_contact: input.last_contact ?? new Date().toISOString(),
        };
        return fake;
      }
      const { data, error } = await supabase!
        .from("mandanten")
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as Mandant;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK });
    },
  });
};

export const useUpdateMandant = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<Mandant>;
    }): Promise<Mandant> => {
      if (shouldMock()) {
        const m = mockMandanten.find((x) => x.id === id);
        if (!m) throw new Error("Nicht gefunden");
        return { ...m, ...patch };
      }
      const { data, error } = await supabase!
        .from("mandanten")
        .update(patch)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as Mandant;
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: QK });
      qc.invalidateQueries({ queryKey: [...QK, id] });
    },
  });
};

export const useDeleteMandant = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (shouldMock()) return;
      const { error } = await supabase!.from("mandanten").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
  });
};
