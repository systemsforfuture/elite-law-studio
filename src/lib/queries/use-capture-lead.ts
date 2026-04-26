import { useMutation } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export interface LeadInput {
  vorname?: string;
  nachname?: string;
  firmenname?: string;
  email: string;
  telefon?: string;
  rechtsgebiet?: string;
  beschreibung?: string;
  herkunft?: string;
  tenant_id?: string;
  domain?: string;
}

export interface LeadResult {
  ok: boolean;
  message: string;
  mandant_id?: string;
}

export const useCaptureLead = () =>
  useMutation({
    mutationFn: async (input: LeadInput): Promise<LeadResult> => {
      // Wenn Supabase nicht konfiguriert, simulieren wir Erfolg
      if (!isSupabaseConfigured || !supabase) {
        await new Promise((r) => setTimeout(r, 700));
        return {
          ok: true,
          message: "Wir melden uns binnen 2 Stunden bei Ihnen.",
        };
      }
      const { data, error } = await supabase.functions.invoke("capture-lead", {
        body: input,
      });
      if (error) throw error;
      return data as LeadResult;
    },
  });
