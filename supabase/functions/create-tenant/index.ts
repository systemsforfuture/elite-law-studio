// SYSTEMS™ Edge Function — create-tenant
//
// Öffentlicher Endpoint für den Onboarding-Wizard. Legt einen neuen
// Tenant an und erstellt eine Owner-Einladung für den Inhaber.
// Frontend ruft danach supabase.auth.signInWithOtp() auf — der User
// klickt den Magic Link, bootstrap_user_self claimed die Einladung.

import { handleCors, corsHeaders } from "../_shared/cors.ts";
import { supabaseAdmin } from "../_shared/supabase-admin.ts";

interface BrandingConfig {
  primary_color: string;
  accent_color: string;
  tonalitaet: "formal" | "freundlich" | "empathisch" | "direkt";
  greeting?: string;
  voice_choice?: "standard_f" | "standard_m" | "cloning";
}

interface RequestBody {
  kanzlei_name: string;
  inhaber_name: string;
  email: string;
  telefon?: string;
  domain?: string;
  team_size?: number;
  rechtsgebiete?: string[];
  notfall_nummer?: string;
  tier: "foundation" | "growth" | "premium";
  branding_config: BrandingConfig;
  daten_quelle?: string;
}

const isValidEmail = (s: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

const sanitize = (s: string | undefined, max = 200): string | undefined => {
  if (!s) return undefined;
  return s.replace(/[\r\n\t]/g, " ").trim().slice(0, max) || undefined;
};

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }

  try {
    const body: RequestBody = await req.json();

    // Validation
    if (!body.kanzlei_name?.trim() || !body.email || !isValidEmail(body.email)) {
      return new Response(
        JSON.stringify({
          error: "Kanzlei-Name und valide Email sind erforderlich",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "content-type": "application/json" },
        },
      );
    }
    if (!["foundation", "growth", "premium"].includes(body.tier)) {
      return new Response(JSON.stringify({ error: "Tier ungültig" }), {
        status: 400,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    const admin = supabaseAdmin();

    // Domain-Konflikt prüfen
    if (body.domain) {
      const { data: existing } = await admin
        .from("tenants")
        .select("id")
        .eq("domain", body.domain)
        .maybeSingle();
      if (existing) {
        return new Response(
          JSON.stringify({
            error:
              "Diese Domain ist bereits vergeben. Bitte andere Domain wählen.",
          }),
          {
            status: 409,
            headers: { ...corsHeaders, "content-type": "application/json" },
          },
        );
      }
    }

    // Tenant anlegen
    const { data: tenant, error: tenantErr } = await admin
      .from("tenants")
      .insert({
        kanzlei_name: sanitize(body.kanzlei_name, 200)!,
        domain: sanitize(body.domain, 200),
        inhaber_name: sanitize(body.inhaber_name, 200),
        notfall_nummer: sanitize(body.notfall_nummer, 50),
        rechtsgebiete: (body.rechtsgebiete ?? []).map((r) =>
          sanitize(r, 80),
        ).filter(Boolean) as string[],
        subscription_tier: body.tier,
        subscription_status: "trial",
        branding_config: body.branding_config,
      })
      .select()
      .single();

    if (tenantErr) throw tenantErr;

    // Owner-Einladung anlegen — wird beim ersten Login geclaimed
    const { error: invErr } = await admin.from("tenant_invitations").insert({
      tenant_id: tenant.id,
      email: body.email.trim().toLowerCase(),
      name: sanitize(body.inhaber_name, 200) ?? body.email,
      role: "owner",
    });

    if (invErr) {
      // Rollback: ohne Owner-Invite ist der Tenant orphaned (niemand kann sich
      // jemals als Owner einloggen). Lieber löschen + Fehler zurück.
      console.error("[create-tenant] Invitation fehlgeschlagen — rolle Tenant zurück:", invErr);
      await admin.from("tenants").delete().eq("id", tenant.id);
      return new Response(
        JSON.stringify({
          error: "Invitation konnte nicht angelegt werden. Tenant wurde rückgängig gemacht.",
          details: invErr.message,
        }),
        { status: 500, headers: { ...corsHeaders, "content-type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({
        ok: true,
        tenant_id: tenant.id,
        message:
          "Tenant angelegt. Bitte E-Mail prüfen und Magic-Link klicken.",
      }),
      {
        headers: { ...corsHeaders, "content-type": "application/json" },
      },
    );
  } catch (e) {
    console.error("[create-tenant]", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
      {
        status: 500,
        headers: { ...corsHeaders, "content-type": "application/json" },
      },
    );
  }
});
