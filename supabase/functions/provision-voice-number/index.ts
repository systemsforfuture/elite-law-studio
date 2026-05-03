// SYSTEMS™ Edge Function — provision-voice-number
//
// Plattform-Managed: provisioniert via Vapi-Plattform-Account eine Telefonnummer
// für die Kanzlei. Speichert phone_number + phone_number_id in tenant.provider_config.voice.
//
// Provider wird VOR dem User versteckt. Wir nutzen platform-wide VAPI_API_KEY.

import { handleCors, corsHeaders } from "../_shared/cors.ts";
import { callerContext, supabaseAdmin } from "../_shared/supabase-admin.ts";
import { buildVapiAssistantConfig } from "../_shared/voice-prompt.ts";

interface RequestBody {
  area_code?: string;
  greeting?: string;
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
      return respond({ error: "Nur Owner darf KI-Telefon einrichten" }, 403);
    }

    const body: RequestBody = await req.json();
    const apiKey = Deno.env.get("VAPI_API_KEY");
    const fallbackAssistantId = Deno.env.get("VAPI_DEFAULT_ASSISTANT_ID");
    const webhookBaseUrl = Deno.env.get("PUBLIC_BASE_URL");

    if (!apiKey) {
      return respond(
        {
          ok: false,
          message:
            "Voice-Provisioning ist auf der Plattform noch nicht eingerichtet. Bitte den Plattform-Betreiber kontaktieren.",
        },
        503,
      );
    }

    const admin = supabaseAdmin();

    // Tenant auf provisioning markieren + Tonalität/Branding lesen
    const { data: tenant } = await admin
      .from("tenants")
      .select("provider_config, kanzlei_name, branding_config, rechtsgebiete, inhaber_name")
      .eq("id", ctx.tenant_id)
      .single();
    const baseCfg = (tenant?.provider_config ?? {}) as Record<string, Record<string, unknown>>;
    const branding = (tenant?.branding_config ?? {}) as { tonalitaet?: string };
    const greeting =
      body.greeting ??
      `Kanzlei ${tenant?.kanzlei_name ?? ""}, mein Name ist Anna. Wie kann ich Ihnen helfen?`;
    await admin
      .from("tenants")
      .update({
        provider_config: {
          ...baseCfg,
          voice: { ...(baseCfg.voice ?? {}), status: "provisioning", greeting },
        },
      })
      .eq("id", ctx.tenant_id);

    // Tenant-spezifischen Vapi-Assistant erstellen (oder Default-Fallback nutzen)
    let assistantId: string | undefined = fallbackAssistantId ?? undefined;
    const assistantConfig = buildVapiAssistantConfig({
      kanzlei_name: tenant?.kanzlei_name ?? "Kanzlei",
      tonalitaet: (branding.tonalitaet as "formal" | "freundlich" | "empathisch" | "direkt") ?? "freundlich",
      rechtsgebiete: (tenant?.rechtsgebiete as string[] | undefined) ?? undefined,
      greeting,
      inhaber_name: tenant?.inhaber_name as string | undefined,
    });
    // Server-URL für Function-Tools + Webhook
    if (webhookBaseUrl) {
      (assistantConfig as Record<string, unknown>).serverUrl = `${webhookBaseUrl.replace(/\/$/, "")}/functions/v1/webhook-vapi`;
    }
    const createRes = await fetch("https://api.vapi.ai/assistant", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(assistantConfig),
    });
    if (createRes.ok) {
      const created = (await createRes.json()) as { id?: string };
      if (created.id) assistantId = created.id;
    } else {
      const err = await createRes.text();
      console.warn(
        `[provision-voice-number] Tenant-Assistant-Create failed (${createRes.status}), fallback auf Default-Assistant: ${err.slice(0, 200)}`,
      );
    }

    // Vapi: Buy Phone Number — bindet sie an den eben erstellten Assistant
    const buyRes = await fetch("https://api.vapi.ai/phone-number/buy", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        provider: "vapi",
        areaCode: body.area_code ?? "030",
        assistantId,
        name: `SYSTEMS-Tenant-${ctx.tenant_id.slice(0, 8)}`,
      }),
    });

    if (!buyRes.ok) {
      const errBody = await buyRes.text();
      console.error("[provision-voice-number] Vapi error:", errBody.slice(0, 500));
      // Status zurück auf not_provisioned
      await admin
        .from("tenants")
        .update({
          provider_config: {
            ...baseCfg,
            voice: { ...(baseCfg.voice ?? {}), status: "not_provisioned" },
          },
        })
        .eq("id", ctx.tenant_id);
      return respond(
        {
          ok: false,
          message: `Anlage fehlgeschlagen (Provider-Fehler ${buyRes.status}). Bitte später erneut versuchen.`,
        },
        502,
      );
    }

    const result = (await buyRes.json()) as {
      id: string;
      number: string;
      assistantId?: string;
    };

    // Final speichern
    await admin
      .from("tenants")
      .update({
        provider_config: {
          ...baseCfg,
          voice: {
            ...(baseCfg.voice ?? {}),
            enabled: true,
            phone_number: result.number,
            phone_number_id: result.id,
            assistant_id: assistantId ?? null,
            provisioned_at: new Date().toISOString(),
            status: "active",
            greeting,
          },
        },
      })
      .eq("id", ctx.tenant_id);

    // Als notfall_nummer speichern, damit webhook-vapi den Tenant findet
    await admin
      .from("tenants")
      .update({ notfall_nummer: result.number })
      .eq("id", ctx.tenant_id);

    // Audit-Log: Provisioning-Erfolg
    await admin.from("audit_log").insert({
      tenant_id: ctx.tenant_id,
      user_id: ctx.id,
      action: "create",
      entity_type: "voice_provisioning",
      details: `KI-Telefonnummer ${result.number} provisioniert`,
    });

    return respond({
      ok: true,
      phone_number: result.number,
      message: "KI-Telefon ist live.",
    });
  } catch (e) {
    console.error("[provision-voice-number]", e);
    return respond({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
