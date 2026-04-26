// SYSTEMS™ Edge Function — webhook-stripe
//
// Empfängt Stripe-Webhook-Events. Hauptevent: checkout.session.completed
// → markiert Rechnung als bezahlt + Activity-Eintrag.
//
// Setup:
//   1. supabase functions deploy webhook-stripe --no-verify-jwt
//   2. supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_…
//   3. In Stripe-Dashboard: Webhook-URL eintragen
//      https://dsgenkjlkdzkoplnxebg.supabase.co/functions/v1/webhook-stripe

import { handleCors, corsHeaders } from "../_shared/cors.ts";
import { supabaseAdmin } from "../_shared/supabase-admin.ts";

interface StripeEvent {
  type: string;
  data: {
    object: {
      id?: string;
      payment_status?: string;
      metadata?: { rechnung_id?: string; tenant_id?: string };
      customer_email?: string;
      amount_total?: number;
    };
  };
}

const verifyStripeSignature = async (
  body: string,
  header: string,
  secret: string,
): Promise<boolean> => {
  // Stripe-Signature: t=<ts>,v1=<sig>
  const parts = header.split(",").reduce(
    (acc, p) => {
      const [k, v] = p.split("=");
      acc[k] = v;
      return acc;
    },
    {} as Record<string, string>,
  );
  if (!parts.t || !parts.v1) return false;
  const payload = `${parts.t}.${body}`;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  const hex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hex === parts.v1;
};

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const body = await req.text();

    const secret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    const sig = req.headers.get("stripe-signature");
    if (secret && sig) {
      const valid = await verifyStripeSignature(body, sig, secret);
      if (!valid) {
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 401,
          headers: { ...corsHeaders, "content-type": "application/json" },
        });
      }
    }

    const event: StripeEvent = JSON.parse(body);
    const admin = supabaseAdmin();

    if (event.type === "checkout.session.completed") {
      const rechnung_id = event.data.object.metadata?.rechnung_id;
      const tenant_id = event.data.object.metadata?.tenant_id;
      if (!rechnung_id || !tenant_id) {
        return new Response(JSON.stringify({ ok: true, ignored: "missing metadata" }), {
          headers: { ...corsHeaders, "content-type": "application/json" },
        });
      }

      // Rechnung als bezahlt markieren
      const { data: r, error } = await admin
        .from("rechnungen")
        .update({
          status: "bezahlt",
          bezahlt_am: new Date().toISOString().slice(0, 10),
          mahnstufe: 0,
          naechste_aktion_am: null,
        })
        .eq("id", rechnung_id)
        .eq("tenant_id", tenant_id)
        .select()
        .single();

      if (error) throw error;

      // Activity
      await admin.from("activities").insert({
        tenant_id,
        mandant_id: r.mandant_id,
        type: "rechnung_paid",
        actor: "system",
        actor_name: "Stripe",
        title: "Online-Zahlung eingegangen",
        detail: `Rechnung ${r.rechnungsnummer} · ${r.betrag_brutto}€`,
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  } catch (e) {
    console.error("[webhook-stripe]", e);
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 200,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }
});
