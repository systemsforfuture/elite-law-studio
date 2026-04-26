import { useQuery } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  activities as mockActivities,
  activitiesForMandant as mockActivitiesForMandant,
  activitiesForAkte as mockActivitiesForAkte,
} from "@/data/mockData";
import type { Activity } from "@/data/types";

const shouldMock = () => !isSupabaseConfigured || !supabase;

export const useActivitiesQuery = () =>
  useQuery({
    queryKey: ["activities"],
    queryFn: async (): Promise<Activity[]> => {
      if (shouldMock()) return mockActivities;
      const { data, error } = await supabase!
        .from("activities")
        .select("*")
        .order("ts", { ascending: false })
        .limit(100);
      if (error) return mockActivities;
      return (data ?? []) as unknown as Activity[];
    },
  });

export const useActivitiesForMandant = (mandant_id: string | undefined | null) =>
  useQuery({
    queryKey: ["activities", "mandant", mandant_id],
    enabled: Boolean(mandant_id),
    queryFn: async (): Promise<Activity[]> => {
      if (!mandant_id) return [];
      if (shouldMock()) return mockActivitiesForMandant(mandant_id);
      const { data, error } = await supabase!
        .from("activities")
        .select("*")
        .eq("mandant_id", mandant_id)
        .order("ts", { ascending: false });
      if (error) return mockActivitiesForMandant(mandant_id);
      return (data ?? []) as unknown as Activity[];
    },
  });

export const useActivitiesForAkte = (akte_id: string | undefined | null) =>
  useQuery({
    queryKey: ["activities", "akte", akte_id],
    enabled: Boolean(akte_id),
    queryFn: async (): Promise<Activity[]> => {
      if (!akte_id) return [];
      if (shouldMock()) return mockActivitiesForAkte(akte_id);
      const { data, error } = await supabase!
        .from("activities")
        .select("*")
        .eq("akte_id", akte_id)
        .order("ts", { ascending: false });
      if (error) return mockActivitiesForAkte(akte_id);
      return (data ?? []) as unknown as Activity[];
    },
  });
