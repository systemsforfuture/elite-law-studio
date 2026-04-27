// SYSTEMS™ Edge Function — voice-test-call
//
// Owner kann seinen eigenen KI-Telefon-Assistenten testen ohne extern
// anzurufen: Vapi.ai's outbound-call-API ruft die hinterlegte Test-Nummer
// (Owner-Handy) und verbindet sie mit dem Tenant-Assistant. Owner spricht
// mit der KI, hängt auf, fertig.

import { handleCors, corsHeaders } from "../_shared/cors.ts";
import { callerContext, supabaseAdmin } from "../_shared/supabase-admin.ts";

interface RequestBody {
  /** Mobil/Festnetz wo die KI hinrufen soll */
  call_to: string;
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
      return respond({ error: "Nur Owner darf Test-Anruf auslösen" }, 403);
    }

    const body: RequestBody = await req.json();
    if (!body.call_to || !/^\+\d{10,15}$/.test(body.call_to)) {
      return respond(
        { ok: false, message: "Telefonnummer-Format: international (+49…)" },
        400,
      );
    }

    const apiKey = Deno.env.get("VAPI_API_KEY");
    if (!apiKey) {
      return respond(
        { ok: false, message: "Voice-Plattform nicht eingerichtet" },
        503,
      );
    }

    const admin = supabaseAdmin();
    const { data: tenant } = await admin
      .from("tenants")
      .select("provider_config")
      .eq("id", ctx.tenant_id)
      .single();
    const cfg = (tenant?.provider_config ?? {}) as {
      voice?: {
        enabled?: boolean;
        phone_number_id?: string;
        status?: string;
      };
    };

    if (!cfg.voice?.enabled || cfg.voice?.status !== "active" || !cfg.voice?.phone_number_id) {
      return respond(
        {
          ok: false,
          message: "KI-Telefon muss erst eingerichtet sein. → Integrationen",
        },
        409,
      );
    }

    // Vapi: outbound call
    const callRes = await fetch("https://api.vapi.ai/call", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        phoneNumberId: cfg.voice.phone_number_id,
        customer: { number: body.call_to },
      }),
    });
    if (!callRes.ok) {
      const errBody = await callRes.text();
      console.error("[voice-test-call]", errBody.slice(0, 300));
      return respond(
        { ok: false, message: `Anruf fehlgeschlagen (${callRes.status})` },
        502,
      );
    }

    return respond({
      ok: true,
      message: `Ihre KI ruft jetzt ${body.call_to} an. Bitte annehmen.`,
    });
  } catch (e) {
    console.error("[voice-test-call]", e);
    return respond({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
