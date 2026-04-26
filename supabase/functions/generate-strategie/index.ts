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
import { complete, tryParseJson } from "../_shared/anthropic.ts";
import { callerContext, supabaseAdmin } from "../_shared/supabase-admin.ts";

interface RequestBody {
  akte_id: string;
  iteration_prompt?: string;
}

interface StrategieSections {
  sachverhalt: string;
  rechtliche_einordnung: string;
  risiken: { titel: string; risiko: "low" | "medium" | "high"; detail: string }[];
  handlungsoptionen: {
    titel: string;
    pros: string[];
    cons: string[];
    empfehlung: boolean;
  }[];
  empfohlene_strategie: string;
  schriftsatz_skizze?: string;
  naechste_schritte: { titel: string; bis: string }[];
}

const SYSTEM_PROMPT = `Du bist ein hochspezialisierter Assistent für deutsche Rechtsanwälte.
Du erstellst strukturierte Anwalts-Strategien auf Basis der Akte und Mandanten-Historie.

ABSOLUTE REGELN:
- Du gibst NIEMALS eine Rechtsberatung an Mandanten. Du berätst nur den Anwalt.
- Du erfindest KEINE konkreten Schadensersatzbeträge, Aktenzeichen oder Rechtsprechung.
- Bei Unsicherheit: schreibe "[zu prüfen]" statt zu raten.
- Du zitierst BGH/BAG-Urteile NUR wenn du das Aktenzeichen sicher kennst.
- Nutze deutsche Rechtssprache: "Mandant", "Anspruch", "Rechtsmittel", etc.

OUTPUT-FORMAT: Liefere ausschließlich JSON in genau diesem Schema:
{
  "sachverhalt": "Knappe Sachverhaltsdarstellung in 2-4 Sätzen.",
  "rechtliche_einordnung": "Welche Normen/Rechtsprechung sind einschlägig? 3-5 Sätze.",
  "risiken": [
    { "titel": "kurz", "risiko": "low|medium|high", "detail": "1-2 Sätze" }
  ],
  "handlungsoptionen": [
    {
      "titel": "Option-Titel",
      "pros": ["Pro 1", "Pro 2"],
      "cons": ["Contra 1"],
      "empfehlung": true
    }
  ],
  "empfohlene_strategie": "Konkrete Handlungsempfehlung in 3-6 Sätzen.",
  "schriftsatz_skizze": "Optional: I. … II. … III. … V. Beweisangebote",
  "naechste_schritte": [
    { "titel": "Was zu tun", "bis": "YYYY-MM-DD" }
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

Erstelle die Strategie als JSON nach Schema.`.trim();

    const llm = await complete({
      tier: "deep", // Opus für komplexe juristische Analyse
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
      max_tokens: 4096,
      temperature: 0.2,
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
        konfidenz: 0.9,
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
