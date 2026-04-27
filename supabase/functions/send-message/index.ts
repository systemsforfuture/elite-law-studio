// SYSTEMS™ Edge Function — send-message
//
// Sendet eine ausgehende Nachricht (Email / WhatsApp) an einen Mandanten.
// Aufruf vom Frontend wenn der Anwalt einen KI-Vorschlag annimmt oder
// eigenen Text schickt.
//
// Provider-Routing:
//   email → Resend (RESEND_API_KEY)
//   whatsapp → 360dialog Cloud API (WHATSAPP_API_TOKEN + PHONE_NUMBER_ID)
//
// Wenn Provider-Keys fehlen: nur DB-Update (Mock-Send-Mode), kein
// echtes Versenden — UI funktioniert trotzdem.

import { handleCors, corsHeaders } from "../_shared/cors.ts";
import { callerContext, supabaseAdmin } from "../_shared/supabase-admin.ts";

interface RequestBody {
  /** Falls auf bestehende Konversation antwortend */
  in_reply_to?: string;
  channel: "email" | "whatsapp";
  to: string;
  subject?: string;
  text: string;
  mandant_id?: string;
}

const sendEmailViaResend = async (
  to: string,
  subject: string,
  text: string,
  fromEmail: string,
): Promise<{ ok: boolean; id?: string; error?: string }> => {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) return { ok: false, error: "RESEND_API_KEY nicht gesetzt" };
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [to],
      subject,
      text,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    return { ok: false, error: `Resend ${res.status}: ${body.slice(0, 200)}` };
  }
  const data = await res.json();
  return { ok: true, id: data.id };
};

const sendWhatsAppVia360dialog = async (
  to: string,
  text: string,
): Promise<{ ok: boolean; id?: string; error?: string }> => {
  const apiKey = Deno.env.get("WHATSAPP_API_TOKEN");
  const phoneId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
  if (!apiKey || !phoneId) {
    return { ok: false, error: "WhatsApp-Credentials nicht gesetzt" };
  }
  const res = await fetch(
    `https://waba-v2.360dialog.io/v2/messages`,
    {
      method: "POST",
      headers: {
        "D360-API-KEY": apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: text },
      }),
    },
  );
  if (!res.ok) {
    const body = await res.text();
    return { ok: false, error: `360dialog ${res.status}: ${body.slice(0, 200)}` };
  }
  const data = await res.json();
  return { ok: true, id: data.messages?.[0]?.id };
};

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const ctx = await callerContext(req);
    if (!ctx) {
      return new Response(JSON.stringify({ error: "Nicht authentifiziert" }), {
        status: 401,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    const body: RequestBody = await req.json();
    if (!body.to?.trim() || !body.text?.trim() || !body.channel) {
      return new Response(
        JSON.stringify({ error: "to, text, channel erforderlich" }),
        {
          status: 400,
          headers: { ...corsHeaders, "content-type": "application/json" },
        },
      );
    }

    const admin = supabaseAdmin();
    const { data: tenant } = await admin
      .from("tenants")
      .select("kanzlei_name, domain")
      .eq("id", ctx.tenant_id)
      .single();

    // Provider-Versand
    let providerOk = false;
    let providerErr: string | undefined;
    let providerId: string | undefined;
    if (body.channel === "email") {
      const fromEmail = `${(tenant?.kanzlei_name ?? "Kanzlei")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")}@${tenant?.domain ?? "systems-tm.de"}`;
      const r = await sendEmailViaResend(
        body.to,
        body.subject ?? "Nachricht von Ihrer Kanzlei",
        body.text,
        fromEmail,
      );
      providerOk = r.ok;
      providerErr = r.error;
      providerId = r.id;
    } else if (body.channel === "whatsapp") {
      const r = await sendWhatsAppVia360dialog(body.to, body.text);
      providerOk = r.ok;
      providerErr = r.error;
      providerId = r.id;
    }

    // DB-Eintrag IMMER (auch bei Provider-Failure → Anwalt sieht es als unsent)
    const { data: konv, error: konvErr } = await admin
      .from("konversationen")
      .insert({
        tenant_id: ctx.tenant_id,
        mandant_id: body.mandant_id,
        kanal: body.channel,
        richtung: "outbound",
        status: providerOk ? "handled" : "pending",
        betreff: body.subject,
        preview: body.text.slice(0, 500),
        inhalt: body.text,
        ai_handled: false,
        ungelesen: false,
        zeitpunkt: new Date().toISOString(),
      })
      .select()
      .single();

    if (konvErr) throw konvErr;

    // Activity — actor_name aus public.users laden (statt UUID)
    const { data: callerUser } = await admin
      .from("users")
      .select("name")
      .eq("id", ctx.id)
      .maybeSingle();
    await admin.from("activities").insert({
      tenant_id: ctx.tenant_id,
      mandant_id: body.mandant_id,
      type: body.channel === "email" ? "email_out" : "whatsapp",
      actor: "anwalt",
      actor_name: callerUser?.name ?? "Anwalt",
      title: providerOk
        ? `Antwort an Mandant gesendet (${body.channel})`
        : `Antwort konnte nicht gesendet werden (${providerErr ?? "Provider-Fehler"})`,
      detail: body.text.slice(0, 500),
      link_to: { module: "inbox", id: konv.id },
    });

    return new Response(
      JSON.stringify({
        ok: providerOk,
        konversation_id: konv.id,
        provider_id: providerId,
        provider_error: providerErr,
        mock_mode:
          body.channel === "email"
            ? !Deno.env.get("RESEND_API_KEY")
            : !Deno.env.get("WHATSAPP_API_TOKEN"),
      }),
      {
        headers: { ...corsHeaders, "content-type": "application/json" },
      },
    );
  } catch (e) {
    console.error("[send-message]", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
      {
        status: 500,
        headers: { ...corsHeaders, "content-type": "application/json" },
      },
    );
  }
});
