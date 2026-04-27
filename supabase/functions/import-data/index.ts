// SYSTEMS™ Edge Function — import-data
//
// Importiert Mandanten aus CSV-Daten. Frontend parst die Datei
// und schickt strukturiertes JSON. KI mapped Spalten-Namen automatisch
// auf das SYSTEMS-Schema, Validation läuft, Bulk-Insert in Batches.

import { handleCors, corsHeaders } from "../_shared/cors.ts";
import { complete, tryParseJson } from "../_shared/anthropic.ts";
import { callerContext, supabaseAdmin } from "../_shared/supabase-admin.ts";

interface RequestBody {
  source: "ra_micro" | "datev" | "advoware" | "excel" | "csv";
  headers: string[];
  rows: string[][];
  /**
   * Optional: explizites Mapping (überschreibt KI-Auto-Mapping).
   * Format: { "Quell-Header": "mandant.feld_name" }
   */
  mapping?: Record<string, string>;
}

interface MappingResult {
  mappings: Record<string, string>; // sourceHeader -> targetField
  konfidenz: number;
}

const TARGET_FIELDS = [
  "vorname",
  "nachname",
  "firmenname",
  "email",
  "telefon",
  "whatsapp",
  "rechtsgebiet",
  "notes_preview",
] as const;

const MAPPING_SYSTEM_PROMPT = `Du mappst CSV-Spalten-Namen einer deutschen Anwaltskanzlei auf ein festes Schema.

ZIEL-FELDER (genau diese Namen verwenden):
- vorname, nachname (für Privatpersonen)
- firmenname (für Unternehmen)
- email, telefon, whatsapp
- rechtsgebiet
- notes_preview (Notiz/Beschreibung)

REGELN:
- Quell-Header → Ziel-Feld (oder "skip" wenn nicht passend)
- Mapping-Beispiele: "Vorname"→"vorname", "Nachname"→"nachname",
  "E-Mail"→"email", "Mail"→"email", "Tel."→"telefon", "Fax"→"skip",
  "Sachgebiet"→"rechtsgebiet", "Notiz"→"notes_preview"
- Bei Unsicherheit: "skip"

OUTPUT: NUR JSON in diesem Schema:
{
  "mappings": { "Quell-Header-1": "ziel_feld", ... },
  "konfidenz": 0.0-1.0
}`;

// Heuristisches Mapping wenn KI nicht verfügbar
const heuristicMap = (header: string): string => {
  const h = header.toLowerCase().trim();
  if (h.includes("vorname") || h.includes("first")) return "vorname";
  if (h.includes("nachname") || h.includes("last")) return "nachname";
  if (h.includes("firma") || h.includes("company")) return "firmenname";
  if (h.includes("mail")) return "email";
  if (h.includes("telefon") || h.includes("tel.") || h.includes("phone")) return "telefon";
  if (h.includes("whatsapp") || h.includes("mobile") || h.includes("handy")) return "whatsapp";
  if (h.includes("sachgebiet") || h.includes("rechtsgebiet") || h.includes("matter"))
    return "rechtsgebiet";
  if (h.includes("notiz") || h.includes("kommentar") || h.includes("note"))
    return "notes_preview";
  return "skip";
};

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
    // Massen-Import nur durch Owner oder Anwalt — eine Sekretärin sollte nicht
    // ohne Approval beliebige Mandanten-Daten ins System bringen können.
    if (!["owner", "anwalt"].includes(ctx.role)) {
      return new Response(JSON.stringify({ error: "Nur Owner/Anwalt darf Daten importieren" }), {
        status: 403,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    const body: RequestBody = await req.json();
    if (!body.headers?.length || !body.rows?.length) {
      return new Response(
        JSON.stringify({ error: "headers + rows erforderlich" }),
        {
          status: 400,
          headers: { ...corsHeaders, "content-type": "application/json" },
        },
      );
    }
    if (body.rows.length > 5000) {
      return new Response(
        JSON.stringify({
          error: "Maximal 5.000 Zeilen pro Import. Bitte aufteilen.",
        }),
        {
          status: 413,
          headers: { ...corsHeaders, "content-type": "application/json" },
        },
      );
    }

    // Mapping bestimmen
    let mappings: Record<string, string> = {};
    let mapKonfidenz = 0;
    if (body.mapping) {
      mappings = body.mapping;
      mapKonfidenz = 1.0;
    } else if (Deno.env.get("ANTHROPIC_API_KEY")) {
      const llm = await complete({
        tier: "fast",
        system: MAPPING_SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content:
              `Quelle: ${body.source}\n` +
              `Header: ${body.headers.join(", ")}\n` +
              `Beispiel-Zeile: ${body.rows[0]?.join(" | ") ?? ""}\n\n` +
              "Mapping als JSON.",
          },
        ],
        max_tokens: 512,
      });
      const parsed = tryParseJson<MappingResult>(llm.text);
      if (parsed) {
        mappings = parsed.mappings;
        mapKonfidenz = parsed.konfidenz;
      } else {
        // Fallback heuristisch
        for (const h of body.headers) mappings[h] = heuristicMap(h);
        mapKonfidenz = 0.7;
      }
    } else {
      for (const h of body.headers) mappings[h] = heuristicMap(h);
      mapKonfidenz = 0.7;
    }

    // Header-Index für schnellen Zugriff
    const headerIdx: Record<string, number> = {};
    body.headers.forEach((h, i) => (headerIdx[h] = i));

    // Rows in Mandanten-Records umwandeln
    const admin = supabaseAdmin();
    const records: Record<string, unknown>[] = [];
    const errors: { row: number; reason: string }[] = [];

    for (let i = 0; i < body.rows.length; i++) {
      const row = body.rows[i];
      const m: Record<string, unknown> = {
        tenant_id: ctx.tenant_id,
        status: "aktiv",
        herkunft: "import",
      };
      for (const [src, target] of Object.entries(mappings)) {
        if (!target || target === "skip") continue;
        if (!TARGET_FIELDS.includes(target as never)) continue;
        const idx = headerIdx[src];
        if (idx === undefined) continue;
        const val = row[idx]?.trim();
        if (val) m[target] = val.slice(0, 500);
      }
      // Pflicht: Email ODER (Nachname/Firmenname)
      if (!m.email && !m.nachname && !m.firmenname) {
        errors.push({ row: i + 2, reason: "Email/Name fehlt" });
        continue;
      }
      m.typ = m.firmenname ? "unternehmen" : "privat";
      records.push(m);
    }

    // Bulk-Insert in Batches á 100
    let inserted = 0;
    const BATCH = 100;
    for (let i = 0; i < records.length; i += BATCH) {
      const slice = records.slice(i, i + BATCH);
      const { data, error } = await admin
        .from("mandanten")
        .insert(slice)
        .select("id");
      if (error) {
        errors.push({ row: -1, reason: `Batch ${i}: ${error.message}` });
        continue;
      }
      inserted += data?.length ?? 0;
    }

    // Audit
    await admin.from("audit_log").insert({
      tenant_id: ctx.tenant_id,
      user_id: ctx.id,
      action: "create",
      entity_type: "mandanten_import",
      details: `${inserted} Datensätze aus ${body.source} importiert`,
    });

    return new Response(
      JSON.stringify({
        inserted,
        total: body.rows.length,
        errors,
        mappings,
        mappings_konfidenz: mapKonfidenz,
      }),
      {
        headers: { ...corsHeaders, "content-type": "application/json" },
      },
    );
  } catch (e) {
    console.error("[import-data]", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
      {
        status: 500,
        headers: { ...corsHeaders, "content-type": "application/json" },
      },
    );
  }
});
