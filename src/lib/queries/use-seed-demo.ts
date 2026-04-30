import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

interface SeedResult {
  ok?: boolean;
  skipped?: boolean;
  reason?: string;
  seeded?: {
    mandanten: number;
    akten: number;
    termine: number;
    rechnungen: number;
  };
  mock_mode?: boolean;
}

/**
 * Seed-Demo-Data: legt 3 Mandanten + 3 Akten + 2 Termine + 2 Rechnungen
 * für den eingeloggten Tenant an. Idempotent (skipped wenn bereits Daten).
 */
export const useSeedDemoData = () => {
  const qc = useQueryClient();
  return useMutation<SeedResult, Error, { force?: boolean } | void>({
    mutationFn: async (input) => {
      const force = (input as { force?: boolean } | undefined)?.force ?? false;
      if (!isSupabaseConfigured || !supabase) {
        await new Promise((r) => setTimeout(r, 600));
        return {
          ok: true,
          mock_mode: true,
          seeded: { mandanten: 3, akten: 3, termine: 2, rechnungen: 2 },
        };
      }
      const { data, error } = await supabase.functions.invoke(
        "seed-demo-data",
        { body: { force } },
      );
      if (error) throw error;
      if (!data) throw new Error("Keine Antwort vom Server");
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mandanten"] });
      qc.invalidateQueries({ queryKey: ["akten"] });
      qc.invalidateQueries({ queryKey: ["termine"] });
      qc.invalidateQueries({ queryKey: ["rechnungen"] });
    },
  });
};
