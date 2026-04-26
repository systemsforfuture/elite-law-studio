import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { rechnungen as mockRechnungen } from "@/data/mockData";
import type { Rechnung } from "@/data/types";

const useMockFallback = () => !isSupabaseConfigured || !supabase;

export const useRechnungenQuery = () =>
  useQuery({
    queryKey: ["rechnungen"],
    queryFn: async (): Promise<Rechnung[]> => {
      if (useMockFallback()) return mockRechnungen;
      const { data, error } = await supabase!
        .from("rechnungen")
        .select("*")
        .order("rechnungsdatum", { ascending: false });
      if (error) {
        console.warn("[rechnungen] fallback:", error.message);
        return mockRechnungen;
      }
      return (data ?? []) as unknown as Rechnung[];
    },
    staleTime: 30_000,
  });

export const useEskalateRechnung = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<Rechnung | null> => {
      if (useMockFallback()) {
        const r = mockRechnungen.find((x) => x.id === id);
        return r ? { ...r, mahnstufe: ((r.mahnstufe + 1) as Rechnung["mahnstufe"]) } : null;
      }
      // Server-side: eine RPC würde hier den nächsten Stufen-Übergang machen
      // Vorerst: Inkrement im Frontend
      const { data: cur } = await supabase!
        .from("rechnungen")
        .select("mahnstufe")
        .eq("id", id)
        .single();
      const next = Math.min(((cur?.mahnstufe ?? 0) + 1) as number, 4);
      const { data, error } = await supabase!
        .from("rechnungen")
        .update({ mahnstufe: next, naechste_aktion_am: new Date().toISOString().slice(0, 10) })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as Rechnung;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rechnungen"] }),
  });
};
