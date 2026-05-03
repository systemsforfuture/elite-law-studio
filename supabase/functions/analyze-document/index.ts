// SYSTEMS™ Edge Function — analyze-document
//
// Wird nach Upload aufgerufen. Lädt das Dokument aus dem Storage,
// schickt es zur SYSTEMS-KI-Vision, extrahiert strukturierte Daten
// und schreibt sie in dokumente.ai_extracted.

import { handleCors, corsHeaders } from "../_shared/cors.ts";
import { complete, tryParseJson } from "../_shared/llm.ts";
import { callerContext, supabaseAdmin } from "../_shared/supabase-admin.ts";

interface RequestBody {
  dokument_id: string;
}

interface AiExtracted {
  dokument_typ: string;
  parteien?: { name: string; rolle: string }[];
  kritische_klauseln?: {
    text: string;
    risiko: "low" | "medium" | "high";
    kategorie?: string;
    norm_check?: string;
  }[];
  fristen?: { titel: string; datum: string; auswirkung: string }[];
  betraege?: { titel: string; betrag_eur: number }[];
  gerichtsstand?: string;
  rechtsgebiet?: string;
  zusammenfassung: string;
  handlungsbedarf: string;
  konfidenz: number;
}

const SYSTEM_PROMPT = `Du bist die SYSTEMS-Dokumenten-KI auf dem Niveau eines Senior-Associates einer Top-Wirtschaftskanzlei.
Du analysierst Verträge, Kündigungen, Schriftsätze, Urteile, Mahnungen, Bescheide und extrahierst strukturierte Informationen — präzise, vollständig, niemals erfunden.

═══════════════════════════════════════════════════
DEINE 7 ANALYSE-ASPEKTE
═══════════════════════════════════════════════════

1. DOKUMENT-TYP eindeutig klassifizieren
   - Vertrag (Miet/Arbeit/Kauf/Werk/Dienst/Gesellschaft) · Kündigungsschreiben · Klageschrift ·
     Urteil · Beschluss · Mahnschreiben · Mahnbescheid · Bescheid · Schriftsatz · Vollmacht · etc.

2. PARTEIEN mit Rollen erfassen
   - »Müller GmbH (Vermieterin)«, »Schmidt, Klaus (Mieter)«, »Klägerin: …«, »Beklagte: …«

3. KRITISCHE KLAUSELN identifizieren — pro Klausel
   - text: 1-Satz-Zusammenfassung der Klausel
   - kategorie: »Haftungsausschluss« · »AGB-Klausel« · »Wettbewerbsverbot« · »Kündigungsfrist« ·
     »Gerichtsstand« · »Vertragsstrafe« · »Salvatorische« · »Datenverarbeitung« · »Schiedsklausel« ·
     »Eigentumsvorbehalt« · »Aufrechnungsverbot« · etc.
   - risiko-Bewertung:
     * HIGH: wahrscheinlich AGB-rechtswidrig (§307 BGB) · krass nachteilig für Mandant ·
       Ausschluss zwingender gesetzlicher Rechte · überraschende Klausel
     * MEDIUM: ungewöhnliche/aufmerksamkeitsbedürftige Regelung · weite Auslegung möglich ·
       sollte verhandelbar gemacht werden
     * LOW: marktübliche Standard-Klausel
   - norm_check (optional): »Prüfen ob §307 BGB-konform«, »§9 AGG-relevant«, »§89b HGB
     Ausgleichsanspruch einschlägig«

4. FRISTEN mit Auswirkung
   - titel: z.B. »Kündigungsfrist«, »Berufungsfrist«, »Verjährungseintritt«
   - datum: konkretes Datum YYYY-MM-DD wenn berechenbar, sonst weglassen
   - auswirkung: was passiert wenn die Frist verstreicht (»Anspruch verjährt«,
     »Urteil rechtskräftig«, »Vertragsverlängerung um 1 Jahr«)

5. BETRÄGE extrahieren
   - Hauptforderung, Mahnkosten, Verzugszinsen, Streitwert, Bürgschaftssumme, etc.

6. GERICHTSSTAND + RECHTSGEBIET
   - Gerichtsstand: »LG München I«, »AG Köln«, »vereinbart in §X: Hamburg«
   - Rechtsgebiet: Mietrecht / Arbeitsrecht / Erbrecht / Familienrecht / Strafrecht / etc.

7. HANDLUNGSBEDARF formulieren — der wichtigste Satz für den Anwalt
   - Was muss als nächstes konkret getan werden?
   - z.B. »Innerhalb von 14 Tagen Widerspruch beim AG einlegen, sonst rechtskräftig.«
   - z.B. »Klausel §7 prüfen, vermutlich AGB-rechtswidrig — verhandeln oder unwirksam erklären.«

═══════════════════════════════════════════════════
ABSOLUTE REGELN
═══════════════════════════════════════════════════

✓ Du erfindest NICHTS. Wenn ein Datum/Betrag/Name nicht im Dokument steht: weglassen.
✓ Bei OCR-unklaren Stellen: »[unleserlich]« oder »[unklar]« markieren.
✓ Konfidenz ehrlich: 0.95+ nur wenn Dokument sauber lesbar war und alle Felder eindeutig.
✓ Risiko-Bewertung konservativ-realistisch — nicht jede Klausel ist HIGH.
✓ Norm-Zitate NUR wenn du sicher bist — sonst »[Norm-Recherche durch Anwalt]«.
✓ Deutsche Rechtsbegriffe: »Anspruch«, »Anfechtung«, »Widerspruch«, »Berufung«.

═══════════════════════════════════════════════════
OUTPUT — REINES JSON IM SCHEMA
═══════════════════════════════════════════════════

{
  "dokument_typ": "Mietvertrag",
  "parteien": [
    { "name": "Müller GmbH", "rolle": "Vermieterin" },
    { "name": "Schmidt, Klaus", "rolle": "Mieter" }
  ],
  "kritische_klauseln": [
    {
      "text": "Schönheitsreparaturen werden vollständig auf den Mieter abgewälzt.",
      "risiko": "high",
      "kategorie": "AGB-Klausel",
      "norm_check": "§307 BGB — starre Fristenpläne sind unwirksam (BGH-Rechtsprechung)"
    }
  ],
  "fristen": [
    { "titel": "Kündigungsfrist", "datum": "2026-08-31", "auswirkung": "Bei rechtzeitiger Kündigung Vertragsende zum 30.11.2026." }
  ],
  "betraege": [
    { "titel": "Kaltmiete monatlich", "betrag_eur": 1450.00 },
    { "titel": "Kaution", "betrag_eur": 4350.00 }
  ],
  "gerichtsstand": "AG Berlin-Mitte",
  "rechtsgebiet": "Mietrecht",
  "zusammenfassung": "Mietvertrag über 3-Zimmer-Wohnung in Berlin-Mitte, befristet auf 2 Jahre, mit fragwürdiger Schönheitsreparaturen-Klausel.",
  "handlungsbedarf": "Klausel zu Schönheitsreparaturen prüfen — AGB-rechtswidrig, sollte vor Unterzeichnung neu verhandelt oder als unwirksam erklärt werden.",
  "konfidenz": 0.88
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
        task: "doc_analysis",
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `Dateiname: ${dok.dateiname}. Bitte analysieren.`,
          },
        ],
        tenant_id: ctx.tenant_id,
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
