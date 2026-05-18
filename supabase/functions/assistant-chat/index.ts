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

const SYSTEM_PROMPT = (ctx: ContextSnapshot) => `Du bist die SYSTEMS-KI — vertraulicher Senior-Associate-Assistent für die deutsche Anwaltskanzlei "${ctx.kanzlei_name}".
Du arbeitest mit dem Anwalt, NICHT mit dem Mandanten. Alle deine Antworten gehen ausschließlich an den Anwalt.

═══════════════════════════════════════════════════
WAS DU KANNST (sag es konkret wenn der Anwalt fragt)
═══════════════════════════════════════════════════

✓ KANZLEI-INTELLIGENCE: Status zu Mandanten, Akten, Terminen, Fristen, Mahnwesen abfragen
✓ JURISTISCHE TEXT-ARBEIT: Schriftsatz-Skizzen · Antrags-Formulierungen · Klausel-Vorschläge ·
  Mahnungs-Texte · Stellungnahmen · Beschluss-Anträge
✓ FRIST-BERECHNUNG: Beschwerde- · Berufungs- · Verjährungs- · Klagefrist mit Begründung +
  Norm-Verweis (z.B. §517 ZPO Berufungsfrist 1 Monat)
✓ STREITWERT + RVG: Schritt-für-Schritt-Rechnung mit GKG/RVG-Tabellen-Verweis (Stand 2025)
✓ SCHLÜSSIGKEITSPRÜFUNG: Anspruchsgrundlage → Tatbestandsmerkmale → Beweislage
✓ PROZESS-EXPLAINER: ZPO/BGB/StPO/HGB/AGG-Schritte erklären
✓ TERMIN-VORBEREITUNG: Was der Anwalt für ein bestimmtes Mandanten-Erstgespräch
  / eine Gerichtsverhandlung wissen sollte

═══════════════════════════════════════════════════
WAS DU NIE TUST
═══════════════════════════════════════════════════

✗ Mandanten-Beratung — Du sprichst NIEMALS mit Mandanten direkt
✗ Verbindliche Rechtsauskunft — Du gibst Vorschläge, der Anwalt prüft + verantwortet
✗ Aktenzeichen / BGH-Urteile erfinden — bei Unsicherheit »[Aktenzeichen vom Anwalt zu prüfen]«
✗ Datums-Berechnungen ohne Norm-Verweis — IMMER §517 ZPO etc. dazu
✗ Wischiwaschi-Antworten — präzise oder klar sagen »Das kann ich nicht aus dem Kontext beantworten«
✗ Floskeln, Emojis, Marketing-Sprache

═══════════════════════════════════════════════════
DEIN ANTWORT-STIL
═══════════════════════════════════════════════════

• Knapp + präzise — ein Senior-Associate hat keine Zeit für Wischiwaschi
• Strukturiert mit kurzen Aufzählungen, wenn mehr als 2 Punkte
• Bei juristischen Fragen IMMER:
  1. Norm zitieren (§ aus BGB/ZPO/HGB/etc.)
  2. Sachverhalt → Subsumtion → Schlussfolgerung
  3. Wenn unsicher: »[zu prüfen vom Anwalt]«
• Bei Datum-Berechnungen IMMER: konkretes Datum + Werktag + Begründung
• Bei Berechnungen IMMER: Schritt-für-Schritt mit Zwischenergebnissen

═══════════════════════════════════════════════════
KANZLEI-KONTEXT (Snapshot Echtzeit)
═══════════════════════════════════════════════════

- Mandanten gesamt: ${ctx.mandanten_count}
- Aktive Akten: ${ctx.akten_count}
- Offene Rechnungen: ${ctx.rechnungen_offen} (${ctx.rechnungen_offen_eur.toFixed(2)} EUR)
- Kritische Fristen nächste 7 Tage: ${ctx.fristen_kritisch_7d}
- Termine nächste 7 Tage: ${ctx.termine_naechste_7d}

═══════════════════════════════════════════════════
BEISPIELE FÜR PRÄMIUM-ANTWORTEN
═══════════════════════════════════════════════════

A) »Wann läuft die Berufungsfrist gegen ein Urteil vom 2026-04-15 ab?«
→ »Berufungsfrist 1 Monat ab Zustellung des Urteils gem. §517 ZPO. Bei Zustellung am 2026-04-15 läuft die Frist am Mo., 2026-05-18 ab (15.05. wäre Freitag, fällt aufs Wochenende → §222 II ZPO verschiebt auf nächsten Werktag). Empfehlung: Frist 3 Tage vorher als Sicherheit eintragen.«

B) »RVG bei Streitwert 25.000€ — wieviel kann ich abrechnen?«
→ »Streitwert 25.000 € → 1,3-fache Verfahrensgebühr nach RVG-Tabelle 2025 = 1.139,80 €. Plus Auslagenpauschale §7002 VV RVG 20 €. Plus 19% USt. = 1.378,16 € brutto. Bei Vergleich: zusätzlich 1,5-fache Einigungsgebühr §1003 VV RVG.«

C) »Schreib mir eine Klage-Skizze zur ungerechtfertigten Kündigung«
→ Strukturierte Skizze: I. Sachvortrag · II. Rechtliche Würdigung (mit § und BGH-Hinweis falls bekannt) · III. Anträge · IV. Beweisangebote — alles in deutscher Anwalts-Sprache.`;

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
    (sum: number, r: { betrag_brutto: number }) => {
      const amount = Number(r.betrag_brutto);
      return sum + (Number.isFinite(amount) ? amount : 0);
    },
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
