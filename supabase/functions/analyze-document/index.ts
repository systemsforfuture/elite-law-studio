// SYSTEMS™ Edge Function — analyze-document
//
// Wird nach Upload aufgerufen. Lädt das Dokument aus dem Storage,
// schickt es zur SYSTEMS-KI-Vision, extrahiert strukturierte Daten
// und schreibt sie in dokumente.ai_extracted.

import { handleCors, corsHeaders } from "../_shared/cors.ts";
import { complete, tryParseJson } from "../_shared/anthropic.ts";
import { callerContext, supabaseAdmin } from "../_shared/supabase-admin.ts";

interface RequestBody {
  dokument_id: string;
}

interface AiExtracted {
  dokument_typ: string;
  parteien?: string[];
  kritische_klauseln?: { text: string; risiko: "low" | "medium" | "high" }[];
  fristen?: { titel: string; datum: string }[];
  zusammenfassung: string;
  konfidenz: number;
}

const SYSTEM_PROMPT = `Du bist die SYSTEMS-Dokumenten-KI für deutsche Anwaltskanzleien.
Du analysierst Dokumente (Verträge, Kündigungen, Schriftsätze, Urteile, Mahnungen, etc.)
und extrahierst strukturierte Informationen.

ABSOLUTE REGELN:
- Du erfindest NICHTS. Wenn ein Datum nicht im Dokument steht: nicht angeben.
- Risiko-Bewertung: high = wahrscheinlich rechtsverletzend / nachteilig für Mandant,
  medium = ungewöhnliche/aufmerksamkeitsbedürftige Klausel, low = standard.
- Fristen: nur datum-konkrete Fristen, im Format YYYY-MM-DD.

OUTPUT-FORMAT: Liefere ausschließlich JSON in diesem Schema:
{
  "dokument_typ": "z.B. Kündigungsschreiben fristlos / Mietvertrag / Klageschrift",
  "parteien": ["Name 1 (Rolle)", "Name 2 (Rolle)"],
  "kritische_klauseln": [
    { "text": "Klausel-Zusammenfassung in 1 Satz", "risiko": "low|medium|high" }
  ],
  "fristen": [
    { "titel": "z.B. Kündigungsfrist", "datum": "2026-05-12" }
  ],
  "zusammenfassung": "2-3 Sätze: was ist das, wer macht was, was ist relevant.",
  "konfidenz": 0.0-1.0
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

    const { dokument_id }: RequestBody = await req.json();
    const admin = supabaseAdmin();

    const { data: dok } = await admin
      .from("dokumente")
      .select("*")
      .eq("id", dokument_id)
      .eq("tenant_id", ctx.tenant_id)
      .single();
    if (!dok) {
      return new Response(JSON.stringify({ error: "Dokument nicht gefunden" }), {
        status: 404,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    // Datei aus Storage laden
    const { data: blob, error: dlErr } = await admin.storage
      .from("tenant-files")
      .download(dok.storage_path);
    if (dlErr || !blob) {
      return new Response(
        JSON.stringify({ error: "Datei konnte nicht geladen werden" }),
        {
          status: 500,
          headers: { ...corsHeaders, "content-type": "application/json" },
        },
      );
    }

    // Base64-Encode für Vision/PDF-API
    const buf = new Uint8Array(await blob.arrayBuffer());
    let base64 = "";
    const CHUNK = 0x8000;
    for (let i = 0; i < buf.length; i += CHUNK) {
      base64 += String.fromCharCode(...buf.subarray(i, i + CHUNK));
    }
    base64 = btoa(base64);

    const isPdf = (dok.mime_type ?? "").includes("pdf");
    const isImage = (dok.mime_type ?? "").startsWith("image/");
    if (!isPdf && !isImage) {
      return new Response(
        JSON.stringify({
          error: `Mime-Type ${dok.mime_type} wird nicht unterstützt (nur PDF/Image)`,
        }),
        {
          status: 415,
          headers: { ...corsHeaders, "content-type": "application/json" },
        },
      );
    }

    // Anthropic erwartet content-array mit document/image-block
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      // Mock-Mode: kein Key → nutze Standard-complete (gibt Mock-Text)
      const mock = await complete({
        tier: "balanced",
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `Dateiname: ${dok.dateiname}. Bitte analysieren.`,
          },
        ],
        max_tokens: 1024,
      });
      return new Response(
        JSON.stringify({
          ai_extracted: tryParseJson<AiExtracted>(mock.text) ?? {
            dokument_typ: "Mock — KI nicht konfiguriert",
            zusammenfassung:
              "ANTHROPIC_API_KEY fehlt in Edge Function Secrets.",
            konfidenz: 0,
          },
          mock: true,
        }),
        { headers: { ...corsHeaders, "content-type": "application/json" } },
      );
    }

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 2048,
        temperature: 0.1,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: [
              {
                type: isPdf ? "document" : "image",
                source: {
                  type: "base64",
                  media_type: dok.mime_type,
                  data: base64,
                },
              },
              {
                type: "text",
                text: `Datei: ${dok.dateiname}. Analysiere und gib JSON nach Schema zurück.`,
              },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Anthropic ${res.status}: ${txt.slice(0, 300)}`);
    }
    const apiData = await res.json();
    const text =
      apiData.content?.map((c: { text?: string }) => c.text ?? "").join("") ??
      "";

    const ai_extracted = tryParseJson<AiExtracted>(text);
    if (!ai_extracted) {
      throw new Error("KI lieferte ungültigen JSON");
    }

    // In dokumente speichern
    const { error: upErr } = await admin
      .from("dokumente")
      .update({
        ai_extracted,
        status: "ki_analysiert",
      })
      .eq("id", dokument_id);
    if (upErr) throw upErr;

    // Activity-Eintrag
    if (dok.mandant_id || dok.akte_id) {
      await admin.from("activities").insert({
        tenant_id: ctx.tenant_id,
        mandant_id: dok.mandant_id,
        akte_id: dok.akte_id,
        type: "document_analyzed",
        actor: "ai",
        actor_name: "SYSTEMS Dokumenten-KI",
        title: "KI-Analyse abgeschlossen",
        detail: ai_extracted.zusammenfassung,
      });
    }

    return new Response(JSON.stringify({ ai_extracted }), {
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  } catch (e) {
    console.error("[analyze-document]", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
      {
        status: 500,
        headers: { ...corsHeaders, "content-type": "application/json" },
      },
    );
  }
});
