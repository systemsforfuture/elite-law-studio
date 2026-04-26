import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { currentTenant as mockTenant } from "@/data/mockData";
import type { BrandingConfig, Tenant } from "@/data/types";
import { useAuth } from "@/contexts/AuthContext";

const shouldMock = () => !isSupabaseConfigured || !supabase;

/**
 * Liefert den Tenant des aktuell eingeloggten Users.
 */
export const useTenantQuery = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["tenant", user?.id],
    queryFn: async (): Promise<Tenant> => {
      if (shouldMock() || !user?.id) return mockTenant;

      const { data: u } = await supabase!
        .from("users")
        .select("tenant_id")
        .eq("id", user.id)
        .maybeSingle();
      if (!u?.tenant_id) return mockTenant;

      const { data: t, error } = await supabase!
        .from("tenants")
        .select("*")
        .eq("id", u.tenant_id)
        .single();
      if (error || !t) return mockTenant;

      return t as unknown as Tenant;
    },
    staleTime: 60_000,
  });
};

export const useUpdateBranding = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      patch: Partial<BrandingConfig>,
    ): Promise<Tenant | null> => {
      if (shouldMock()) {
        await new Promise((r) => setTimeout(r, 600));
        return null;
      }
      // Caller must be tenant-resolved; RLS policy on tenants only allows
      // SELECT, so we go through a function. For MVP: direct update via
      // service role would need an Edge Function. Use a simple client-side
      // upsert if owner:
      const { data: cur } = await supabase!
        .from("tenants")
        .select("id, branding_config")
        .single();
      if (!cur) throw new Error("Kein Tenant gefunden");

      const merged = {
        ...((cur.branding_config as Record<string, unknown>) ?? {}),
        ...patch,
      };
      // Note: requires UPDATE policy on tenants for owners. If not present,
      // user gets RLS error — frontend handles toast.
      const { data, error } = await supabase!
        .from("tenants")
        .update({ branding_config: merged })
        .eq("id", cur.id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as Tenant;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tenant"] });
      qc.invalidateQueries({ queryKey: ["current-user"] });
    },
  });
};
