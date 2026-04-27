// SYSTEMS™ Edge Function — link-whatsapp-number
//
// Plattform-Managed: SYSTEMS hat einen 360dialog-Plattform-Account.
// Owner trägt seine WhatsApp-Business-Nummer ein, wir hängen sie als
// Sub-Number an. WhatsApp/Meta-Approval läuft asynchron; wir markieren
// status="pending", SYSTEMS-Operations-Team treibt es nach.
//
// Provider-Name (360dialog) wird vor User versteckt.

import { handleCors, corsHeaders } from "../_shared/cors.ts";
import { callerContext, supabaseAdmin } from "../_shared/supabase-admin.ts";

interface RequestBody {
  phone_number: string;
}

const respond = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json" },
  });

const isValidIntlPhone = (s: string) => /^\+\d{10,15}$/.test(s);

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const ctx = await callerContext(req);
    if (!ctx) return respond({ error: "unauthorized" }, 401);
    if (ctx.role !== "owner") {
      return respond({ error: "Nur Owner darf WhatsApp einrichten" }, 403);
    }

    const body: RequestBody = await req.json();
    if (!body.phone_number || !isValidIntlPhone(body.phone_number)) {
      return respond(
        { ok: false, message: "Telefonnummer-Format ungültig (international, +49…)" },
        400,
      );
    }

    const admin = supabaseAdmin();
    const { data: tenant } = await admin
      .from("tenants")
      .select("provider_config")
      .eq("id", ctx.tenant_id)
      .single();
    const baseCfg = (tenant?.provider_config ?? {}) as Record<string, Record<string, unknown>>;
    const waCfg = (baseCfg.whatsapp ?? {}) as Record<string, unknown>;

    // Optional: Wenn Plattform-360dialog-Key vorhanden, hier API-Call zur
    // Sub-Number-Provisionierung. Das ist providerspezifisch und teils manuell —
    // wir markieren erstmal als pending und benachrichtigen Operations.
    // Plattform-Email ist für Operations-Crew.
    const opsApiKey = Deno.env.get("WHATSAPP_API_KEY");
    let providerOk = false;
    let opsNote = "Manuelle Verifizierung durch SYSTEMS-Team";

    if (opsApiKey) {
      // 360dialog: Phone-Number Add-Call (vereinfacht, Real-API erfordert mehr Schritte)
      try {
        const res = await fetch("https://waba-v2.360dialog.io/v1/configs/numbers", {
          method: "POST",
          headers: {
            "D360-API-KEY": opsApiKey,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            phone_number: body.phone_number,
            tenant_id: ctx.tenant_id,
          }),
        });
        providerOk = res.ok;
        if (!res.ok) {
          opsNote = `360dialog ${res.status}: manuelle Klärung erforderlich`;
        }
      } catch (e) {
        opsNote = `Provider unreachable: ${e instanceof Error ? e.message : String(e)}`;
      }
    }

    // Tenant-Config + notfall_nummer aktualisieren
    await admin
      .from("tenants")
      .update({
        provider_config: {
          ...baseCfg,
          whatsapp: {
            ...waCfg,
            phone_number: body.phone_number,
            verification_status: providerOk ? "pending" : "pending",
            requested_at: new Date().toISOString(),
          },
        },
      })
      .eq("id", ctx.tenant_id);

    // Audit-Log: Provisioning-Request
    await admin.from("audit_log").insert({
      tenant_id: ctx.tenant_id,
      user_id: ctx.id,
      action: "create",
      entity_type: "whatsapp_provisioning",
      details: `WhatsApp-Nummer ${body.phone_number} zur Verifizierung angemeldet — ${opsNote}`,
    });

    return respond({
      ok: true,
      message: providerOk
        ? "WhatsApp-Nummer registriert. Verifizierung dauert 1–3 Tage (Meta-Approval)."
        : "WhatsApp-Nummer empfangen. SYSTEMS-Team meldet sich in 24h für die Einrichtung.",
    });
  } catch (e) {
    console.error("[link-whatsapp-number]", e);
    return respond({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
