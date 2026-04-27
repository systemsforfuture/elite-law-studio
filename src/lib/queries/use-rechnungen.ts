import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { rechnungen as mockRechnungen } from "@/data/mockData";
import type { Rechnung } from "@/data/types";

const shouldMock = () => !isSupabaseConfigured || !supabase;

export const useRechnungenQuery = () =>
  useQuery({
    queryKey: ["rechnungen"],
    queryFn: async (): Promise<Rechnung[]> => {
      if (shouldMock()) return mockRechnungen;
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

export interface MahnungResult {
  rechnung: Rechnung;
  mahn_text: string;
  stufe: 1 | 2 | 3 | 4;
}

export const useGenerateMahnung = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<MahnungResult | null> => {
      if (shouldMock()) {
        const r = mockRechnungen.find((x) => x.id === id);
        if (!r) return null;
        const stufe = Math.min(r.mahnstufe + 1, 4) as 1 | 2 | 3 | 4;
        // Mock-Mode: tatsächlich Mock-Array mutieren, damit die
        // Liste nach Autopilot-Approve die neue Stufe zeigt
        // (Production-DB macht das via UPDATE in der Edge Function).
        r.mahnstufe = stufe;
        r.status =
          stufe === 1
            ? "mahnung_1"
            : stufe === 2
              ? "mahnung_2"
              : stufe === 3
                ? "mahnung_3"
                : "gerichtlich";
        return {
          rechnung: r,
          stufe,
          mahn_text:
            "[Mock] Sehr geehrter Mandant,\n\nleider haben wir Ihre Zahlung der Rechnung " +
            r.rechnungsnummer +
            " in Höhe von " +
            r.betrag_brutto +
            "€ noch nicht erhalten. Bitte überweisen Sie den Betrag bis zum nächsten Werktag.\n\nMit freundlichen Grüßen,\nIhre Kanzlei",
        };
      }
      const { data, error } = await supabase!.functions.invoke(
        "generate-mahnung",
        { body: { rechnung_id: id } },
      );
      if (error) throw error;
      return data as MahnungResult;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rechnungen"] }),
  });
};
