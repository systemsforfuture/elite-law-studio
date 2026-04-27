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
      // account.updated payload
      charges_enabled?: boolean;
      payouts_enabled?: boolean;
      details_submitted?: boolean;
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

    // ──────────────────────────────────────────────────────────
    // Connect-Status sync: Tenant.provider_config.stripe aktualisieren
    // wenn der Connect-Account vom Anwalt beim KYC weiter ausgefüllt wird.
    // ──────────────────────────────────────────────────────────
    if (event.type === "account.updated") {
      const acctId = event.data.object.id;
      if (!acctId) {
        return new Response(JSON.stringify({ ok: true, ignored: "no account id" }), {
          headers: { ...corsHeaders, "content-type": "application/json" },
        });
      }
      const charges = Boolean(event.data.object.charges_enabled);
      const payouts = Boolean(event.data.object.payouts_enabled);

      // Tenant via connect_account_id finden — kein direkter Index, deshalb scan.
      // In Production: indexed-jsonb-Path-Query oder dedizierte stripe_connect_id-Spalte.
      const { data: tenants, error: searchErr } = await admin
        .from("tenants")
        .select("id, provider_config")
        .filter("provider_config->stripe->>connect_account_id", "eq", acctId)
        .limit(1);
      if (searchErr || !tenants || tenants.length === 0) {
        console.warn("[webhook-stripe] account.updated: kein Tenant für", acctId);
        return new Response(JSON.stringify({ ok: true, ignored: "no tenant" }), {
          headers: { ...corsHeaders, "content-type": "application/json" },
        });
      }
      const t = tenants[0];
      const baseCfg = (t.provider_config ?? {}) as Record<string, Record<string, unknown>>;
      await admin
        .from("tenants")
        .update({
          provider_config: {
            ...baseCfg,
            stripe: {
              ...(baseCfg.stripe ?? {}),
              charges_enabled: charges,
              payouts_enabled: payouts,
              enabled: charges && payouts,
            },
          },
        })
        .eq("id", t.id);
      return new Response(JSON.stringify({ ok: true, charges, payouts }), {
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

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
