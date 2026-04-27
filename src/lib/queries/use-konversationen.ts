import { useQuery } from "@tanstack/react-query";
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
