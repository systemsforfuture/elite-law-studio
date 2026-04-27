import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { warnMockFallback } from "@/lib/queries/warn-fallback";
import {
  zeiterfassungen as mockZeit,
  urlaubsantraege as mockUrlaub,
  kontingente as mockKont,
} from "@/data/mockData";
import type {
  Zeiterfassung,
  UrlaubAntrag,
  MitarbeiterKontingent,
  ZeiterfassungArt,
  UrlaubArt,
  UrlaubStatus,
} from "@/data/types";

const shouldMock = () => !isSupabaseConfigured || !supabase;

// =============================================================
// Zeiterfassung
// =============================================================

export const useZeiterfassungQuery = (mitarbeiterId?: string) =>
  useQuery({
    queryKey: ["zeiterfassung", mitarbeiterId ?? "all"],
    queryFn: async (): Promise<Zeiterfassung[]> => {
      if (shouldMock()) {
        return mitarbeiterId
          ? mockZeit.filter((z) => z.mitarbeiter_id === mitarbeiterId)
          : mockZeit;
      }
      // DB-Spalten heißen start_zeit/ende_zeit (start ist SQL-Keyword) — Aliase in select
      let q = supabase!
        .from("zeiterfassung")
        .select(
          "id, tenant_id, mitarbeiter_id, datum, start:start_zeit, ende:ende_zeit, dauer_min, akte_id, mandant_id, beschreibung, art, tarif_eur, created_at",
        )
        .order("datum", { ascending: false });
      if (mitarbeiterId) q = q.eq("mitarbeiter_id", mitarbeiterId);
      const { data, error } = await q;
      if (error) {
        warnMockFallback("zeiterfassung", error.message);
        return mockZeit;
      }
      return (data ?? []) as unknown as Zeiterfassung[];
    },
    staleTime: 30_000,
  });

interface NewZeitInput {
  mitarbeiter_id: string;
  datum: string;
  start: string;
  ende: string;
  dauer_min: number;
  art: ZeiterfassungArt;
  akte_id?: string;
  mandant_id?: string;
  beschreibung?: string;
  tarif_eur?: number;
}

export const useCreateZeit = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: NewZeitInput) => {
      if (shouldMock()) {
        const fake: Zeiterfassung = {
          id: `ze_${Date.now()}`,
          tenant_id: "tnt_bergmann",
          ...input,
          created_at: new Date().toISOString(),
        };
        mockZeit.unshift(fake);
        return fake;
      }
      const { data, error } = await supabase!
        .from("zeiterfassung")
        .insert({
          mitarbeiter_id: input.mitarbeiter_id,
          datum: input.datum,
          start_zeit: input.start,
          ende_zeit: input.ende,
          dauer_min: input.dauer_min,
          art: input.art,
          akte_id: input.akte_id,
          mandant_id: input.mandant_id,
          beschreibung: input.beschreibung,
          tarif_eur: input.tarif_eur,
        })
        .select(
          "id, tenant_id, mitarbeiter_id, datum, start:start_zeit, ende:ende_zeit, dauer_min, akte_id, mandant_id, beschreibung, art, tarif_eur, created_at",
        )
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["zeiterfassung"] }),
  });
};

export const useDeleteZeit = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (shouldMock()) {
        const idx = mockZeit.findIndex((z) => z.id === id);
        if (idx >= 0) mockZeit.splice(idx, 1);
        return id;
      }
      const { error } = await supabase!.from("zeiterfassung").delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["zeiterfassung"] }),
  });
};

// =============================================================
// Urlaubsanträge
// =============================================================

export const useUrlaubQuery = (status?: UrlaubStatus) =>
  useQuery({
    queryKey: ["urlaub", status ?? "all"],
    queryFn: async (): Promise<UrlaubAntrag[]> => {
      if (shouldMock()) {
        return status ? mockUrlaub.filter((u) => u.status === status) : mockUrlaub;
      }
      let q = supabase!.from("urlaub_antraege").select("*").order("von", { ascending: false });
      if (status) q = q.eq("status", status);
      const { data, error } = await q;
      if (error) {
        warnMockFallback("urlaub", error.message);
        return mockUrlaub;
      }
      return (data ?? []) as unknown as UrlaubAntrag[];
    },
    staleTime: 30_000,
  });

interface NewUrlaubInput {
  mitarbeiter_id: string;
  von: string;
  bis: string;
  tage: number;
  art: UrlaubArt;
  kommentar?: string;
}

export const useCreateUrlaub = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: NewUrlaubInput) => {
      if (shouldMock()) {
        const fake: UrlaubAntrag = {
          id: `ua_${Date.now()}`,
          tenant_id: "tnt_bergmann",
          status: "pending",
          ...input,
          created_at: new Date().toISOString(),
        };
        mockUrlaub.unshift(fake);
        return fake;
      }
      const { data, error } = await supabase!
        .from("urlaub_antraege")
        .insert({ ...input, status: "pending" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["urlaub"] }),
  });
};

export const useUpdateUrlaubStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
      approver_id,
    }: {
      id: string;
      status: UrlaubStatus;
      approver_id: string;
    }) => {
      if (shouldMock()) {
        const u = mockUrlaub.find((x) => x.id === id);
        if (u) {
          u.status = status;
          u.approver_id = approver_id;
          u.approved_at = new Date().toISOString();
        }
        return u;
      }
      const { data, error } = await supabase!
        .from("urlaub_antraege")
        .update({
          status,
          approver_id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["urlaub"] }),
  });
};

// =============================================================
// Kontingente / Übersicht
// =============================================================

export const useKontingenteQuery = () =>
  useQuery({
    queryKey: ["kontingente"],
    queryFn: async (): Promise<MitarbeiterKontingent[]> => {
      if (shouldMock()) return mockKont;
      const { data, error } = await supabase!.from("urlaub_uebersicht").select("*");
      if (error) {
        warnMockFallback("kontingente", error.message);
        return mockKont;
      }
      return (data ?? []) as unknown as MitarbeiterKontingent[];
    },
    staleTime: 60_000,
  });
