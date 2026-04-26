// SYSTEMS™ Edge Function — triage-inbox
//
// Kategorisiert eingehende Email/WhatsApp und schlägt eine Antwort vor.
// Wird vom Frontend aufgerufen wenn der User eine Konversation öffnet
// und einen KI-Vorschlag haben will.

import { handleCors, corsHeaders } from "../_shared/cors.ts";
import { complete, tryParseJson } from "../_shared/anthropic.ts";
import { callerContext, supabaseAdmin } from "../_shared/supabase-admin.ts";

interface RequestBody {
  konversation_id: string;
}

interface TriageResult {
  kategorie:
    | "mandantenanfrage"
    | "behoerde"
    | "werbung"
    | "spam"
    | "internes";
  intent: string;
  konfidenz: number;
  eskalation_noetig: boolean;
  eskalation_grund?: string;
  antwort_vorschlag: string;
}

const SYSTEM_PROMPT = `Du bist die SYSTEMS-KI für eingehende Mandanten-Kommunikation einer Anwaltskanzlei.

DEINE AUFGABE:
- Kategorisiere die Nachricht (mandantenanfrage / behoerde / werbung / spam / internes)
- Erkenne den Intent (z.B. termin_buchen, frist_anfrage, dokument_nachreichen, …)
- Entscheide: Selbst antworten oder an Anwalt eskalieren?
- Wenn du selbst antwortest: höflich, knapp, mit Tonalität der Kanzlei (formal/freundlich/empathisch)

ESKALATIONS-REGELN:
- Juristische Sachfragen → IMMER eskalieren
- Konkrete Beratung zu laufender Akte → IMMER eskalieren
- Notfall-Stichworte ("dringend", "Verhaftung", "Frist heute") → IMMER eskalieren
- Termine, Standardanfragen, Dokument-Eingang bestätigen → selbst antworten

OUTPUT: NUR JSON in genau diesem Schema:
{
  "kategorie": "mandantenanfrage|behoerde|werbung|spam|internes",
  "intent": "kurz_beschreibend",
  "konfidenz": 0.0-1.0,
  "eskalation_noetig": true|false,
  "eskalation_grund": "1 Satz wenn eskalation_noetig=true",
  "antwort_vorschlag": "Vorschlag in 2-5 Sätzen, Briefform"
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

    const { konversation_id }: RequestBody = await req.json();
    const admin = supabaseAdmin();

    const { data: konv } = await admin
      .from("konversationen")
      .select("*, mandant:mandanten(*)")
      .eq("id", konversation_id)
      .eq("tenant_id", ctx.tenant_id)
      .single();
    if (!konv) {
      return new Response(JSON.stringify({ error: "Konversation nicht gefunden" }), {
        status: 404,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    const { data: tenant } = await admin
      .from("tenants")
      .select("kanzlei_name, branding_config, rechtsgebiete")
      .eq("id", ctx.tenant_id)
      .single();

    const tonalitaet = (tenant?.branding_config as { tonalitaet?: string })
      ?.tonalitaet ?? "freundlich";

    const userPrompt = `
KANZLEI: ${tenant?.kanzlei_name ?? "—"}
TONALITÄT: ${tonalitaet}
RECHTSGEBIETE: ${(tenant?.rechtsgebiete ?? []).join(", ")}

MANDANT: ${
      konv.mandant
        ? `${konv.mandant.vorname ?? ""} ${konv.mandant.nachname ?? ""}`.trim() ||
          konv.mandant.firmenname ||
          "Unbekannt"
        : "Unbekannt"
    }
KANAL: ${konv.kanal}
${konv.betreff ? `BETREFF: ${konv.betreff}\n` : ""}NACHRICHT:
${konv.inhalt ?? konv.preview ?? ""}

Triage und Antwortvorschlag als JSON.`.trim();

    const llm = await complete({
      tier: "balanced",
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
      max_tokens: 1024,
      temperature: 0.4,
    });

    const result = tryParseJson<TriageResult>(llm.text);
    if (!result) {
      return new Response(
        JSON.stringify({
          error: "KI lieferte ungültigen JSON",
          raw: llm.text.slice(0, 300),
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "content-type": "application/json" },
        },
      );
    }

    return new Response(JSON.stringify({ result, usage: { input_tokens: llm.input_tokens, output_tokens: llm.output_tokens } }), {
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  } catch (e) {
    console.error("[triage-inbox]", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
      {
        status: 500,
        headers: { ...corsHeaders, "content-type": "application/json" },
      },
    );
  }
});
