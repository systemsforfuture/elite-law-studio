import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

/**
 * Subscribed alle relevanten Tables und invalidated react-query Caches
 * wenn neue Rows kommen. Globaler Subscriber — einmal in DashboardLayout
 * mounten reicht.
 */
export const useRealtimeSubscriptions = () => {
  const qc = useQueryClient();

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    const TABLES_INVALIDATE: Record<string, string[]> = {
      mandanten: ["mandanten"],
      akten: ["akten"],
      konversationen: ["konversationen"],
      termine: ["termine"],
      dokumente: ["dokumente"],
      rechnungen: ["rechnungen"],
      activities: ["activities"],
      anwalts_strategien: ["strategien"],
      audit_log: ["audit"],
      zeiterfassung: ["zeiterfassung"],
      urlaub_antraege: ["urlaub"],
    };

    const channel = supabase
      .channel("dashboard-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public" },
        (payload) => {
          const table = payload.table as string;
          const keys = TABLES_INVALIDATE[table];
          if (keys) {
            for (const key of keys) {
              qc.invalidateQueries({ queryKey: [key] });
            }
          }
        },
      )
      .subscribe();

    return () => {
      supabase!.removeChannel(channel);
    };
  }, [qc]);
};
