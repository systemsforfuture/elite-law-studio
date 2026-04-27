// SYSTEMS™ Edge Function — webhook-email
//
// Empfängt eingehende Mails vom Email-Provider (Resend Inbound).
// Persistiert als Konversation, löst Triage aus.

import { handleCors, corsHeaders } from "../_shared/cors.ts";
import { supabaseAdmin } from "../_shared/supabase-admin.ts";
import { verifyHmac } from "../_shared/webhook-utils.ts";

interface EmailPayload {
  type: "email.delivered" | "email.received" | "inbound.email";
  data?: {
    from?: { address?: string; name?: string };
    to?: { address?: string }[];
    subject?: string;
    text?: string;
    html?: string;
    headers?: Record<string, string>;
    received_at?: string;
  };
  // Resend inbound shape
  email?: {
    from?: string;
    to?: string[];
    subject?: string;
    text?: string;
  };
}

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const rawBody = await req.text();

    const secret = Deno.env.get("EMAIL_WEBHOOK_SECRET");
    const sig = req.headers.get("svix-signature") ?? req.headers.get("resend-signature");
    if (secret && sig) {
      const valid = await verifyHmac(rawBody, sig, secret);
      if (!valid) {
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 401,
          headers: { ...corsHeaders, "content-type": "application/json" },
        });
      }
    }

    const payload: EmailPayload = JSON.parse(rawBody);
    const admin = supabaseAdmin();

    // Quelle der Daten (Resend ist nicht ganz konsistent)
    const fromEmail =
      payload.data?.from?.address ?? payload.email?.from ?? "";
    const toEmail =
      payload.data?.to?.[0]?.address ?? payload.email?.to?.[0] ?? "";
    const subject = payload.data?.subject ?? payload.email?.subject ?? "";
    const text = payload.data?.text ?? payload.email?.text ?? "";

    // Tenant via Empfänger-Domain
    const toDomain = toEmail.split("@")[1] ?? "";
    let tenant_id: string | null = null;
    if (toDomain) {
      const { data: t } = await admin
        .from("tenants")
        .select("id")
        .or(`domain.eq.${toDomain},subdomain.eq.${toDomain}`)
        .maybeSingle();
      tenant_id = t?.id ?? null;
    }
    if (!tenant_id) {
      console.warn("[webhook-email] Tenant nicht resolvable für to=", toEmail);
      return new Response(
        JSON.stringify({ error: "tenant_not_resolvable", to: toEmail }),
        { status: 422, headers: { ...corsHeaders, "content-type": "application/json" } },
      );
    }

    // Mandant via Absender-Email
    let mandant_id: string | null = null;
    if (fromEmail) {
      const { data: m } = await admin
        .from("mandanten")
        .select("id")
        .eq("tenant_id", tenant_id)
        .eq("email", fromEmail.toLowerCase())
        .maybeSingle();
      mandant_id = m?.id ?? null;
    }

    const { data: konv, error: konvErr } = await admin
      .from("konversationen")
      .insert({
        tenant_id,
        mandant_id,
        kanal: "email",
        richtung: "inbound",
        status: "pending",
        betreff: subject.slice(0, 500),
        preview: (text || "").slice(0, 500),
        inhalt: text,
        ai_handled: false,
        ungelesen: true,
        zeitpunkt: payload.data?.received_at ?? new Date().toISOString(),
      })
      .select()
      .single();

    if (konvErr || !konv) {
      console.error("[webhook-email] Konversation-Insert fehlgeschlagen:", konvErr);
      return new Response(
        JSON.stringify({ error: "konversation_insert_failed", details: konvErr?.message }),
        { status: 500, headers: { ...corsHeaders, "content-type": "application/json" } },
      );
    }

    // actor_name darf nicht leer sein (NOT NULL Constraint)
    const actorName = payload.data?.from?.name ?? fromEmail ?? "Unbekannt";
    await admin.from("activities").insert({
      tenant_id,
      mandant_id,
      type: "email_in",
      actor: "mandant",
      actor_name: actorName.trim() || "Unbekannt",
      title: "E-Mail eingegangen",
      detail: subject.slice(0, 500),
      link_to: konv ? { module: "inbox", id: konv.id } : null,
    });

    // Triage automatisch starten
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
      ).catch((e) => console.warn("[email] triage trigger:", e));
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  } catch (e) {
    console.error("[webhook-email]", e);
    return new Response(
      JSON.stringify({ ok: false, error: String(e) }),
      {
        status: 200,
        headers: { ...corsHeaders, "content-type": "application/json" },
      },
    );
  }
});
