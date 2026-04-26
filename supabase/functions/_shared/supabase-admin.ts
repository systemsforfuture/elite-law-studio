// Service-Role Supabase-Client für Edge Functions.
// Nur für admin-Aktionen — nie an Frontend exponieren.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export const supabaseAdmin = () => {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL oder SUPABASE_SERVICE_ROLE_KEY fehlt in Function-Env",
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
};

/**
 * Liefert User + Tenant für den eingeloggten Caller.
 * Verifiziert den JWT aus dem Authorization-Header.
 */
export const callerContext = async (req: Request) => {
  const auth = req.headers.get("Authorization") ?? "";
  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const client = createClient(url, anon, {
    global: { headers: { Authorization: auth } },
  });
  const { data: userData } = await client.auth.getUser();
  if (!userData.user) {
    return null;
  }
  const { data: row } = await client
    .from("users")
    .select("id, tenant_id, role")
    .eq("id", userData.user.id)
    .maybeSingle();
  return row ? { ...row, auth_user_id: userData.user.id } : null;
};
