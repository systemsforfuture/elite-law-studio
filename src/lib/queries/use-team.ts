import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { users as mockUsers, teamStats as mockStats } from "@/data/mockData";
import type { User, TeamMemberStats } from "@/data/types";

const shouldMock = () => !isSupabaseConfigured || !supabase;

export const useTeamQuery = () =>
  useQuery({
    queryKey: ["team"],
    queryFn: async (): Promise<User[]> => {
      if (shouldMock()) return mockUsers;
      const { data, error } = await supabase!
        .from("users")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) {
        console.warn("[team] fallback:", error.message);
        return mockUsers;
      }
      return (data ?? []) as unknown as User[];
    },
    staleTime: 60_000,
  });

export const useTeamStats = (user_id: string | undefined | null) =>
  useQuery({
    queryKey: ["team-stats", user_id],
    enabled: Boolean(user_id),
    queryFn: async (): Promise<TeamMemberStats | undefined> => {
      // Stats werden Sprint 3 server-side aggregiert. Vorerst Mock.
      return mockStats.find((s) => s.user_id === user_id);
    },
  });

interface InviteInput {
  email: string;
  name: string;
  role?: User["role"];
}

export const useInviteUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ email, name, role = "mitarbeiter" }: InviteInput) => {
      if (shouldMock()) {
        console.info("[team] Mock-Einladung an", email);
        return null;
      }
      const { data, error } = await supabase!.rpc("invite_user", {
        p_email: email,
        p_name: name,
        p_role: role,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["team"] }),
  });
};
