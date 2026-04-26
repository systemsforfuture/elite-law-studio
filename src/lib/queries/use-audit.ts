import { useQuery } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { auditLog as mockAuditLog } from "@/data/mockData";
import type { AuditEvent } from "@/data/types";

const useMockFallback = () => !isSupabaseConfigured || !supabase;

export const useAuditLog = (limit = 100) =>
  useQuery({
    queryKey: ["audit_log", limit],
    queryFn: async (): Promise<AuditEvent[]> => {
      if (useMockFallback()) return mockAuditLog;
      const { data, error } = await supabase!
        .from("audit_log")
        .select("id, ts, action, entity_type, entity_id, ip_address, details, user_id")
        .order("ts", { ascending: false })
        .limit(limit);
      if (error) {
        console.warn("[audit_log] fallback:", error.message);
        return mockAuditLog;
      }
      // user_name kommt aus public.users — separat joinen
      const userIds = Array.from(
        new Set(data.map((r) => r.user_id).filter(Boolean) as string[]),
      );
      const userMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: users } = await supabase!
          .from("users")
          .select("id, name")
          .in("id", userIds);
        for (const u of users ?? []) {
          userMap[(u as { id: string }).id] = (u as { name: string }).name;
        }
      }
      return data.map((r) => ({
        id: r.id,
        ts: r.ts,
        action: r.action,
        entity_type: r.entity_type,
        entity_id: r.entity_id ?? undefined,
        ip_address: (r.ip_address as string) ?? "—",
        details: r.details ?? undefined,
        user_name:
          r.user_id && userMap[r.user_id]
            ? userMap[r.user_id]
            : "SYSTEMS-KI",
      })) as unknown as AuditEvent[];
    },
    staleTime: 15_000,
  });
