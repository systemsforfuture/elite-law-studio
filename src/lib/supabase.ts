import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

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
// Wird nur erstellt wenn beide Env-Variablen gesetzt sind.
export const supabase: SupabaseClient<Database> | null = isSupabaseConfigured
  ? createClient<Database>(url!, anonKey!, {
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

export const requireSupabase = (): SupabaseClient<Database> => {
  if (!supabase) {
    throw new Error(
      "Supabase ist nicht konfiguriert. Setze VITE_SUPABASE_URL und VITE_SUPABASE_ANON_KEY in .env.local.",
    );
  }
  return supabase;
};
