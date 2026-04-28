import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { warnMockFallback } from "@/lib/queries/warn-fallback";
import { konversationen as mockKonversationen } from "@/data/mockData";
import type { Konversation } from "@/data/types";

const shouldMock = () => !isSupabaseConfigured || !supabase;

export const useKonversationenQuery = () =>
  useQuery({
    queryKey: ["konversationen"],
    queryFn: async (): Promise<Konversation[]> => {
      if (shouldMock()) return mockKonversationen;
      const { data, error } = await supabase!
        .from("konversationen")
        .select("*")
        .order("zeitpunkt", { ascending: false });
      if (error) {
        warnMockFallback("konversationen", error.message);
        return mockKonversationen;
      }
      return (data ?? []) as unknown as Konversation[];
    },
    staleTime: 15_000,
  });

/**
 * Setzt alle ungelesenen Konversationen auf gelesen. RLS sorgt dafür, dass
 * nur eigene tenant_id-Rows angefasst werden. Mock-Modus aktualisiert nur
 * den react-query-Cache.
 */
export const useMarkAllKonversationenRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<{ updated: number }> => {
      if (shouldMock()) {
        const cached = qc.getQueryData<Konversation[]>(["konversationen"]) ?? [];
        const ungelesen = cached.filter((k) => k.ungelesen).length;
        return { updated: ungelesen };
      }
      const { data, error } = await supabase!
        .from("konversationen")
        .update({ ungelesen: false })
        .eq("ungelesen", true)
        .select("id");
      if (error) throw error;
      return { updated: data?.length ?? 0 };
    },
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ["konversationen"] });
      const previous = qc.getQueryData<Konversation[]>(["konversationen"]);
      qc.setQueryData<Konversation[]>(["konversationen"], (old) =>
        (old ?? []).map((k) => (k.ungelesen ? { ...k, ungelesen: false } : k)),
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(["konversationen"], ctx.previous);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["konversationen"] });
    },
  });
};
