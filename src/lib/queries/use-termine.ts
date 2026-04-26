import { useQuery } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
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
        console.warn("[termine] fallback:", error.message);
        return mockTermine;
      }
      return (data ?? []) as unknown as Termin[];
    },
    staleTime: 30_000,
  });
