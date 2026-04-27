// SYSTEMS™ Edge Function — seed-demo-data
//
// Legt für einen Tenant 3 Beispiel-Mandanten + 5 Akten + 4 Termine + 3 Rechnungen an.
// Wird vom Onboarding-Wizard nach erfolgreichem Login einmalig aufgerufen.
//
// Idempotent: prüft, ob der Tenant bereits Mandanten hat — wenn ja, no-op.

import { handleCors, corsHeaders } from "../_shared/cors.ts";
import { callerContext, supabaseAdmin } from "../_shared/supabase-admin.ts";

interface RequestBody {
  /** Force = ignoriere "schon Mandanten vorhanden" und seede trotzdem. */
  force?: boolean;
}

const todayPlus = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const caller = await callerContext(req);
    if (!caller) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    const tenantId = caller.tenant_id;
    const ownerId = caller.id;
    const body = ((await req.json().catch(() => ({}))) as RequestBody) ?? {};

    const admin = supabaseAdmin();

    // Idempotenz-Check
    const { count: existingMandanten } = await admin
      .from("mandanten")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId);

    if (!body.force && (existingMandanten ?? 0) > 0) {
      return new Response(
        JSON.stringify({
          skipped: true,
          reason: "Tenant hat bereits Mandanten — Demo-Daten nicht überschrieben.",
          mandanten_count: existingMandanten,
        }),
        { headers: { ...corsHeaders, "content-type": "application/json" } },
      );
    }

    // 1. Mandanten
    const { data: mandanten, error: mErr } = await admin
      .from("mandanten")
      .insert([
        {
          tenant_id: tenantId,
          typ: "privat",
          vorname: "Maximilian",
          nachname: "Beispiel",
          email: "max.beispiel@demo.de",
          telefon: "+49 170 1234567",
          status: "aktiv",
          rechtsgebiet: "Familienrecht",
          herkunft: "voice",
          notes_preview: "Demo-Mandant — Einvernehmliche Scheidung",
          zugewiesener_anwalt_id: ownerId,
        },
        {
          tenant_id: tenantId,
          typ: "privat",
          vorname: "Anna",
          nachname: "Musterfrau",
          email: "anna.musterfrau@demo.de",
          telefon: "+49 151 9876543",
          status: "aktiv",
          rechtsgebiet: "Arbeitsrecht",
          herkunft: "whatsapp",
          notes_preview: "Demo-Mandantin — Fristlose Kündigung",
          zugewiesener_anwalt_id: ownerId,
        },
        {
          tenant_id: tenantId,
          typ: "unternehmen",
          firmenname: "Demo Logistik GmbH",
          email: "kontakt@demo-logistik.de",
          telefon: "+49 30 5556677",
          status: "aktiv",
          rechtsgebiet: "Vertragsrecht",
          herkunft: "email",
          notes_preview: "Demo-Mandant — Vertragsrecht",
          zugewiesener_anwalt_id: ownerId,
        },
      ])
      .select();

    if (mErr) throw mErr;
    const [md1, md2, md3] = mandanten as Array<{ id: string }>;

    // 2. Akten
    const { data: akten, error: aErr } = await admin
      .from("akten")
      .insert([
        {
          tenant_id: tenantId,
          aktenzeichen: "0001/26",
          mandant_id: md1.id,
          rechtsgebiet: "Familienrecht",
          stufe: "strategie",
          status: "aktiv",
          titel: "Scheidung Beispiel",
          fristen: [
            {
              titel: "Antrag einreichen",
              datum: todayPlus(7),
              kritisch: true,
            },
          ],
          zugewiesener_anwalt_id: ownerId,
        },
        {
          tenant_id: tenantId,
          aktenzeichen: "0002/26",
          mandant_id: md2.id,
          rechtsgebiet: "Arbeitsrecht",
          stufe: "verfahren",
          status: "aktiv",
          titel: "Kündigungsschutzklage Musterfrau",
          fristen: [
            {
              titel: "Güteverhandlung",
              datum: todayPlus(14),
              kritisch: true,
            },
          ],
          zugewiesener_anwalt_id: ownerId,
        },
        {
          tenant_id: tenantId,
          aktenzeichen: "0003/26",
          mandant_id: md3.id,
          rechtsgebiet: "Vertragsrecht",
          stufe: "fallaufnahme",
          status: "aktiv",
          titel: "Vertragsentwurf Demo Logistik",
          fristen: [],
          zugewiesener_anwalt_id: ownerId,
        },
      ])
      .select();

    if (aErr) throw aErr;
    const [akt1, akt2] = akten as Array<{ id: string }>;

    // 3. Termine
    await admin.from("termine").insert([
      {
        tenant_id: tenantId,
        mandant_id: md1.id,
        akte_id: akt1.id,
        anwalt_id: ownerId,
        titel: "Scheidungsfolgenvereinbarung",
        typ: "intern",
        start_at: `${todayPlus(2)}T10:00:00Z`,
        ende_at: `${todayPlus(2)}T11:00:00Z`,
        ort: "Kanzlei",
      },
      {
        tenant_id: tenantId,
        mandant_id: md2.id,
        akte_id: akt2.id,
        anwalt_id: ownerId,
        titel: "Güteverhandlung Musterfrau",
        typ: "gerichtstermin",
        start_at: `${todayPlus(14)}T09:30:00Z`,
        ende_at: `${todayPlus(14)}T11:00:00Z`,
        ort: "Arbeitsgericht",
      },
    ]);

    // 4. Rechnungen
    await admin.from("rechnungen").insert([
      {
        tenant_id: tenantId,
        mandant_id: md1.id,
        akte_id: akt1.id,
        rechnungsnummer: `${new Date().getFullYear()}-DEMO-001`,
        betrag_netto: 840.34,
        betrag_brutto: 1000,
        rechnungsdatum: todayPlus(-30),
        faelligkeit: todayPlus(-16),
        status: "mahnung_1",
        mahnstufe: 1,
      },
      {
        tenant_id: tenantId,
        mandant_id: md2.id,
        akte_id: akt2.id,
        rechnungsnummer: `${new Date().getFullYear()}-DEMO-002`,
        betrag_netto: 1260.5,
        betrag_brutto: 1500,
        rechnungsdatum: todayPlus(-10),
        faelligkeit: todayPlus(4),
        status: "offen",
        mahnstufe: 0,
      },
    ]);

    return new Response(
      JSON.stringify({
        ok: true,
        seeded: {
          mandanten: 3,
          akten: 3,
          termine: 2,
          rechnungen: 2,
        },
      }),
      { headers: { ...corsHeaders, "content-type": "application/json" } },
    );
  } catch (e) {
    console.error("[seed-demo-data]", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
      {
        status: 500,
        headers: { ...corsHeaders, "content-type": "application/json" },
      },
    );
  }
});
