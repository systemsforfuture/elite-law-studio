// SYSTEMS™ Edge Function — stripe-checkout
//
// Erzeugt eine Stripe-Checkout-Session für eine Rechnung. Gibt die URL
// zurück, das Frontend leitet den Mandanten dort hin.
//
// Setup: Im Supabase-Dashboard STRIPE_SECRET_KEY setzen.
// Wenn fehlend → Mock-Mode (gibt Fake-URL zurück).

import { handleCors, corsHeaders } from "../_shared/cors.ts";
import { supabaseAdmin } from "../_shared/supabase-admin.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

interface RequestBody {
  rechnung_id: string;
  success_url?: string;
  cancel_url?: string;
}

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const { rechnung_id, success_url, cancel_url }: RequestBody = await req.json();
    if (!rechnung_id) {
      return new Response(
        JSON.stringify({ error: "rechnung_id erforderlich" }),
        {
          status: 400,
          headers: { ...corsHeaders, "content-type": "application/json" },
        },
      );
    }

    // AUTH-Check: Caller MUSS authentifiziert sein (Anwalt, Mitarbeiter ODER Mandant).
    // Sonst: Anonymer kann Checkout-Sessions für fremde Rechnungen erzeugen +
    // PII der Mandanten lesen.
    const auth = req.headers.get("Authorization") ?? "";
    if (!auth.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }
    // Versuche Auth-User zu laden — kann Anwalt (public.users) oder Mandant sein.
    const sUrl = Deno.env.get("SUPABASE_URL")!;
    const sAnon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(sUrl, sAnon, {
      global: { headers: { Authorization: auth } },
    });
    const { data: u } = await userClient.auth.getUser();
    if (!u.user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    const admin = supabaseAdmin();
    const { data: r } = await admin
      .from("rechnungen")
      .select("*, mandant:mandanten(*), tenant:tenants(kanzlei_name, domain)")
      .eq("id", rechnung_id)
      .single();
    if (!r) {
      return new Response(JSON.stringify({ error: "Rechnung nicht gefunden" }), {
        status: 404,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    // Tenant-Scope-Check:
    // (a) Caller ist eingeloggter Mandant der Rechnung selbst, ODER
    // (b) Caller ist Kanzlei-User des Tenants der Rechnung
    const isOwnMandant = (r.mandant as { auth_user_id?: string } | null)?.auth_user_id === u.user.id;
    let isKanzlei = false;
    if (!isOwnMandant) {
      const { data: kanzleiUser } = await admin
        .from("users")
        .select("tenant_id")
        .eq("id", u.user.id)
        .maybeSingle();
      isKanzlei = kanzleiUser?.tenant_id === r.tenant_id;
    }
    if (!isOwnMandant && !isKanzlei) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      // Mock-Mode
      return new Response(
        JSON.stringify({
          url: "https://checkout.stripe.com/demo/" + rechnung_id,
          mock_mode: true,
          message: "STRIPE_SECRET_KEY nicht gesetzt — Demo-Link",
        }),
        {
          headers: { ...corsHeaders, "content-type": "application/json" },
        },
      );
    }

    const md = r.mandant as
      | { email?: string; vorname?: string; nachname?: string; firmenname?: string }
      | null;
    const cents = Math.round(Number(r.betrag_brutto) * 100);

    // Stripe-Checkout-Session erzeugen
    const params = new URLSearchParams();
    params.append("mode", "payment");
    params.append("payment_method_types[]", "card");
    params.append("payment_method_types[]", "sepa_debit");
    params.append("line_items[0][price_data][currency]", "eur");
    params.append(
      "line_items[0][price_data][product_data][name]",
      `Rechnung ${r.rechnungsnummer}`,
    );
    params.append(
      "line_items[0][price_data][product_data][description]",
      `${r.tenant?.kanzlei_name ?? "Kanzlei"} · Honorar`,
    );
    params.append("line_items[0][price_data][unit_amount]", String(cents));
    params.append("line_items[0][quantity]", "1");
    if (md?.email) params.append("customer_email", md.email);
    params.append("metadata[rechnung_id]", rechnung_id);
    params.append("metadata[tenant_id]", r.tenant_id);
    params.append(
      "success_url",
      success_url ??
        `https://${r.tenant?.domain ?? "kanzlei-bergmann.de"}/portal/dashboard?paid=${rechnung_id}`,
    );
    params.append(
      "cancel_url",
      cancel_url ??
        `https://${r.tenant?.domain ?? "kanzlei-bergmann.de"}/portal/dashboard`,
    );

    const stripeRes = await fetch(
      "https://api.stripe.com/v1/checkout/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${stripeKey}`,
          "content-type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      },
    );

    if (!stripeRes.ok) {
      const body = await stripeRes.text();
      throw new Error(`Stripe ${stripeRes.status}: ${body.slice(0, 300)}`);
    }
    const session = await stripeRes.json();

    return new Response(
      JSON.stringify({ url: session.url, session_id: session.id }),
      {
        headers: { ...corsHeaders, "content-type": "application/json" },
      },
    );
  } catch (e) {
    console.error("[stripe-checkout]", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
      {
        status: 500,
        headers: { ...corsHeaders, "content-type": "application/json" },
      },
    );
  }
});
