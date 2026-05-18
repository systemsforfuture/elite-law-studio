// SYSTEMS™ — Shared Notification-Helpers
//
// Out-of-band Push an den Anwalt bei Eskalationen aus der Voice-KI oder
// anderen kritischen Events. Multi-Channel: Resend-Email + Vapi-SMS.
//
// Best-effort: Wenn ein Channel fehlschlägt, log + weiter. Eskalations-
// Persistenz in der DB ist die ground-truth — Notifications sind das
// "Ich möchte es JETZT wissen" overlay.

import { supabaseAdmin } from "./supabase-admin.ts";

export type EscalationUrgency =
  | "sofort_durchstellen"
  | "rueckruf_heute"
  | "rueckruf_naechster_werktag";

export interface EscalationContext {
  tenant_id: string;
  /** Konversations-ID für Deep-Link ins Dashboard */
  konversation_id: string | null;
  /** Grund-Text den die KI dem Anwalt durchgibt */
  grund: string;
  /** Dringlichkeit nach Tool-Definition */
  dringlichkeit: EscalationUrgency;
  /** Anrufer-Nummer falls bekannt */
  anrufer_nummer: string | null;
  /** Mandant-Name falls bekannt */
  mandant_name: string | null;
  /** Vapi-Call-ID für Audit-Trace */
  vapi_call_id: string | null;
}

interface TenantNotifyInfo {
  kanzlei_name: string;
  notfall_nummer: string | null;
  domain: string | null;
  owner_email: string | null;
  owner_name: string | null;
  from_email: string | null;
}

const urgencyLabel = (u: EscalationUrgency): string =>
  u === "sofort_durchstellen"
    ? "SOFORT durchstellen"
    : u === "rueckruf_heute"
      ? "Rückruf heute"
      : "Rückruf nächster Werktag";

const loadTenantInfo = async (
  admin: ReturnType<typeof supabaseAdmin>,
  tenant_id: string,
): Promise<TenantNotifyInfo | null> => {
  const { data: tenant } = await admin
    .from("tenants")
    .select("kanzlei_name, notfall_nummer, domain, provider_config")
    .eq("id", tenant_id)
    .maybeSingle();
  if (!tenant) return null;
  const cfg = (tenant.provider_config ?? {}) as {
    email?: { from_email?: string };
  };

  // Owner-Email aus users-Tabelle holen
  const { data: owner } = await admin
    .from("users")
    .select("email, name")
    .eq("tenant_id", tenant_id)
    .eq("role", "owner")
    .limit(1)
    .maybeSingle();

  return {
    kanzlei_name: tenant.kanzlei_name ?? "Kanzlei",
    notfall_nummer: tenant.notfall_nummer ?? null,
    domain: tenant.domain ?? null,
    owner_email: owner?.email ?? null,
    owner_name: owner?.name ?? null,
    from_email: cfg.email?.from_email ?? null,
  };
};

const sendEscalationEmail = async (
  apiKey: string,
  to: string,
  fromEmail: string,
  ctx: EscalationContext,
  info: TenantNotifyInfo,
): Promise<{ ok: boolean; error?: string }> => {
  const subject = `${
    ctx.dringlichkeit === "sofort_durchstellen" ? "[🔴 SOFORT]" : "[Eskalation]"
  } KI-Anruf · ${ctx.mandant_name ?? "Unbekannter Anrufer"}`;

  const deepLink = info.domain
    ? `https://${info.domain}/dashboard/voice${ctx.konversation_id ? `?id=${ctx.konversation_id}` : ""}`
    : null;

  const text = [
    `Hallo${info.owner_name ? ` ${info.owner_name}` : ""},`,
    ``,
    `Die KI-Empfangskraft hat soeben einen Anruf an Sie eskaliert.`,
    ``,
    `Dringlichkeit: ${urgencyLabel(ctx.dringlichkeit)}`,
    `Anrufer:       ${ctx.mandant_name ?? "Unbekannt"}${ctx.anrufer_nummer ? ` · ${ctx.anrufer_nummer}` : ""}`,
    ``,
    `Grund:`,
    ctx.grund,
    ``,
    deepLink ? `Anruf im Dashboard öffnen:\n${deepLink}` : "",
    ``,
    `— SYSTEMS™ KI-Empfangskraft (${info.kanzlei_name})`,
  ]
    .filter((l) => l !== "")
    .join("\n");

  const html = `<!doctype html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,Segoe UI,Inter,sans-serif;background:#fafafa;padding:24px;color:#0f172a">
  <div style="max-width:560px;margin:0 auto;background:white;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden">
    <div style="padding:20px 24px;border-bottom:1px solid #e5e7eb;background:${
      ctx.dringlichkeit === "sofort_durchstellen" ? "#fef2f2" : "#fffbeb"
    }">
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:${
        ctx.dringlichkeit === "sofort_durchstellen" ? "#991b1b" : "#92400e"
      }">${urgencyLabel(ctx.dringlichkeit)}</div>
      <div style="font-size:18px;font-weight:700;margin-top:4px">KI-Anruf eskaliert</div>
    </div>
    <div style="padding:20px 24px">
      <div style="font-size:13px;color:#475569;margin-bottom:14px">
        <strong>Anrufer:</strong> ${ctx.mandant_name ?? "Unbekannt"}${
          ctx.anrufer_nummer ? ` · ${ctx.anrufer_nummer}` : ""
        }
      </div>
      <div style="background:#f8fafc;border-radius:10px;padding:14px;font-size:14px;line-height:1.5;color:#0f172a;border-left:3px solid #d4af37">
        ${ctx.grund.replace(/[<>&]/g, (m) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[m] ?? m))}
      </div>
      ${
        deepLink
          ? `<a href="${deepLink}" style="display:inline-block;margin-top:18px;padding:10px 18px;background:#0f172a;color:white;text-decoration:none;border-radius:10px;font-size:13px;font-weight:600">Anruf öffnen →</a>`
          : ""
      }
    </div>
    <div style="padding:12px 24px;border-top:1px solid #e5e7eb;font-size:11px;color:#94a3b8">
      SYSTEMS™ · ${info.kanzlei_name}
    </div>
  </div>
</body></html>`;

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
      html,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    return { ok: false, error: `Resend ${res.status}: ${body.slice(0, 200)}` };
  }
  return { ok: true };
};

const sendEscalationSms = async (
  vapiKey: string,
  to: string,
  fromNumberId: string,
  ctx: EscalationContext,
): Promise<{ ok: boolean; error?: string }> => {
  const text = [
    `[${ctx.dringlichkeit === "sofort_durchstellen" ? "🔴 SOFORT" : "Eskalation"}] KI-Anruf`,
    `Anrufer: ${ctx.mandant_name ?? "Unbekannt"}${ctx.anrufer_nummer ? ` · ${ctx.anrufer_nummer}` : ""}`,
    ctx.grund.slice(0, 200),
  ].join("\n");

  const res = await fetch("https://api.vapi.ai/sms", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${vapiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      phoneNumberId: fromNumberId,
      customer: { number: to },
      message: text,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    return { ok: false, error: `Vapi-SMS ${res.status}: ${body.slice(0, 200)}` };
  }
  return { ok: true };
};

/**
 * Versendet Out-of-Band-Notifications an den Owner-Anwalt bei einer
 * Eskalation. Multi-Channel: Email + SMS. Fehler in einem Channel
 * brechen die anderen NICHT ab — best-effort.
 *
 * Aufruf-Pattern (fire-and-forget, kein await blockend):
 *   notifyEscalation(ctx).catch(err => console.error(err))
 *
 * Realtime-Toast im Dashboard wird separat über activities-INSERT
 * realisiert (Postgres-Subscription).
 */
export const notifyEscalation = async (ctx: EscalationContext): Promise<void> => {
  const admin = supabaseAdmin();
  const info = await loadTenantInfo(admin, ctx.tenant_id);
  if (!info) {
    console.warn("[notify] tenant not found", ctx.tenant_id);
    return;
  }

  const results: Array<{ channel: string; ok: boolean; error?: string }> = [];

  // ── Email an Owner via Resend ────────────────────────────────────
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (resendKey && info.owner_email) {
    const fromEmail =
      info.from_email ??
      Deno.env.get("RESEND_FROM_EMAIL") ??
      "noreply@systems-tm.de";
    const r = await sendEscalationEmail(resendKey, info.owner_email, fromEmail, ctx, info);
    results.push({ channel: "email", ...r });
  } else if (!resendKey) {
    console.warn("[notify] RESEND_API_KEY fehlt — Email-Notification skipped");
  } else if (!info.owner_email) {
    console.warn("[notify] tenant hat keinen Owner mit Email", ctx.tenant_id);
  }

  // ── SMS an Notfall-Hotline via Vapi ─────────────────────────────
  // Nur bei "sofort_durchstellen" oder "rueckruf_heute" — bei
  // "rueckruf_naechster_werktag" reicht die Email.
  const vapiKey = Deno.env.get("VAPI_API_KEY");
  const smsPhoneNumberId = Deno.env.get("VAPI_SMS_PHONE_NUMBER_ID");
  if (
    vapiKey &&
    smsPhoneNumberId &&
    info.notfall_nummer &&
    ctx.dringlichkeit !== "rueckruf_naechster_werktag"
  ) {
    const r = await sendEscalationSms(vapiKey, info.notfall_nummer, smsPhoneNumberId, ctx);
    results.push({ channel: "sms", ...r });
  }

  // ── Audit-Log ───────────────────────────────────────────────────
  await admin.from("audit_log").insert({
    tenant_id: ctx.tenant_id,
    action: "ai_action",
    entity_type: "voice_escalation",
    entity_id: ctx.konversation_id ?? null,
    details: `Notification an Owner: ${results
      .map((r) => `${r.channel}=${r.ok ? "ok" : "fail:" + (r.error ?? "")}`)
      .join(", ")} · vapi_call_id=${ctx.vapi_call_id ?? "-"}`,
  });
};
