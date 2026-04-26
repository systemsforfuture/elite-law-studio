import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { kiAgents as mockAgents } from "@/data/mockData";
import type { AgentSlug, KIAgent, Tonalitaet } from "@/data/types";

const useMockFallback = () => !isSupabaseConfigured || !supabase;

export interface AgentConfig {
  status: "aktiv" | "pausiert" | "nicht_konfiguriert";
  konfidenz_threshold: number;
  tonalitaet: Tonalitaet;
  custom_prompt_addition: string | null;
}

/**
 * Liest agent_config JSONB vom Tenant + merged mit statischen Mock-Beschreibungen.
 */
export const useAgentsQuery = () =>
  useQuery({
    queryKey: ["agent_config"],
    queryFn: async (): Promise<KIAgent[]> => {
      if (useMockFallback()) return mockAgents;

      const { data, error } = await supabase!
        .from("tenants")
        .select("agent_config")
        .single();
      if (error || !data) return mockAgents;

      const cfg = (data.agent_config ?? {}) as Record<string, AgentConfig>;
      return mockAgents.map((a) => {
        const c = cfg[a.slug];
        if (!c) return a;
        return {
          ...a,
          status: c.status ?? a.status,
          konfidenz_threshold: c.konfidenz_threshold ?? a.konfidenz_threshold,
          tonalitaet: c.tonalitaet ?? a.tonalitaet,
          custom_prompt_addition:
            c.custom_prompt_addition ?? a.custom_prompt_addition,
        };
      });
    },
    staleTime: 30_000,
  });

export const useUpdateAgentConfig = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      slug,
      patch,
    }: {
      slug: AgentSlug;
      patch: Partial<AgentConfig>;
    }) => {
      if (useMockFallback()) {
        await new Promise((r) => setTimeout(r, 400));
        return null;
      }
      // Read current, merge, write back
      const { data: cur } = await supabase!
        .from("tenants")
        .select("id, agent_config")
        .single();
      if (!cur) throw new Error("Kein Tenant");

      const currentCfg = (cur.agent_config ?? {}) as Record<string, AgentConfig>;
      const merged = {
        ...currentCfg,
        [slug]: { ...(currentCfg[slug] ?? {}), ...patch },
      };
      const { error } = await supabase!
        .from("tenants")
        .update({ agent_config: merged })
        .eq("id", cur.id);
      if (error) throw error;
      return merged;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agent_config"] }),
  });
};
