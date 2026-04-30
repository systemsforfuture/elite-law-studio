import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

if (!isSupabaseConfigured && import.meta.env.DEV) {
  console.warn(
    "[supabase] VITE_SUPABASE_URL oder VITE_SUPABASE_ANON_KEY fehlt. " +
      "Auth + Datenzugriff sind deaktiviert; UI läuft mit Mock-Daten weiter. " +
      "Lege .env.local an (siehe .env.example).",
  );
}

// Singleton client — verwendet anon key, RLS schützt Tenant-Isolation.
// Bewusst lose getypt (any) bis `supabase gen types` läuft; sonst kollidieren
// JSONB-Felder (agent_config, provider_config, branding_config) mit dem Stub.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase: any = isSupabaseConfigured
  ? createClient(url!, anonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: "systems-auth",
      },
      global: {
        headers: {
          "x-client-info": "systems-platform-web/1.0",
        },
      },
    })
  : null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const requireSupabase = (): any => {
  if (!supabase) {
    throw new Error(
      "Supabase ist nicht konfiguriert. Setze VITE_SUPABASE_URL und VITE_SUPABASE_ANON_KEY in .env.local.",
    );
  }
  return supabase;
};
