import { useMutation } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export interface CreateTenantInput {
  kanzlei_name: string;
  inhaber_name: string;
  email: string;
  telefon?: string;
  domain?: string;
  team_size?: number;
  rechtsgebiete?: string[];
  notfall_nummer?: string;
  tier: "foundation" | "growth" | "premium";
  branding_config: {
    primary_color: string;
    accent_color: string;
    tonalitaet: "formal" | "freundlich" | "empathisch" | "direkt";
    greeting?: string;
    voice_choice?: "standard_f" | "standard_m" | "cloning";
  };
  daten_quelle?: string;
}

export interface CreateTenantResult {
  ok: boolean;
  tenant_id?: string;
  message: string;
}

/**
 * Legt einen neuen Tenant an. Sendet danach automatisch einen Magic-Link
 * an die angegebene Email — Owner-Bootstrap erfolgt beim Login.
 */
export const useCreateTenant = () =>
  useMutation({
    mutationFn: async (
      input: CreateTenantInput,
    ): Promise<CreateTenantResult> => {
      if (!isSupabaseConfigured || !supabase) {
        // Demo-Mode: tu so als ob
        await new Promise((r) => setTimeout(r, 1200));
        return {
          ok: true,
          message:
            "Demo-Modus: kein echter Tenant erstellt. Setze Supabase-Env-Variablen.",
        };
      }

      // 1. Tenant + Owner-Einladung anlegen
      const { data, error } = await supabase.functions.invoke("create-tenant", {
        body: input,
      });
      if (error) throw error;
      const result = data as CreateTenantResult;
      if (!result.ok) throw new Error(result.message);

      // 2. Magic Link an Inhaber senden
      const { error: otpErr } = await supabase.auth.signInWithOtp({
        email: input.email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          shouldCreateUser: true,
        },
      });
      if (otpErr) {
        return {
          ok: true,
          tenant_id: result.tenant_id,
          message:
            "Tenant angelegt, aber Magic-Link konnte nicht gesendet werden: " +
            otpErr.message,
        };
      }

      return {
        ok: true,
        tenant_id: result.tenant_id,
        message:
          "Ihr Tenant ist angelegt. Wir haben Ihnen einen Login-Link an " +
          input.email +
          " gesendet.",
      };
    },
  });
