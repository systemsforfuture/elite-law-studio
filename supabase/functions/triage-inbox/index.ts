// SYSTEMS™ Edge Function — triage-inbox
//
// Kategorisiert eingehende Email/WhatsApp und schlägt eine Antwort vor.
// Wird vom Frontend aufgerufen wenn der User eine Konversation öffnet
// und einen KI-Vorschlag haben will.

import { handleCors, corsHeaders } from "../_shared/cors.ts";
import { complete, tryParseJson } from "../_shared/llm.ts";
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
  dringlichkeit?: "niedrig" | "normal" | "hoch" | "sofort";
  konfidenz: number;
  eskalation_noetig: boolean;
  eskalation_grund?: string;
  frist_erkannt?: string | null;
  antwort_vorschlag: string;
}

const SYSTEM_PROMPT = `Du bist die SYSTEMS-KI für eingehende Mandanten- und Behörden-Kommunikation einer deutschen Anwaltskanzlei. Du sortierst, qualifizierst und schlägst Antworten vor — auf dem Niveau einer erfahrenen Senior-Sekretärin.

═══════════════════════════════════════════════════
DEINE ENTSCHEIDUNGS-MATRIX
═══════════════════════════════════════════════════

KATEGORISIERE jede Nachricht in genau eine der 5 Kategorien:
- mandantenanfrage — Anfrage von (potentiellem) Mandant
- behoerde — Gericht, Staatsanwaltschaft, Behörde, Versicherung
- werbung — Marketing-Mails, Newsletter, Akquise
- spam — Phishing, Massen-Mails, irrelevante Bots
- internes — Kollegen, Buchhaltung, IT, etc.

ERKENNE den konkreten Intent in 1-2 Wörtern:
- termin_buchen · termin_verschieben · termin_absagen
- frist_anfrage · frist_verlängerung · fristverlängerung_gewährt
- dokument_nachreichen · dokument_anfordern · dokument_zustellung
- mandant_anlegen · mandat_kündigen · vollmacht_erteilen
- rechnungs_anfrage · zahlungs_bestätigung · mahnung_einspruch
- gerichts_zustellung · einspruch · klage_erhalten · urteil_zugestellt
- akteneinsicht · stellungnahme · rückruf_erbeten
- spam_kein_interesse / werbung_unsubscribe

═══════════════════════════════════════════════════
ESKALATIONS-REGELN — IMMER eskalieren bei:
═══════════════════════════════════════════════════

⚠ NOTFALL-STICHWORTE: »dringend«, »Verhaftung«, »Untersuchungshaft«,
   »vorläufige Festnahme«, »Hausdurchsuchung«, »Frist heute/morgen«,
   »eilig«, »vor Ort«, »Polizei«, »rechtskräftig in X Tagen«
⚠ JURISTISCHE SACHFRAGE: »Was kann ich tun wenn…«, »Habe ich Anspruch auf…«,
   »Ist es legal dass…«, »Was steht mir zu…«, »Wie verteidige ich…«
⚠ BERATUNG ZU LAUFENDER AKTE: »Wegen meiner Klage…«, »Mein Anwalt sagte…«,
   »Bezüglich meines Falls…«
⚠ FRISTEN: jede Frist die innerhalb der nächsten 14 Tage abläuft
⚠ BEHÖRDEN-POST: jede Mail von Gericht/StA/Behörde — ALLE eskalieren
⚠ KONFIDENZ < 90% bei der eigenen Einschätzung
⚠ MANDANT IN EMOTIONALER NOTLAGE (offensichtlich verzweifelt/aggressiv)

KEINE Eskalation nötig (selbst antworten):
✓ Standard-Termin-Wünsche → check_availability empfehlen
✓ Dokument-Eingang bestätigen
✓ Werbung/Spam → automatisch ignorieren oder filtern
✓ Buchhaltung/Rechnungs-Erinnerung mit Standard-Antwort

═══════════════════════════════════════════════════
ANTWORT-VORSCHLAG REGELN
═══════════════════════════════════════════════════

Wenn du selbst antwortest:
- 2-5 Sätze, briefform
- Tonalität der Kanzlei (siehe Custom-Anweisungen)
- Höflich, knapp, präzise — keine leeren Floskeln
- KEIN »Ich kann Ihnen leider nicht helfen« — entweder konkret antworten oder eskalieren
- KEIN Vorschlag mit »Bitte rufen Sie uns an« — wir sind die Kanzlei, WIR rufen zurück

═══════════════════════════════════════════════════
OUTPUT — REINES JSON IM SCHEMA
═══════════════════════════════════════════════════

{
  "kategorie": "mandantenanfrage|behoerde|werbung|spam|internes",
  "intent": "kurz_beschreibend",
  "dringlichkeit": "niedrig|normal|hoch|sofort",
  "konfidenz": 0.0-1.0,
  "eskalation_noetig": true|false,
  "eskalation_grund": "1 Satz wenn eskalation_noetig=true",
  "frist_erkannt": "YYYY-MM-DD oder null",
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
      .select("kanzlei_name, branding_config, rechtsgebiete, agent_config")
      .eq("id", ctx.tenant_id)
      .single();

    const branding = (tenant?.branding_config ?? {}) as { tonalitaet?: string };
    const agentCfg = ((tenant?.agent_config ?? {}) as Record<string, {
      status?: string;
      konfidenz_threshold?: number;
      tonalitaet?: string;
      custom_prompt_addition?: string | null;
    }>)[
      konv.kanal === "whatsapp"
        ? "whatsapp_conversationalist"
        : konv.kanal === "voice"
          ? "voice_receptionist"
          : "email_triagist" // email + sms fallen auf email_triagist
    ];

    // Wenn Agent pausiert → kein Vorschlag
    if (agentCfg?.status === "pausiert") {
      return new Response(
        JSON.stringify({
          error: "Agent pausiert für diesen Kanal",
        }),
        {
          status: 423,
          headers: { ...corsHeaders, "content-type": "application/json" },
        },
      );
    }

    const tonalitaet =
      agentCfg?.tonalitaet ?? branding.tonalitaet ?? "freundlich";

    const userPrompt = `
KANZLEI: ${tenant?.kanzlei_name ?? "—"}
TONALITÄT: ${tonalitaet}
RECHTSGEBIETE: ${(tenant?.rechtsgebiete ?? []).join(", ")}
${agentCfg?.custom_prompt_addition ? `\nKANZLEI-SPEZIFISCHE ANWEISUNGEN:\n${agentCfg.custom_prompt_addition}\n` : ""}

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

    // Channel-spezifischer Task — voice/whatsapp nutzt billigeres Modell
    const triageTask =
      konv.kanal === "voice"
        ? "voice_triage"
        : konv.kanal === "whatsapp"
          ? "whatsapp_chat"
          : "email_triage";
    const llm = await complete({
      task: triageTask,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
      tenant_id: ctx.tenant_id,
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
