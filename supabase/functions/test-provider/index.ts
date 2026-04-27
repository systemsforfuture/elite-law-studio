// SYSTEMS™ Edge Function — test-provider
//
// Pingt einen Provider mit den eingetragenen Tenant-Credentials.
// Ergebnis wird in tenant.provider_config[provider].last_test_* persistiert.
//
// Mockt nichts — wenn kein Key konfiguriert ist, gibt 422 zurück.

import { handleCors, corsHeaders } from "../_shared/cors.ts";
import { callerContext, supabaseAdmin } from "../_shared/supabase-admin.ts";

type ProviderName = "vapi" | "whatsapp" | "resend" | "stripe";

interface RequestBody {
  provider: ProviderName;
}

interface TestResult {
  ok: boolean;
  message: string;
  details?: unknown;
}

const respond = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json" },
  });

// =================================================================
// Provider-Tests
// =================================================================

const testVapi = async (cfg: { api_key?: string; assistant_id?: string }): Promise<TestResult> => {
  if (!cfg.api_key) return { ok: false, message: "API-Key fehlt" };
  try {
    // Vapi /assistant endpoint listet alle Assistants
    const res = await fetch("https://api.vapi.ai/assistant", {
      headers: { Authorization: `Bearer ${cfg.api_key}` },
    });
    if (!res.ok) {
      return { ok: false, message: `Vapi ${res.status}: ${(await res.text()).slice(0, 200)}` };
    }
    const list = (await res.json()) as Array<{ id: string }>;
    if (cfg.assistant_id && !list.find((a) => a.id === cfg.assistant_id)) {
      return {
        ok: false,
        message: `Assistant-ID ${cfg.assistant_id} nicht im Vapi-Account gefunden`,
      };
    }
    return {
      ok: true,
      message: `${list.length} Assistant(s) im Vapi-Account, ID-Match ok`,
    };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Vapi unreachable" };
  }
};

const testWhatsapp = async (cfg: { api_key?: string; provider?: string }): Promise<TestResult> => {
  if (!cfg.api_key) return { ok: false, message: "API-Key fehlt" };
  try {
    if (cfg.provider === "360dialog" || !cfg.provider) {
      // 360dialog: GET /v1/configs liefert Phone-Number-Status
      const res = await fetch("https://waba-v2.360dialog.io/configs", {
        headers: { "D360-API-KEY": cfg.api_key },
      });
      if (!res.ok) {
        return { ok: false, message: `360dialog ${res.status}: ${(await res.text()).slice(0, 200)}` };
      }
      return { ok: true, message: "360dialog API-Key gültig" };
    }
    return { ok: false, message: `Unbekannter WhatsApp-Provider: ${cfg.provider}` };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "WhatsApp unreachable" };
  }
};

const testResend = async (cfg: { api_key?: string; from_email?: string }): Promise<TestResult> => {
  if (!cfg.api_key) return { ok: false, message: "API-Key fehlt" };
  try {
    const res = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${cfg.api_key}` },
    });
    if (!res.ok) {
      return { ok: false, message: `Resend ${res.status}: ${(await res.text()).slice(0, 200)}` };
    }
    const data = (await res.json()) as { data?: Array<{ name: string; status: string }> };
    const domains = data.data ?? [];
    const verified = domains.filter((d) => d.status === "verified").map((d) => d.name);
    if (cfg.from_email) {
      const fromDomain = cfg.from_email.split("@")[1] ?? "";
      if (!verified.includes(fromDomain)) {
        return {
          ok: false,
          message: `Domain ${fromDomain} bei Resend nicht verifiziert. Verifizierte: ${verified.join(", ") || "keine"}`,
        };
      }
    }
    return {
      ok: true,
      message: `${verified.length} verifizierte Domain(s): ${verified.join(", ") || "—"}`,
    };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Resend unreachable" };
  }
};

const testStripe = async (cfg: { secret_key?: string }): Promise<TestResult> => {
  if (!cfg.secret_key) return { ok: false, message: "Secret-Key fehlt" };
  try {
    const res = await fetch("https://api.stripe.com/v1/account", {
      headers: { Authorization: `Bearer ${cfg.secret_key}` },
    });
    if (!res.ok) {
      return { ok: false, message: `Stripe ${res.status}: ${(await res.text()).slice(0, 200)}` };
    }
    const acc = (await res.json()) as {
      id: string;
      email?: string;
      country?: string;
      details_submitted?: boolean;
      charges_enabled?: boolean;
    };
    if (!acc.charges_enabled) {
      return {
        ok: false,
        message: `Stripe-Account ${acc.id} kann noch keine Zahlungen entgegennehmen (charges_enabled=false)`,
      };
    }
    return {
      ok: true,
      message: `Stripe-Account ${acc.id} (${acc.country?.toUpperCase()}) live + bereit`,
    };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Stripe unreachable" };
  }
};

// =================================================================
// Handler
// =================================================================

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const ctx = await callerContext(req);
    if (!ctx) return respond({ error: "unauthorized" }, 401);
    if (ctx.role !== "owner") {
      return respond({ error: "Nur Owner darf Provider-Test ausführen" }, 403);
    }

    const { provider }: RequestBody = await req.json();
    if (!provider || !["vapi", "whatsapp", "resend", "stripe"].includes(provider)) {
      return respond({ error: "provider muss vapi|whatsapp|resend|stripe sein" }, 400);
    }

    const admin = supabaseAdmin();
    const { data: tenant, error: tErr } = await admin
      .from("tenants")
      .select("provider_config")
      .eq("id", ctx.tenant_id)
      .single();
    if (tErr) throw tErr;
    const cfg = (tenant.provider_config ?? {}) as Record<string, Record<string, unknown>>;
    const providerCfg = cfg[provider] ?? {};

    let result: TestResult;
    switch (provider) {
      case "vapi":
        result = await testVapi(providerCfg as Parameters<typeof testVapi>[0]);
        break;
      case "whatsapp":
        result = await testWhatsapp(providerCfg as Parameters<typeof testWhatsapp>[0]);
        break;
      case "resend":
        result = await testResend(providerCfg as Parameters<typeof testResend>[0]);
        break;
      case "stripe":
        result = await testStripe(providerCfg as Parameters<typeof testStripe>[0]);
        break;
    }

    // Status persistieren
    const updatedCfg = {
      ...cfg,
      [provider]: {
        ...providerCfg,
        last_test_at: new Date().toISOString(),
        last_test_ok: result.ok,
      },
    };
    await admin
      .from("tenants")
      .update({ provider_config: updatedCfg })
      .eq("id", ctx.tenant_id);

    return respond(result, 200);
  } catch (e) {
    console.error("[test-provider]", e);
    return respond({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
