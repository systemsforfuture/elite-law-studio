// SYSTEMS™ Edge Function — webhook-vapi
//
// Empfängt Webhook-Events vom externen Voice-Provider (Vapi.ai).
// Persistiert eingehende Anrufe als Konversationen, erzeugt Activity-
// Einträge und löst optional Triage aus.
//
// Setup:
//   1. supabase functions deploy webhook-vapi --no-verify-jwt
//   2. supabase secrets set VAPI_WEBHOOK_SECRET=<...>
//   3. In Vapi-Dashboard: Webhook-URL eintragen
//      https://dsgenkjlkdzkoplnxebg.supabase.co/functions/v1/webhook-vapi

import { handleCors, corsHeaders } from "../_shared/cors.ts";
import { supabaseAdmin } from "../_shared/supabase-admin.ts";
import { normalizePhone, verifyHmac } from "../_shared/webhook-utils.ts";

interface VapiWebhookPayload {
  type:
    | "call.started"
    | "call.ended"
    | "call.transcript"
    | "function-call"
    | "end-of-call-report";
  call?: {
    id: string;
    customer?: { number?: string };
    phoneNumber?: { number?: string };
    startedAt?: string;
    endedAt?: string;
    duration?: number;
    transcript?: string;
    summary?: string;
    analysis?: {
      summary?: string;
      structuredData?: Record<string, unknown>;
    };
    messages?: { role: string; message: string; time?: number }[];
  };
}

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    // Body als String lesen für HMAC-Check
    const rawBody = await req.text();

    // Signature-Verifikation (skippen wenn kein Secret gesetzt)
    const secret = Deno.env.get("VAPI_WEBHOOK_SECRET");
    const sig = req.headers.get("x-vapi-signature");
    if (secret && sig) {
      const valid = await verifyHmac(rawBody, sig, secret);
      if (!valid) {
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 401,
          headers: { ...corsHeaders, "content-type": "application/json" },
        });
      }
    }

    const payload: VapiWebhookPayload = JSON.parse(rawBody);
    const admin = supabaseAdmin();

    // Tenant via angerufene Nummer auflösen
    const calledNumber = normalizePhone(payload.call?.phoneNumber?.number);
    let tenant_id: string | null = null;
    if (calledNumber) {
      const { data: t } = await admin
        .from("tenants")
        .select("id")
        .eq("notfall_nummer", calledNumber)
        .maybeSingle();
      tenant_id = t?.id ?? null;
    }
    // Fallback: Demo-Tenant
    if (!tenant_id) tenant_id = "11111111-1111-1111-1111-111111111111";

    // Mandant via Anrufer-Nummer
    const fromNumber = normalizePhone(payload.call?.customer?.number);
    let mandant_id: string | null = null;
    if (fromNumber) {
      const { data: m } = await admin
        .from("mandanten")
        .select("id")
        .eq("tenant_id", tenant_id)
        .or(`telefon.eq.${fromNumber},whatsapp.eq.${fromNumber}`)
        .maybeSingle();
      mandant_id = m?.id ?? null;
    }

    // Event-Type-spezifische Verarbeitung
    if (
      payload.type === "end-of-call-report" ||
      payload.type === "call.ended"
    ) {
      const transcript =
        payload.call?.messages?.map((m) => ({
          speaker: m.role === "assistant" ? "ai" : "mandant",
          text: m.message,
          ts: m.time
            ? new Date(m.time * 1000).toISOString().slice(11, 19)
            : "",
        })) ?? null;

      const { data: konv, error } = await admin
        .from("konversationen")
        .insert({
          tenant_id,
          mandant_id,
          kanal: "voice",
          richtung: "inbound",
          status: "automated",
          intent: payload.call?.analysis?.summary ? "qualified_call" : "call",
          preview: payload.call?.summary ?? payload.call?.analysis?.summary ?? "Anruf protokolliert",
          inhalt: payload.call?.transcript,
          ai_handled: true,
          dauer_sek: payload.call?.duration,
          transcript,
          ungelesen: true,
          zeitpunkt: payload.call?.endedAt ?? new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Activity-Eintrag
      await admin.from("activities").insert({
        tenant_id,
        mandant_id,
        type: "voice_call",
        actor: "ai",
        actor_name: "Voice-Receptionist",
        title: "Eingehender Anruf protokolliert",
        detail: payload.call?.summary?.slice(0, 500),
        link_to: { module: "voice", id: konv.id },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  } catch (e) {
    console.error("[webhook-vapi]", e);
    // Webhook IMMER 200 zurück — sonst retried Vapi
    return new Response(
      JSON.stringify({
        ok: false,
        error: e instanceof Error ? e.message : String(e),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "content-type": "application/json" },
      },
    );
  }
});
