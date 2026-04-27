// SYSTEMS™ Edge Function — capture-lead
//
// Öffentlicher Endpoint für Kontakt-Formulare auf der White-Label-
// Funnel-Seite einer Kanzlei. Kein Auth — Tenant wird über Domain
// identifiziert oder explizit per Body-Param.
//
// Schreibt einen neuen Mandanten mit Status="interessent" in den
// passenden Tenant. Wird im Dashboard als neuer Lead sichtbar.

import { handleCors, corsHeaders } from "../_shared/cors.ts";
import { supabaseAdmin } from "../_shared/supabase-admin.ts";

interface RequestBody {
  // Tenant-Auflösung (eines davon)
  tenant_id?: string;
  domain?: string;

  // Lead-Daten
  vorname?: string;
  nachname?: string;
  firmenname?: string;
  email: string;
  telefon?: string;
  rechtsgebiet?: string;
  beschreibung?: string;
  herkunft?: string;
}

const isValidEmail = (s: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

const sanitize = (s: string | undefined, max = 500): string | undefined => {
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

    if (!body.email || !isValidEmail(body.email)) {
      return new Response(
        JSON.stringify({ error: "Bitte valide E-Mail angeben" }),
        {
          status: 400,
          headers: { ...corsHeaders, "content-type": "application/json" },
        },
      );
    }

    const admin = supabaseAdmin();

    // Tenant auflösen — nur über verifizierte Domain, nicht über body.tenant_id
    // (sonst kann jeder anonyme Caller in fremde Tenants schreiben).
    // Domain-Lookup escaped via .eq() statt .or()-String-Interpolation.
    let tenant_id: string | null = null;
    const domain = sanitize(body.domain, 253);
    if (domain) {
      const { data: byDomain } = await admin
        .from("tenants")
        .select("id")
        .eq("domain", domain)
        .maybeSingle();
      tenant_id = byDomain?.id ?? null;
      if (!tenant_id) {
        const { data: bySub } = await admin
          .from("tenants")
          .select("id")
          .eq("subdomain", domain)
          .maybeSingle();
        tenant_id = bySub?.id ?? null;
      }
    }
    if (!tenant_id) {
      console.warn("[capture-lead] tenant nicht resolvable für domain=", domain);
      return new Response(
        JSON.stringify({ error: "tenant_not_resolvable", hint: "domain im Body muss zu einem Tenant gehören" }),
        { status: 422, headers: { ...corsHeaders, "content-type": "application/json" } },
      );
    }

    const typ = body.firmenname ? "unternehmen" : "privat";
    const insertData = {
      tenant_id,
      typ,
      vorname: sanitize(body.vorname, 80),
      nachname: sanitize(body.nachname, 80),
      firmenname: sanitize(body.firmenname, 200),
      email: sanitize(body.email, 200)!,
      telefon: sanitize(body.telefon, 50),
      rechtsgebiet: sanitize(body.rechtsgebiet, 80),
      herkunft: sanitize(body.herkunft, 30) ?? "web",
      status: "interessent" as const,
      notes_preview: sanitize(body.beschreibung, 1000),
      last_contact: new Date().toISOString(),
    };

    // Upsert auf email pro tenant
    const { data: existing } = await admin
      .from("mandanten")
      .select("id")
      .eq("tenant_id", tenant_id)
      .eq("email", insertData.email)
      .maybeSingle();

    let mandant;
    if (existing) {
      const { data, error } = await admin
        .from("mandanten")
        .update(insertData)
        .eq("id", existing.id)
        .select()
        .single();
      if (error) throw error;
      mandant = data;
    } else {
      const { data, error } = await admin
        .from("mandanten")
        .insert(insertData)
        .select()
        .single();
      if (error) throw error;
      mandant = data;
    }

    // Activity-Eintrag für Timeline
    await admin.from("activities").insert({
      tenant_id,
      mandant_id: mandant.id,
      type: "email_in",
      actor: "mandant",
      actor_name:
        body.vorname && body.nachname
          ? `${body.vorname} ${body.nachname}`
          : body.firmenname ?? body.email,
      title: "Lead über Webseite eingegangen",
      detail: insertData.notes_preview ?? `Neuer Interessent (${insertData.rechtsgebiet ?? "—"})`,
    });

    return new Response(
      JSON.stringify({
        ok: true,
        message: "Wir melden uns binnen 2 Stunden bei Ihnen.",
        mandant_id: mandant.id,
      }),
      {
        headers: { ...corsHeaders, "content-type": "application/json" },
      },
    );
  } catch (e) {
    console.error("[capture-lead]", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
      {
        status: 500,
        headers: { ...corsHeaders, "content-type": "application/json" },
      },
    );
  }
});
