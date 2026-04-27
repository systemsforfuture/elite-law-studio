// SYSTEMS™ Edge Function — connect-stripe
//
// Plattform-Managed: SYSTEMS ist Stripe-Connect-Plattform. Owner klickt
// »Konto verbinden« → wir erzeugen Connect-Account-Onboarding-URL → User
// macht KYC bei Stripe → Stripe leitet zurück → wir speichern account_id.
//
// Bei Folge-Aufrufen ohne URL: aktualisiert nur Status (charges_enabled,
// payouts_enabled).

import { handleCors, corsHeaders } from "../_shared/cors.ts";
import { callerContext, supabaseAdmin } from "../_shared/supabase-admin.ts";

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
      return respond({ error: "Nur Owner darf Zahlungen verbinden" }, 403);
    }

    const platformKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!platformKey) {
      return respond(
        { ok: false, message: "Zahlungs-Plattform noch nicht eingerichtet." },
        503,
      );
    }

    const admin = supabaseAdmin();
    const { data: tenant } = await admin
      .from("tenants")
      .select("provider_config, kanzlei_name, domain")
      .eq("id", ctx.tenant_id)
      .single();
    const baseCfg = (tenant?.provider_config ?? {}) as Record<string, Record<string, unknown>>;
    const stripeCfg = (baseCfg.stripe ?? {}) as Record<string, unknown>;

    // ===== Wenn schon connected: nur Status aktualisieren =====
    if (stripeCfg.connect_account_id) {
      const accId = stripeCfg.connect_account_id as string;
      const accRes = await fetch(`https://api.stripe.com/v1/accounts/${accId}`, {
        headers: { Authorization: `Bearer ${platformKey}` },
      });
      if (!accRes.ok) {
        return respond({ ok: false, message: "Account-Status nicht abrufbar" }, 502);
      }
      const acc = (await accRes.json()) as {
        charges_enabled?: boolean;
        payouts_enabled?: boolean;
      };
      const charges = Boolean(acc.charges_enabled);
      const payouts = Boolean(acc.payouts_enabled);
      const enabled = charges && payouts;
      await admin
        .from("tenants")
        .update({
          provider_config: {
            ...baseCfg,
            stripe: {
              ...stripeCfg,
              charges_enabled: charges,
              payouts_enabled: payouts,
              enabled,
            },
          },
        })
        .eq("id", ctx.tenant_id);
      return respond({
        ok: true,
        charges_enabled: charges,
        payouts_enabled: payouts,
        message: enabled
          ? "Zahlungen sind live."
          : "KYC noch nicht abgeschlossen.",
      });
    }

    // ===== Neuer Connect-Account =====
    // 1. Express-Account erstellen
    const createParams = new URLSearchParams();
    createParams.append("type", "express");
    createParams.append("country", "DE");
    createParams.append("email", ctx.auth_user_id ? "" : ""); // wird in Onboarding gesammelt
    createParams.append("business_type", "company");
    createParams.append("metadata[tenant_id]", ctx.tenant_id);
    createParams.append("metadata[kanzlei_name]", tenant?.kanzlei_name ?? "");

    const accRes = await fetch("https://api.stripe.com/v1/accounts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${platformKey}`,
        "content-type": "application/x-www-form-urlencoded",
      },
      body: createParams.toString(),
    });
    if (!accRes.ok) {
      const errBody = await accRes.text();
      console.error("[connect-stripe] Stripe create error:", errBody.slice(0, 300));
      return respond({ ok: false, message: "Konto-Anlage fehlgeschlagen" }, 502);
    }
    const acc = (await accRes.json()) as { id: string };

    // 2. Onboarding-Link erzeugen
    const baseUrl = Deno.env.get("PUBLIC_BASE_URL") ?? "https://systems-tm.de";
    const linkParams = new URLSearchParams();
    linkParams.append("account", acc.id);
    linkParams.append("refresh_url", `${baseUrl}/dashboard/integrationen?stripe=refresh`);
    linkParams.append("return_url", `${baseUrl}/dashboard/integrationen?stripe=return`);
    linkParams.append("type", "account_onboarding");

    const linkRes = await fetch("https://api.stripe.com/v1/account_links", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${platformKey}`,
        "content-type": "application/x-www-form-urlencoded",
      },
      body: linkParams.toString(),
    });
    if (!linkRes.ok) {
      return respond({ ok: false, message: "Onboarding-Link fehlgeschlagen" }, 502);
    }
    const link = (await linkRes.json()) as { url: string };

    // 3. Account-ID speichern
    await admin
      .from("tenants")
      .update({
        provider_config: {
          ...baseCfg,
          stripe: {
            ...stripeCfg,
            connect_account_id: acc.id,
            connected_at: new Date().toISOString(),
            charges_enabled: false,
            payouts_enabled: false,
            enabled: false,
          },
        },
      })
      .eq("id", ctx.tenant_id);

    return respond({
      ok: true,
      oauth_url: link.url,
      message: "Weiterleitung zur sicheren Verifizierung",
    });
  } catch (e) {
    console.error("[connect-stripe]", e);
    return respond({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
