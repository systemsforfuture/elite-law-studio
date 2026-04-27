import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
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
      tenants: ["tenant", "provider-config", "provider-health"],
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

/**
 * Realtime-Toasts für neue Eskalations-Konversationen + neue Voice-Anrufe.
 * Mountet einmal in DashboardLayout. Suppress eigener Initial-Snapshot über
 * mount-time-cutoff: nur Events nach Hook-Mount erzeugen Toasts.
 */
export const useRealtimeToasts = () => {
  const navigate = useNavigate();
  const mountedAt = useRef(Date.now());

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    mountedAt.current = Date.now();

    const channel = supabase
      .channel("dashboard-toasts")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "konversationen" },
        (payload) => {
          const k = payload.new as {
            kanal?: string;
            status?: string;
            preview?: string;
            zeitpunkt?: string;
          };
          // Suppress wenn der Datensatz älter ist als die Mount-Zeit
          // (Backfill schützt vor Toast-Flut beim Reconnect).
          if (k.zeitpunkt && new Date(k.zeitpunkt).getTime() < mountedAt.current - 60_000) {
            return;
          }
          if (k.status === "escalated") {
            toast.warning("Neue Eskalation in der Inbox", {
              description: k.preview?.slice(0, 120) ?? "Anwalt-Antwort erforderlich.",
              action: { label: "Öffnen", onClick: () => navigate("/dashboard/inbox") },
            });
          } else if (k.kanal === "voice") {
            toast.info("Neuer KI-Anruf", {
              description: k.preview?.slice(0, 120) ?? "Voice-Receptionist hat einen Anruf entgegengenommen.",
              action: { label: "Anrufprotokoll", onClick: () => navigate("/dashboard/voice") },
            });
          }
        },
      )
      .subscribe();

    return () => {
      supabase!.removeChannel(channel);
    };
  }, [navigate]);
};
