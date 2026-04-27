import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { warnMockFallback } from "@/lib/queries/warn-fallback";
import { akten as mockAkten, strategien as mockStrategien } from "@/data/mockData";
import type { Akte, AnwaltsStrategie } from "@/data/types";

const shouldMock = () => !isSupabaseConfigured || !supabase;

// jsonb-Spalten können null sein wenn nie initialisiert. Normalisieren bevor ans
// Frontend, damit a.fristen.map() & co nicht crashen.
const normalizeAkte = (a: unknown): Akte => {
  const row = a as Akte & { fristen: Akte["fristen"] | null };
  return {
    ...row,
    fristen: Array.isArray(row.fristen) ? row.fristen : [],
  } as Akte;
};

export const useAktenQuery = () =>
  useQuery({
    queryKey: ["akten"],
    queryFn: async (): Promise<Akte[]> => {
      if (shouldMock()) return mockAkten;
      const { data, error } = await supabase!
        .from("akten")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        warnMockFallback("akten", error.message);
        return mockAkten;
      }
      return (data ?? []).map(normalizeAkte);
    },
    staleTime: 30_000,
  });

export const useAkteQuery = (id: string | undefined | null) =>
  useQuery({
    queryKey: ["akten", id],
    enabled: Boolean(id),
    queryFn: async (): Promise<Akte | null> => {
      if (!id) return null;
      if (shouldMock()) return mockAkten.find((a) => a.id === id) ?? null;
      const { data, error } = await supabase!
        .from("akten")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) return mockAkten.find((a) => a.id === id) ?? null;
      return data ? normalizeAkte(data) : null;
    },
  });

export const useStrategienQuery = () =>
  useQuery({
    queryKey: ["strategien"],
    queryFn: async (): Promise<AnwaltsStrategie[]> => {
      if (shouldMock()) return mockStrategien;
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
      if (shouldMock())
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

export interface GenerateStrategieInput {
  akte_id: string;
  iteration_prompt?: string;
}

export const useGenerateStrategie = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      akte_id,
      iteration_prompt,
    }: GenerateStrategieInput): Promise<AnwaltsStrategie | null> => {
      if (shouldMock()) {
        console.info("[strategie] Mock-Generation für", akte_id);
        await new Promise((r) => setTimeout(r, 1500));
        return mockStrategien.find((s) => s.akte_id === akte_id) ?? null;
      }
      const { data, error } = await supabase!.functions.invoke(
        "generate-strategie",
        {
          body: { akte_id, iteration_prompt },
        },
      );
      if (error) throw error;
      const strategie = (data as { strategie?: AnwaltsStrategie })?.strategie;
      if (!strategie) throw new Error("Keine Strategie zurückgegeben");
      return strategie;
    },
    onSuccess: (_, { akte_id }) => {
      qc.invalidateQueries({ queryKey: ["strategien", akte_id] });
      qc.invalidateQueries({ queryKey: ["strategien"] });
    },
  });
};
