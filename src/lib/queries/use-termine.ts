import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { warnMockFallback } from "@/lib/queries/warn-fallback";
import { termine as mockTermine } from "@/data/mockData";
import type { Termin } from "@/data/types";

const shouldMock = () => !isSupabaseConfigured || !supabase;

export const useTermineQuery = () =>
  useQuery({
    queryKey: ["termine"],
    queryFn: async (): Promise<Termin[]> => {
      if (shouldMock()) return mockTermine;
      const { data, error } = await supabase!
        .from("termine")
        .select("*")
        .order("start_at", { ascending: true });
      if (error) {
        warnMockFallback("termine", error.message);
        return mockTermine;
      }
      return (data ?? []) as unknown as Termin[];
    },
    staleTime: 30_000,
  });

/**
 * Setzt termin.bestaetigt = true. Optimistic-Update mit Rollback.
 */
export const useConfirmTermin = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<Termin | null> => {
      if (shouldMock()) {
        const t = mockTermine.find((x) => x.id === id);
        if (!t) return null;
        t.bestaetigt = true;
        return t;
      }
      const { data, error } = await supabase!
        .from("termine")
        .update({ bestaetigt: true })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as Termin;
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["termine"] });
      const previous = qc.getQueryData<Termin[]>(["termine"]);
      qc.setQueryData<Termin[]>(["termine"], (old) =>
        (old ?? []).map((t) => (t.id === id ? { ...t, bestaetigt: true } : t)),
      );
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      if (ctx && "previous" in ctx && ctx.previous) {
        qc.setQueryData(["termine"], ctx.previous);
      }
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["termine"] }),
  });
};
