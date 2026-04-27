// SYSTEMS™ Edge Function — verify-email-domain
//
// Plattform-Managed: legt via Resend-Plattform-Account die Custom-Domain
// der Kanzlei an, gibt DNS-Records zurück. Bei action="poll" prüft sie
// den Verify-Status.
//
// Resend-Provider wird VOR dem User versteckt — User sieht "SYSTEMS-DNS".

import { handleCors, corsHeaders } from "../_shared/cors.ts";
import { callerContext, supabaseAdmin } from "../_shared/supabase-admin.ts";

interface RequestBody {
  custom_domain?: string;
  from_email?: string;
  action?: "setup" | "poll";
}

interface DnsRecord {
  type: "TXT" | "MX" | "CNAME";
  name: string;
  value: string;
  ttl?: number;
}

const respond = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json" },
  });

const fetchResendDomain = async (
  apiKey: string,
  domainId: string,
): Promise<{ status: string; records?: DnsRecord[] } | null> => {
  const res = await fetch(`https://api.resend.com/domains/${domainId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    status: string;
    records?: Array<{ record: string; name: string; type: string; value: string; ttl?: number }>;
  };
  return {
    status: data.status,
    records: (data.records ?? []).map((r) => ({
      type: r.type as DnsRecord["type"],
      name: r.name,
      value: r.value,
      ttl: r.ttl,
    })),
  };
};

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const ctx = await callerContext(req);
    if (!ctx) return respond({ error: "unauthorized" }, 401);
    if (ctx.role !== "owner") {
      return respond({ error: "Nur Owner darf E-Mail einrichten" }, 403);
    }

    const body: RequestBody = await req.json();
    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) {
      return respond(
        { ok: false, message: "E-Mail-Plattform noch nicht eingerichtet." },
        503,
      );
    }

    const admin = supabaseAdmin();
    const { data: tenant } = await admin
      .from("tenants")
      .select("provider_config")
      .eq("id", ctx.tenant_id)
      .single();
    const baseCfg = (tenant?.provider_config ?? {}) as Record<string, Record<string, unknown>>;
    const emailCfg = (baseCfg.email ?? {}) as Record<string, unknown>;

    // ===== Action: poll =====
    if (body.action === "poll") {
      const domainId = emailCfg.resend_domain_id as string | undefined;
      if (!domainId) {
        return respond({ ok: false, message: "Domain noch nicht angelegt." });
      }
      const status = await fetchResendDomain(apiKey, domainId);
      if (!status) return respond({ ok: false, message: "Konnte Status nicht laden" });
      const verified = status.status === "verified";
      const newCfg = {
        ...baseCfg,
        email: {
          ...emailCfg,
          enabled: verified,
          verification_status: verified ? "verified" : "pending",
          verified_at: verified ? new Date().toISOString() : emailCfg.verified_at ?? null,
          dns_records: status.records ?? emailCfg.dns_records,
        },
      };
      await admin
        .from("tenants")
        .update({ provider_config: newCfg })
        .eq("id", ctx.tenant_id);
      return respond({
        ok: true,
        verification_status: verified ? "verified" : "pending",
        dns_records: status.records,
        message: verified ? "Domain verifiziert" : "Noch nicht verifiziert",
      });
    }

    // ===== Action: setup (default) =====
    if (!body.custom_domain) {
      return respond({ ok: false, message: "custom_domain erforderlich" }, 400);
    }

    // Domain bei Resend anlegen
    const createRes = await fetch("https://api.resend.com/domains", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ name: body.custom_domain }),
    });

    if (!createRes.ok) {
      const errBody = await createRes.text();
      console.error("[verify-email-domain] Resend error:", errBody.slice(0, 500));
      return respond(
        {
          ok: false,
          message: `Domain-Anlage fehlgeschlagen (${createRes.status}). Möglicherweise existiert die Domain schon.`,
        },
        502,
      );
    }

    const created = (await createRes.json()) as {
      id: string;
      records?: Array<{ name: string; type: string; value: string; ttl?: number }>;
    };

    const dnsRecords: DnsRecord[] = (created.records ?? []).map((r) => ({
      type: r.type as DnsRecord["type"],
      name: r.name,
      value: r.value,
      ttl: r.ttl,
    }));

    const updatedCfg = {
      ...baseCfg,
      email: {
        ...emailCfg,
        custom_domain: body.custom_domain,
        from_email: body.from_email ?? null,
        verification_status: "pending",
        dns_records: dnsRecords,
        resend_domain_id: created.id,
      },
    };

    await admin
      .from("tenants")
      .update({ provider_config: updatedCfg, domain: body.custom_domain })
      .eq("id", ctx.tenant_id);

    await admin.from("audit_log").insert({
      tenant_id: ctx.tenant_id,
      user_id: ctx.id,
      action: "create",
      entity_type: "email_domain",
      details: `Domain ${body.custom_domain} angelegt — DNS-Verify ausstehend`,
    });

    return respond({
      ok: true,
      verification_status: "pending",
      dns_records: dnsRecords,
      message: "DNS-Einträge bei deinem Provider eintragen.",
    });
  } catch (e) {
    console.error("[verify-email-domain]", e);
    return respond({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
