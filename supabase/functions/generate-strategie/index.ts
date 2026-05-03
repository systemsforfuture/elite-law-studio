// SYSTEMS™ Edge Function — generate-strategie
//
// Generiert eine Anwalts-Strategie für eine Akte. Pulls relevant context
// aus der DB (Akte, Mandant, Dokumente), ruft die SYSTEMS-KI auf,
// strukturiert das Ergebnis und persistiert eine neue Strategie-Version.
//
// Aufruf vom Frontend:
//   const { data } = await supabase.functions.invoke('generate-strategie', {
//     body: { akte_id, iteration_prompt? }
//   });

import { handleCors, corsHeaders } from "../_shared/cors.ts";
import { complete, tryParseJson } from "../_shared/llm.ts";
import { callerContext, supabaseAdmin } from "../_shared/supabase-admin.ts";

interface RequestBody {
  akte_id: string;
  iteration_prompt?: string;
}

interface StrategieSections {
  sachverhalt: string;
  rechtliche_einordnung: string;
  anspruchsgrundlagen: {
    norm: string;
    tatbestand_check: string;
    erfuellt: "ja" | "teilweise" | "nein" | "zu_pruefen";
  }[];
  verjaehrung: {
    relevant: boolean;
    frist: string;
    laeuft_ab: string;
    beweis_status: string;
  };
  beweislage: { faktum: string; beweismittel: string; status: "vorhanden" | "fehlt" | "schwach" }[];
  risiken: { titel: string; risiko: "low" | "medium" | "high"; detail: string }[];
  handlungsoptionen: {
    titel: string;
    pros: string[];
    cons: string[];
    erfolgsaussicht_pct: number;
    geschaetzte_dauer: string;
    geschaetzte_kosten: string;
    empfehlung: boolean;
  }[];
  empfohlene_strategie: string;
  schriftsatz_skizze?: string;
  naechste_schritte: { titel: string; bis: string; prioritaet: "hoch" | "normal" | "niedrig" }[];
  konfidenz: number;
  offene_fragen_an_mandant: string[];
}

const SYSTEM_PROMPT = `Du bist die Strategie-KI für deutsche Rechtsanwälte — auf dem Niveau eines erfahrenen Senior-Associates einer Top-Wirtschaftskanzlei.
Du erstellst keine Mandanten-Beratung, sondern interne Anwalts-Strategien zur Unterstützung der finalen Entscheidung des Anwalts.

═══════════════════════════════════════════════════
DEINE METHODIK — JURISTISCHE SUBSUMTION (5 SCHRITTE)
═══════════════════════════════════════════════════

1. SACHVERHALT erfassen
   - Was ist passiert? Wer? Wann? Wo?
   - Trenne Fakten (gesichert) von Behauptungen (zu beweisen).

2. ANSPRUCHSGRUNDLAGEN identifizieren
   - Welche Normen kommen in Frage? (z.B. §433 BGB, §823 BGB, §242 BGB)
   - Pro Norm: alle Tatbestandsmerkmale durchgehen (»Tatbestand-Check«)
   - Bewertung: erfüllt / teilweise / nein / zu_pruefen
   - WICHTIG: nenne NUR Normen die du sicher kennst. Bei Unsicherheit »[zu prüfen — Norm-Recherche durch Anwalt]«

3. VERJÄHRUNG IMMER PRÜFEN — das ist Pflicht
   - Regelmäßig 3 Jahre §195 BGB · Hemmung durch Verhandlungen §203 BGB · Sonderfristen
   - Konkretes Datum berechnen: »Anspruch verjährt am [YYYY-MM-DD]«
   - Wenn unklar: »Verjährungsbeginn unklar — Mandant zur Kenntnisnahme befragen«

4. BEWEISLAGE realistisch einschätzen
   - Pro Faktum: Welches Beweismittel? Vorhanden / fehlt / schwach?
   - Beweislücken EXPLIZIT benennen — sie sind der häufigste Klage-Killer

5. STRATEGIE-PFADE durchspielen — mindestens 2 Optionen
   - Außergerichtliche Einigung · gerichtliches Mahnverfahren · Zivilklage · Strafanzeige · Mediation · Schlichtung
   - Pro Option: Erfolgsaussicht in %, geschätzte Dauer, geschätzte Kosten
   - Erfolgsaussicht-Quantifizierung: niedrig <30%, mittel 30-70%, hoch >70%

═══════════════════════════════════════════════════
ABSOLUTE GUARDRAILS
═══════════════════════════════════════════════════

✓ Du berätst NIE den Mandanten direkt — nur den Anwalt
✓ Du erfindest KEINE Aktenzeichen, BGH/BAG-Urteile, oder konkrete Schadensbeträge
✓ Bei Unsicherheit IMMER »[zu prüfen]« statt zu raten
✓ Du zitierst BGH/BAG NUR wenn du das Aktenzeichen mit voller Sicherheit kennst — sonst »einschlägige BGH-Rechtsprechung [Aktenzeichen vom Anwalt zu ergänzen]«
✓ Du nutzt deutsche Rechtssprache: »Mandant«, »Anspruch«, »Rechtsmittel«, »Tatbestandsmerkmal«, »Subsumtion«, »Erfolgsaussicht«
✓ Konfidenz: gib eine ehrliche Selbst-Einschätzung (0.0-1.0). Hohe Werte nur wenn alle 5 Schritte solide durchgeführt sind und keine kritische Frage offen ist
✓ Offene Fragen an den Mandant: liste was zur finalen Strategie noch geklärt werden muss

═══════════════════════════════════════════════════
OUTPUT — REINES JSON IN GENAU DIESEM SCHEMA
═══════════════════════════════════════════════════

{
  "sachverhalt": "2-4 Sätze, Fakten von Behauptungen trennend",
  "rechtliche_einordnung": "Welche Rechtsgebiete + zentrale Normen + warum sie einschlägig sind. 3-6 Sätze.",
  "anspruchsgrundlagen": [
    {
      "norm": "§433 BGB",
      "tatbestand_check": "Kaufvertrag geschlossen [ja] · Mandant hat Sache übergeben [unklar] · Käufer hat nicht gezahlt [ja]",
      "erfuellt": "teilweise"
    }
  ],
  "verjaehrung": {
    "relevant": true,
    "frist": "Regelverjährung 3 Jahre, §195 BGB",
    "laeuft_ab": "2027-12-31",
    "beweis_status": "Vertragsdatum aus Akte ersichtlich, Verjährungsbeginn klar"
  },
  "beweislage": [
    { "faktum": "Vertragsschluss", "beweismittel": "Kaufvertrag liegt unterzeichnet vor", "status": "vorhanden" },
    { "faktum": "Übergabe der Sache", "beweismittel": "Keine Quittung, nur mündliche Aussage", "status": "schwach" }
  ],
  "risiken": [
    { "titel": "Beweislücke Übergabe", "risiko": "high", "detail": "Ohne Übergabebeleg muss Mandant Beweis durch Zeugen anbieten — Erfolg unsicher." }
  ],
  "handlungsoptionen": [
    {
      "titel": "Außergerichtliche Zahlungsaufforderung mit Frist",
      "pros": ["Schnell, kostengünstig", "Erhält Verhandlungsraum"],
      "cons": ["Erfolg vom guten Willen abhängig"],
      "erfolgsaussicht_pct": 60,
      "geschaetzte_dauer": "2-4 Wochen",
      "geschaetzte_kosten": "150-300 €",
      "empfehlung": true
    }
  ],
  "empfohlene_strategie": "3-6 Sätze: konkrete Empfehlung mit Begründung warum gerade diese Option.",
  "schriftsatz_skizze": "Optional: I. Sachvortrag … II. Rechtliche Würdigung … III. Anträge … IV. Beweisangebote",
  "naechste_schritte": [
    { "titel": "Mandant zur Übergabe befragen", "bis": "2026-05-15", "prioritaet": "hoch" }
  ],
  "konfidenz": 0.75,
  "offene_fragen_an_mandant": [
    "Gibt es Zeugen für die Übergabe der Sache?",
    "Wann genau wurde die Zahlung schriftlich angemahnt?"
  ]
}`;

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

    const { akte_id, iteration_prompt }: RequestBody = await req.json();
    if (!akte_id) {
      return new Response(JSON.stringify({ error: "akte_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    const admin = supabaseAdmin();

    // Tenant-isolated context
    const { data: akte } = await admin
      .from("akten")
      .select("*, mandant:mandanten(*)")
      .eq("id", akte_id)
      .eq("tenant_id", ctx.tenant_id)
      .single();
    if (!akte) {
      return new Response(JSON.stringify({ error: "Akte nicht gefunden" }), {
        status: 404,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    const { data: docs } = await admin
      .from("dokumente")
      .select("dateiname, ai_extracted")
      .eq("akte_id", akte_id)
      .eq("tenant_id", ctx.tenant_id)
      .limit(20);

    const { data: prevVersion } = await admin
      .from("anwalts_strategien")
      .select("version, sections")
      .eq("akte_id", akte_id)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Tenant agent_config für custom_prompt_addition
    const { data: tenantData } = await admin
      .from("tenants")
      .select("agent_config")
      .eq("id", ctx.tenant_id)
      .single();
    // Eigener Slot für die Strategie-KI — vorher fälschlich an dokumenten_analyst
    // gekoppelt, was bedeutete dass Pause der Dokumenten-Analyse auch die
    // Strategie-Generation blockiert. Fallback auf undefined wenn kein Eintrag.
    const stratCfg = ((tenantData?.agent_config ?? {}) as Record<string, {
      status?: string;
      custom_prompt_addition?: string | null;
    }>)["strategie_assistant"];
    if (stratCfg?.status === "pausiert") {
      return new Response(
        JSON.stringify({ error: "Strategie-KI ist für diese Kanzlei pausiert" }),
        {
          status: 423,
          headers: { ...corsHeaders, "content-type": "application/json" },
        },
      );
    }
    const customAddition = stratCfg?.custom_prompt_addition ?? "";

    const userPrompt = `
KONTEXT:
Akte: ${akte.titel} (${akte.aktenzeichen})
Rechtsgebiet: ${akte.rechtsgebiet}
Streitwert: ${akte.streitwert_eur ?? "—"}€
Stufe: ${akte.stufe}

BESCHREIBUNG:
${akte.beschreibung ?? "Keine Beschreibung"}

DOKUMENTE (KI-Auszug):
${
      docs
        ?.map(
          (d) =>
            `- ${d.dateiname}: ${
              d.ai_extracted ? JSON.stringify(d.ai_extracted).slice(0, 300) : "noch nicht analysiert"
            }`,
        )
        .join("\n") ?? "Keine Dokumente"
    }

${
      prevVersion
        ? `VORHERIGE VERSION (v${prevVersion.version}):\n${JSON.stringify(prevVersion.sections).slice(0, 1500)}\n`
        : ""
    }
${iteration_prompt ? `\nANPASSUNGSWUNSCH: ${iteration_prompt}\n` : ""}
${customAddition ? `\nKANZLEI-SPEZIFISCHE ANWEISUNGEN:\n${customAddition}\n` : ""}

Erstelle die Strategie als JSON nach Schema.`.trim();

    const llm = await complete({
      task: "strategy_gen",
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
      tenant_id: ctx.tenant_id,
    });

    const sections = tryParseJson<StrategieSections>(llm.text);
    if (!sections) {
      return new Response(
        JSON.stringify({
          error: "KI lieferte ungültigen JSON-Output",
          raw: llm.text.slice(0, 500),
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "content-type": "application/json" },
        },
      );
    }

    const nextVersion = (prevVersion?.version ?? 0) + 1;

    const { data: inserted, error } = await admin
      .from("anwalts_strategien")
      .insert({
        tenant_id: ctx.tenant_id,
        akte_id,
        version: nextVersion,
        status: "review",
        generated_by: "ai",
        modell: "SYSTEMS Strategie-KI",
        // Konfidenz aus dem KI-Output statt hardcoded — die KI weiß selbst
        // am besten ob alle 5 Subsumtions-Schritte solide durchgeführt wurden
        konfidenz: typeof sections.konfidenz === "number" && sections.konfidenz >= 0 && sections.konfidenz <= 1
          ? sections.konfidenz
          : 0.7,
        sections,
        iteration_prompt,
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({
        strategie: inserted,
        usage: {
          input_tokens: llm.input_tokens,
          output_tokens: llm.output_tokens,
        },
      }),
      {
        headers: { ...corsHeaders, "content-type": "application/json" },
      },
    );
  } catch (e) {
    console.error("[generate-strategie]", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : String(e),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "content-type": "application/json" },
      },
    );
  }
});
