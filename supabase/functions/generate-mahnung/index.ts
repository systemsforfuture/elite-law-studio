// SYSTEMS™ Edge Function — generate-mahnung
//
// Generiert die nächste Mahnstufe für eine offene Rechnung.
// Stufen 1-3: KI generiert juristisch korrekten Mahn-Text mit
// Verzugszinsen, Mahnkosten, Fristen.
// Stufe 4: Vorlage für gerichtliches Mahnverfahren.

import { handleCors, corsHeaders } from "../_shared/cors.ts";
import { complete } from "../_shared/llm.ts";
import { callerContext, supabaseAdmin } from "../_shared/supabase-admin.ts";

interface RequestBody {
  rechnung_id: string;
}

const SYSTEM_PROMPT = `Du bist die SYSTEMS-Mahnwesen-KI für deutsche Anwaltskanzleien.
Du formulierst Mahn-Schreiben juristisch korrekt nach deutschem Recht.

ABSOLUTE REGELN:
- Beträge stehen im Schreiben EXAKT wie übergeben (nicht runden, nicht erfinden).
- Verzugszinsen NUR nach §288 BGB (5% über Basiszinssatz für Verbraucher,
  9% für Unternehmer) — gib den korrekten Hinweis, nicht den errechneten Betrag.
- Mahnkosten: Stufe 1 = 0€ (kostenfrei), Stufe 2 = 5€, Stufe 3 = 10€.
- Anrede: "Sehr geehrte/r Frau/Herr [Name]" wenn Privatperson, sonst Firmenname.

OUTPUT: Reiner Brieftext in deutsch, ohne Markdown, ohne Anrede-Variablen.
Strukturiert in:
- Anrede (eine Zeile)
- Hauptteil (1-3 Absätze je nach Stufe)
- Frist-Setzung
- Schlussformel ("Mit freundlichen Grüßen,\\nIhre Kanzlei")
`;

const stufenPrompts = {
  1: "Höfliche ZAHLUNGSERINNERUNG. Annahme: Mandant hat Rechnung evtl. übersehen. KEINE Mahnkosten. Zahlungsziel +7 Tage. Verzugszinsen NUR andeutungsweise erwähnen.",
  2: "Erste MAHNUNG. Förmlicher. Berechtige Mahnkosten (5€). Verzugszinsen nach §288 BGB werden berechnet. Zahlungsziel +7 Tage.",
  3: "Letzte Mahnung. KLARER Hinweis: bei Nichtzahlung wird gerichtliches Mahnverfahren eingeleitet. Mahnkosten 10€. Zahlungsziel +7 Tage. Klar aber nicht bedrohlich.",
  4: "Übergabe ans gerichtliche Mahnverfahren. Kein Brief mehr — Antrag auf Erlass eines Mahnbescheids. Skizziere kurz: Antragsteller, Antragsgegner, Hauptforderung, Zinsen, Kosten. Im Telegramm-Stil für Vorlage.",
} as const;

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

    const { rechnung_id }: RequestBody = await req.json();
    const admin = supabaseAdmin();

    const { data: rechnung } = await admin
      .from("rechnungen")
      .select("*, mandant:mandanten(*)")
      .eq("id", rechnung_id)
      .eq("tenant_id", ctx.tenant_id)
      .single();
    if (!rechnung) {
      return new Response(JSON.stringify({ error: "Rechnung nicht gefunden" }), {
        status: 404,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    const nextStufe = Math.min((rechnung.mahnstufe ?? 0) + 1, 4) as 1 | 2 | 3 | 4;

    const { data: tenant } = await admin
      .from("tenants")
      .select("kanzlei_name, agent_config")
      .eq("id", ctx.tenant_id)
      .single();

    const mahnCfg = ((tenant?.agent_config ?? {}) as Record<string, {
      status?: string;
      custom_prompt_addition?: string | null;
    }>)["mahnungs_eskalator"];
    if (mahnCfg?.status === "pausiert") {
      return new Response(
        JSON.stringify({ error: "Mahnungs-KI pausiert. Aktivieren unter /dashboard/agenten" }),
        {
          status: 423,
          headers: { ...corsHeaders, "content-type": "application/json" },
        },
      );
    }

    const md = rechnung.mandant;
    const empfaenger = md
      ? md.firmenname
        ? md.firmenname
        : `${md.vorname ?? ""} ${md.nachname ?? ""}`.trim()
      : "Unbekannter Mandant";
    const istUnternehmer = !!md?.firmenname;

    const userPrompt = `
KANZLEI: ${tenant?.kanzlei_name ?? "—"}
MAHN-STUFE: ${nextStufe} (${stufenPrompts[nextStufe]})
EMPFÄNGER: ${empfaenger}${istUnternehmer ? " (Unternehmer)" : " (Verbraucher)"}

RECHNUNG:
- Nummer: ${rechnung.rechnungsnummer}
- Datum: ${rechnung.rechnungsdatum}
- Fällig: ${rechnung.faelligkeit}
- Bruttobetrag: ${rechnung.betrag_brutto}€
${mahnCfg?.custom_prompt_addition ? `\nKANZLEI-SPEZIFISCHE ANWEISUNGEN:\n${mahnCfg.custom_prompt_addition}\n` : ""}

Erstelle den Brieftext.`.trim();

    const llm = await complete({
      task: "mahnung_gen",
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
      tenant_id: ctx.tenant_id,
    });

    // Status der Rechnung anpassen
    const newStatus =
      nextStufe === 1
        ? "mahnung_1"
        : nextStufe === 2
          ? "mahnung_2"
          : nextStufe === 3
            ? "mahnung_3"
            : "gerichtlich";

    const { data: updated, error: upErr } = await admin
      .from("rechnungen")
      .update({
        mahnstufe: nextStufe,
        status: newStatus,
        naechste_aktion_am: new Date(Date.now() + 7 * 86400_000)
          .toISOString()
          .slice(0, 10),
      })
      .eq("id", rechnung_id)
      .select()
      .single();
    if (upErr) throw upErr;

    // Activity-Eintrag
    await admin.from("activities").insert({
      tenant_id: ctx.tenant_id,
      mandant_id: rechnung.mandant_id,
      type: "mahnung_sent",
      actor: "ai",
      actor_name: "SYSTEMS Mahnwesen-KI",
      title: `Mahnung Stufe ${nextStufe} generiert`,
      detail:
        nextStufe === 4
          ? "Vorlage gerichtliches Mahnverfahren erstellt — Anwalt-Review erforderlich."
          : `Brief an ${empfaenger} zur Versendung bereit.`,
    });

    return new Response(
      JSON.stringify({
        rechnung: updated,
        mahn_text: llm.text,
        stufe: nextStufe,
      }),
      { headers: { ...corsHeaders, "content-type": "application/json" } },
    );
  } catch (e) {
    console.error("[generate-mahnung]", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
      {
        status: 500,
        headers: { ...corsHeaders, "content-type": "application/json" },
      },
    );
  }
});
