// SYSTEMS™ Edge Function — update-voice-assistant
//
// Synchronisiert den existierenden Vapi-Assistant des Tenants mit den
// aktuellen Branding-/Voice-Einstellungen (Tonalität, Begrüßung,
// Rechtsgebiete, Inhaber).
//
// Aufruf-Trigger (Frontend):
//   • IntegrationenPage „Voice neu konfigurieren"-Button
//   • BrandingPage „Tonalität speichern" (optional — auto-sync)
//   • Owner ändert greeting im VoiceCard
//
// Erfordert:
//   • Owner-Rolle
//   • aktiven Vapi-Assistant (provider_config.voice.assistant_id gesetzt)
//   • VAPI_API_KEY in der Function-Env

import { handleCors, corsHeaders } from "../_shared/cors.ts";
import { callerContext, supabaseAdmin } from "../_shared/supabase-admin.ts";
import { buildVapiAssistantConfig } from "../_shared/voice-prompt.ts";

interface RequestBody {
  /** Optional: neue Begrüßung. Default: persistierte Voice-greeting */
  greeting?: string;
  /** Optional: explizite Tonalität-Override (sonst aus branding_config) */
  tonalitaet?: "formal" | "freundlich" | "empathisch" | "direkt";
}

const respond = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json" },
  });

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const ctx = await callerContext(req);
    if (!ctx) return respond({ error: "unauthorized" }, 401);
    if (ctx.role !== "owner") {
      return respond({ error: "Nur Owner darf Voice-KI neu konfigurieren" }, 403);
    }

    const body: RequestBody = await req.json().catch(() => ({}));
    const apiKey = Deno.env.get("VAPI_API_KEY");
    const webhookBaseUrl = Deno.env.get("PUBLIC_BASE_URL");
    if (!apiKey) {
      return respond(
        {
          ok: false,
          message: "Voice-Plattform nicht eingerichtet (VAPI_API_KEY fehlt).",
        },
        503,
      );
    }

    const admin = supabaseAdmin();
    const { data: tenant } = await admin
      .from("tenants")
      .select(
        "kanzlei_name, branding_config, rechtsgebiete, inhaber_name, provider_config, notfall_nummer",
      )
      .eq("id", ctx.tenant_id)
      .single();

    if (!tenant) return respond({ error: "tenant_not_found" }, 404);

    const cfg = (tenant.provider_config ?? {}) as Record<string, Record<string, unknown>>;
    const voice = (cfg.voice ?? {}) as {
      assistant_id?: string;
      greeting?: string;
      status?: string;
    };
    if (!voice.assistant_id) {
      return respond(
        {
          ok: false,
          message:
            "Voice-KI ist noch nicht eingerichtet. Bitte erst über »KI-Telefon einrichten« provisionieren.",
        },
        409,
      );
    }

    const branding = (tenant.branding_config ?? {}) as { tonalitaet?: string };
    const greeting =
      body.greeting ??
      (voice.greeting as string | undefined) ??
      `Kanzlei ${tenant.kanzlei_name ?? ""}, mein Name ist Anna. Wie kann ich Ihnen helfen?`;
    const tonalitaet =
      body.tonalitaet ??
      ((branding.tonalitaet as "formal" | "freundlich" | "empathisch" | "direkt") ??
        "freundlich");

    // Rebuilt-Config — gleiches Pattern wie provision-voice-number,
    // inkl. Transfer-Tool (zur notfall_nummer), Voicemail-Detection,
    // AnalysisPlan (siehe voice-prompt.ts).
    const assistantConfig = buildVapiAssistantConfig({
      kanzlei_name: tenant.kanzlei_name ?? "Kanzlei",
      tonalitaet,
      rechtsgebiete: (tenant.rechtsgebiete as string[] | undefined) ?? undefined,
      greeting,
      inhaber_name: tenant.inhaber_name as string | undefined,
      notfall_nummer: tenant.notfall_nummer ?? null,
    });
    if (webhookBaseUrl) {
      (assistantConfig as Record<string, unknown>).serverUrl =
        `${webhookBaseUrl.replace(/\/$/, "")}/functions/v1/webhook-vapi`;
    }

    // Vapi-API: PATCH /assistant/:id
    const patchRes = await fetch(
      `https://api.vapi.ai/assistant/${voice.assistant_id}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify(assistantConfig),
      },
    );
    if (!patchRes.ok) {
      const err = await patchRes.text();
      console.error(
        "[update-voice-assistant] vapi-patch failed:",
        patchRes.status,
        err.slice(0, 500),
      );
      return respond(
        {
          ok: false,
          message: `Anlage fehlgeschlagen (Provider ${patchRes.status}). Bitte erneut versuchen.`,
        },
        502,
      );
    }

    // greeting im provider_config persistieren (UI lebt davon)
    await admin
      .from("tenants")
      .update({
        provider_config: {
          ...cfg,
          voice: {
            ...voice,
            greeting,
            last_synced_at: new Date().toISOString(),
          },
        },
      })
      .eq("id", ctx.tenant_id);

    await admin.from("audit_log").insert({
      tenant_id: ctx.tenant_id,
      user_id: ctx.id,
      action: "update",
      entity_type: "voice_assistant_config",
      details: `Voice-Assistant ${voice.assistant_id} resynced (tonalitaet=${tonalitaet})`,
    });

    return respond({
      ok: true,
      message: "Voice-KI ist beim nächsten Anruf mit neuen Einstellungen aktiv.",
      tonalitaet,
      greeting,
    });
  } catch (e) {
    console.error("[update-voice-assistant]", e);
    return respond(
      { error: e instanceof Error ? e.message : String(e) },
      500,
    );
  }
});
