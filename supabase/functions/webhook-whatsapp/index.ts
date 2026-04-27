// SYSTEMS™ Edge Function — webhook-whatsapp
//
// Empfängt Webhooks vom externen WhatsApp-Provider (360dialog Cloud API).
// Persistiert eingehende Nachrichten als Konversationen und löst Triage aus.

import { handleCors, corsHeaders } from "../_shared/cors.ts";
import { supabaseAdmin } from "../_shared/supabase-admin.ts";
import { normalizePhone, verifyHmac } from "../_shared/webhook-utils.ts";

interface WhatsAppPayload {
  // 360dialog/Meta Cloud API Format
  entry?: {
    changes?: {
      value?: {
        messages?: {
          from: string;
          id: string;
          timestamp: string;
          type: string;
          text?: { body: string };
        }[];
        metadata?: { display_phone_number?: string };
      };
    }[];
  }[];
}

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  // Meta-Verification-Challenge (GET)
  if (req.method === "GET") {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    const expectedToken = Deno.env.get("WHATSAPP_VERIFY_TOKEN");
    if (mode === "subscribe" && token === expectedToken && challenge) {
      return new Response(challenge, { status: 200 });
    }
    return new Response("Forbidden", { status: 403 });
  }

  try {
    const rawBody = await req.text();

    const secret = Deno.env.get("WHATSAPP_WEBHOOK_SECRET");
    const sig = req.headers.get("x-hub-signature-256")?.replace("sha256=", "");
    if (secret && sig) {
      const valid = await verifyHmac(rawBody, sig, secret);
      if (!valid) {
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 401,
          headers: { ...corsHeaders, "content-type": "application/json" },
        });
      }
    }

    const payload: WhatsAppPayload = JSON.parse(rawBody);
    const admin = supabaseAdmin();

    for (const entry of payload.entry ?? []) {
      for (const change of entry.changes ?? []) {
        const value = change.value;
        if (!value?.messages) continue;

        const tenantPhone = normalizePhone(
          value.metadata?.display_phone_number,
        );
        let tenant_id: string | null = null;
        if (tenantPhone) {
          const { data: t } = await admin
            .from("tenants")
            .select("id")
            .eq("notfall_nummer", tenantPhone)
            .maybeSingle();
          tenant_id = t?.id ?? null;
        }
        if (!tenant_id) {
          console.warn("[webhook-whatsapp] Tenant nicht resolvable für phone=", tenantPhone);
          continue;
        }

        for (const msg of value.messages) {
          const from = normalizePhone(msg.from);
          let mandant_id: string | null = null;
          if (from) {
            const { data: m } = await admin
              .from("mandanten")
              .select("id")
              .eq("tenant_id", tenant_id)
              .or(`telefon.eq.${from},whatsapp.eq.${from}`)
              .maybeSingle();
            mandant_id = m?.id ?? null;
          }

          const text = msg.text?.body ?? `[${msg.type}]`;

          const { data: konv } = await admin
            .from("konversationen")
            .insert({
              tenant_id,
              mandant_id,
              kanal: "whatsapp",
              richtung: "inbound",
              status: "pending",
              preview: text.slice(0, 500),
              inhalt: text,
              ai_handled: false,
              ungelesen: true,
              zeitpunkt: new Date(
                Number(msg.timestamp) * 1000,
              ).toISOString(),
            })
            .select()
            .single();

          await admin.from("activities").insert({
            tenant_id,
            mandant_id,
            type: "whatsapp",
            actor: "mandant",
            actor_name: from || "Unbekannt",
            title: "WhatsApp-Nachricht eingegangen",
            detail: text.slice(0, 500),
            link_to: konv ? { module: "inbox", id: konv.id } : null,
          });

          // Optional: Triage automatisch triggern
          if (konv?.id && Deno.env.get("ANTHROPIC_API_KEY")) {
            void fetch(
              `${Deno.env.get("SUPABASE_URL")}/functions/v1/triage-inbox`,
              {
                method: "POST",
                headers: {
                  authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
                  "content-type": "application/json",
                },
                body: JSON.stringify({ konversation_id: konv.id }),
              },
            ).catch((e) => console.warn("[whatsapp] triage trigger:", e));
          }
        }
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  } catch (e) {
    console.error("[webhook-whatsapp]", e);
    return new Response(
      JSON.stringify({ ok: false, error: String(e) }),
      {
        status: 200,
        headers: { ...corsHeaders, "content-type": "application/json" },
      },
    );
  }
});
