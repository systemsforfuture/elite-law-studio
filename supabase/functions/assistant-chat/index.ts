// SYSTEMS™ Edge Function — assistant-chat
//
// Floating Anwalts-KI-Assistent. Nimmt eine Nachricht + Konversations-Historie
// entgegen, lädt Tenant-Kontext (Mandanten, Akten, Termine zusammenfassend)
// und ruft Claude (Sonnet) für eine kontextsensitive Antwort.
//
// Sicherheit: Authentifizierung über Caller-JWT, RLS sorgt für Tenant-Scope.

import { handleCors, corsHeaders } from "../_shared/cors.ts";
import { complete } from "../_shared/llm.ts";
import { callerContext, supabaseAdmin } from "../_shared/supabase-admin.ts";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface RequestBody {
  message: string;
  history?: ChatMessage[];
}

interface ContextSnapshot {
  kanzlei_name: string;
  mandanten_count: number;
  akten_count: number;
  rechnungen_offen: number;
  rechnungen_offen_eur: number;
  fristen_kritisch_7d: number;
  termine_naechste_7d: number;
}

const SYSTEM_PROMPT = (ctx: ContextSnapshot) => `Du bist die SYSTEMS-KI, ein vertraulicher Assistent für die deutsche Anwaltskanzlei "${ctx.kanzlei_name}".

DEINE AUFGABE:
- Beantworte Fragen über den aktuellen Kanzlei-Stand (Mandanten, Akten, Termine, Mahnwesen, Personal)
- Hilf mit Rechnungsentwürfen, Schriftsatz-Skizzen, Fristberechnung, Schlüssigkeitsprüfung
- Erkläre prozessuale Schritte (ZPO, BGB, RVG)
- Bleib höflich und präzise, keine Floskeln, keine Emojis

KANZLEI-KONTEXT (gerade jetzt):
- Mandanten gesamt: ${ctx.mandanten_count}
- Aktive Akten: ${ctx.akten_count}
- Offene Rechnungen: ${ctx.rechnungen_offen} (${ctx.rechnungen_offen_eur.toFixed(2)} EUR)
- Kritische Fristen nächste 7 Tage: ${ctx.fristen_kritisch_7d}
- Termine nächste 7 Tage: ${ctx.termine_naechste_7d}

WICHTIG:
- Bei Anwaltlicher Sachberatung an Mandanten → IMMER an Anwalt verweisen, nicht selbst beraten
- Bei Berechnungen RVG/Streitwert: Schritt für Schritt rechnen
- Bei Fristen: Datum + Begründung + Quelle
- Wenn du etwas nicht wissen kannst (z.B. Inhalt einer konkreten Akte), sag es klar`;

const buildContext = async (
  client: ReturnType<typeof supabaseAdmin>,
  tenantId: string,
): Promise<ContextSnapshot> => {
  const today = new Date().toISOString().slice(0, 10);
  const in7d = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

  const [tenant, mandanten, akten, rechnungen, termine] = await Promise.all([
    client.from("tenants").select("kanzlei_name").eq("id", tenantId).maybeSingle(),
    client.from("mandanten").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId),
    client.from("akten").select("fristen", { count: "exact" }).eq("tenant_id", tenantId).neq("stufe", "abschluss"),
    client.from("rechnungen").select("betrag_brutto, status").eq("tenant_id", tenantId).neq("status", "bezahlt"),
    client.from("termine").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId).gte("start_at", today).lte("start_at", in7d),
  ]);

  type FristenRow = { fristen: { kritisch: boolean; datum: string }[] | null };
  const kritisch = ((akten.data ?? []) as FristenRow[]).flatMap((a) =>
    (a.fristen ?? []).filter((f) => f.kritisch && f.datum >= today && f.datum <= in7d),
  ).length;

  const rechnungen_offen_eur = (rechnungen.data ?? []).reduce(
    (sum: number, r: { betrag_brutto: number }) => sum + (Number(r.betrag_brutto) ?? 0),
    0,
  );

  return {
    kanzlei_name: tenant.data?.kanzlei_name ?? "Ihre Kanzlei",
    mandanten_count: mandanten.count ?? 0,
    akten_count: akten.count ?? 0,
    rechnungen_offen: rechnungen.data?.length ?? 0,
    rechnungen_offen_eur,
    fristen_kritisch_7d: kritisch,
    termine_naechste_7d: termine.count ?? 0,
  };
};

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const caller = await callerContext(req);
    if (!caller) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    const body = (await req.json()) as RequestBody;
    if (!body.message?.trim()) {
      return new Response(JSON.stringify({ error: "message required" }), {
        status: 400,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    const client = supabaseAdmin();
    const ctx = await buildContext(client, caller.tenant_id);

    const history = (body.history ?? []).slice(-10);
    const messages = [
      ...history,
      { role: "user" as const, content: body.message },
    ];

    const result = await complete({
      task: "assistant_chat",
      system: SYSTEM_PROMPT(ctx),
      messages,
      tenant_id: caller.tenant_id,
      max_tokens: 1024,
      temperature: 0.4,
    });

    return new Response(
      JSON.stringify({
        reply: result.text,
        context: ctx,
        usage: {
          input_tokens: result.input_tokens,
          output_tokens: result.output_tokens,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "content-type": "application/json" },
      },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    console.error("[assistant-chat]", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }
});
