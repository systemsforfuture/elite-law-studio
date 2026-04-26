import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { currentTenant, users as mockUsers } from "@/data/mockData";
import type { User as DomainUser, Tenant } from "@/data/types";

/**
 * Liefert die public.users-Zeile + Tenant des aktuell eingeloggten Users.
 * Fallback auf Bergmann-Mock wenn Supabase nicht konfiguriert oder
 * Migration noch nicht angewendet.
 */
export const useCurrentUser = () => {
  const { user, isConfigured } = useAuth();

  return useQuery({
    queryKey: ["current-user", user?.id],
    queryFn: async (): Promise<{ user: DomainUser; tenant: Tenant }> => {
      // Fallback bei nicht konfiguriertem Supabase
      if (!isConfigured || !supabase || !user?.id) {
        return { user: mockUsers[0], tenant: currentTenant };
      }

      const { data: u, error: ue } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (ue || !u) {
        return { user: mockUsers[0], tenant: currentTenant };
      }

      const { data: t } = await supabase
        .from("tenants")
        .select("*")
        .eq("id", u.tenant_id)
        .single();

      return {
        user: u as unknown as DomainUser,
        tenant: (t ?? currentTenant) as unknown as Tenant,
      };
    },
    staleTime: 60_000,
  });
};
