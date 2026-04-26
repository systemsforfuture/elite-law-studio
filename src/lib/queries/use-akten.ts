import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { akten as mockAkten, strategien as mockStrategien } from "@/data/mockData";
import type { Akte, AnwaltsStrategie } from "@/data/types";

const useMockFallback = () => !isSupabaseConfigured || !supabase;

export const useAktenQuery = () =>
  useQuery({
    queryKey: ["akten"],
    queryFn: async (): Promise<Akte[]> => {
      if (useMockFallback()) return mockAkten;
      const { data, error } = await supabase!
        .from("akten")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        console.warn("[akten] fallback:", error.message);
        return mockAkten;
      }
      return (data ?? []) as unknown as Akte[];
    },
    staleTime: 30_000,
  });

export const useAkteQuery = (id: string | undefined | null) =>
  useQuery({
    queryKey: ["akten", id],
    enabled: Boolean(id),
    queryFn: async (): Promise<Akte | null> => {
      if (!id) return null;
      if (useMockFallback()) return mockAkten.find((a) => a.id === id) ?? null;
      const { data, error } = await supabase!
        .from("akten")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) return mockAkten.find((a) => a.id === id) ?? null;
      return data as unknown as Akte | null;
    },
  });

export const useStrategienQuery = () =>
  useQuery({
    queryKey: ["strategien"],
    queryFn: async (): Promise<AnwaltsStrategie[]> => {
      if (useMockFallback()) return mockStrategien;
      const { data, error } = await supabase!
        .from("anwalts_strategien")
        .select("*")
        .order("generated_at", { ascending: false });
      if (error) return mockStrategien;
      return (data ?? []) as unknown as AnwaltsStrategie[];
    },
  });

export const useStrategieQuery = (akte_id: string | undefined | null) =>
  useQuery({
    queryKey: ["strategien", akte_id],
    enabled: Boolean(akte_id),
    queryFn: async (): Promise<AnwaltsStrategie | null> => {
      if (!akte_id) return null;
      if (useMockFallback())
        return mockStrategien.find((s) => s.akte_id === akte_id) ?? null;
      const { data, error } = await supabase!
        .from("anwalts_strategien")
        .select("*")
        .eq("akte_id", akte_id)
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error)
        return mockStrategien.find((s) => s.akte_id === akte_id) ?? null;
      return data as unknown as AnwaltsStrategie | null;
    },
  });

export const useGenerateStrategie = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (akte_id: string): Promise<AnwaltsStrategie | null> => {
      // KI-Strategie-Generierung: in Sprint 3 via Edge Function. Vorerst No-op.
      console.info("[strategie] Generate-Mock für", akte_id);
      return mockStrategien.find((s) => s.akte_id === akte_id) ?? null;
    },
    onSuccess: (_, akte_id) =>
      qc.invalidateQueries({ queryKey: ["strategien", akte_id] }),
  });
};
