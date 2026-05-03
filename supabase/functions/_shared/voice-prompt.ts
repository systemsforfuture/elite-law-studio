// SYSTEMS™ — Voice-Receptionist System-Prompt + Vapi-Assistant-Config
//
// Zentrale Definition WAS die KI-Empfangskraft am Telefon können soll.
// Wird beim provisioning-voice-number aufgerufen um pro Tenant einen
// individuellen Vapi-Assistant zu erzeugen (statt aller Kanzleien zu
// teilen einen Default-Assistant).

export type Tonalitaet = "formal" | "freundlich" | "empathisch" | "direkt";

export interface VoiceAssistantInput {
  kanzlei_name: string;
  tonalitaet?: Tonalitaet;
  rechtsgebiete?: string[];
  greeting?: string;
  notfall_nummer?: string | null;
  inhaber_name?: string;
}

const tonHinweis: Record<Tonalitaet, string> = {
  formal:
    "Sprich förmlich und distanziert. Verwende »Sehr geehrte/r«, vermeide Du-Form, halte Sätze knapp und sachlich.",
  freundlich:
    "Sprich freundlich aber professionell. Lass den Anrufer spüren dass er willkommen ist, ohne in Floskeln zu verfallen.",
  empathisch:
    "Sprich besonders einfühlsam. Viele Anrufer kommen in Stress-Situationen — bestätige aktiv ihre Anliegen, vermittle Ruhe.",
  direkt:
    "Sprich direkt und effizient. Komme schnell zum Punkt, ohne unhöflich zu sein. Erfasse die Daten zügig.",
};

/**
 * Produziert den vollständigen System-Prompt für die Voice-KI.
 * Wird in Vapi als `model.systemPrompt` hinterlegt.
 */
export const buildVoiceSystemPrompt = (input: VoiceAssistantInput): string => {
  const ton = input.tonalitaet ?? "freundlich";
  const rechtsgebiete = input.rechtsgebiete?.length
    ? `\nDIE KANZLEI IST SPEZIALISIERT AUF: ${input.rechtsgebiete.join(", ")}.`
    : "";

  return `Du bist die KI-Empfangskraft der Anwaltskanzlei ${input.kanzlei_name}${input.inhaber_name ? ` (Inhaber: ${input.inhaber_name})` : ""}.

WICHTIG — DU BIST KEINE ANWÄLTIN:
Du gibst NIE rechtliche Beratung. Du qualifizierst nur den Anrufer und buchst Termine. Bei jeder juristischen Frage eskalierst du.

DEINE 4 AUFGABEN (in dieser Reihenfolge):
1. Begrüßen und Anrufer-Anliegen erfassen
2. Mandant identifizieren (bestehender Mandant? oder neuer Interessent?)
3. Bei Termin-Wunsch: verfügbaren Slot anbieten und buchen
4. Bei juristischer Frage / Notfall / Verhaftung / heutiger Frist: SOFORT eskalieren

VERFÜGBARE FUNKTIONEN (Tool-Calls):
- lookup_mandant(name_or_phone) — prüfe ob Anrufer bekannt ist
- check_availability(date_iso) — verfügbare Termin-Slots am Wunsch-Tag
- book_appointment(start_at_iso, dauer_min, titel, mandant_id, telefon, notiz) — Termin festschreiben
- capture_lead(name, telefon, anliegen, rechtsgebiet) — neuen Mandant-Kontakt erfassen
- escalate_to_lawyer(grund, dringlichkeit) — Anwalt sofort hinzuschalten oder Rückruf zusagen

ESKALATIONS-REGELN — IMMER eskalieren bei:
- Wörtern: »dringend«, »Verhaftung«, »Untersuchungshaft«, »Polizei vor Ort«, »Frist heute«, »Frist morgen«, »vorläufige Festnahme«
- Konkreten juristischen Sachfragen (»Was kann ich tun wenn…«, »Habe ich Anspruch auf…«)
- Beratung zu laufender Akte
- Anrufer ist sichtbar emotional in Notlage
- Konfidenz unter 90% bei der eigenen Einschätzung

BEGRÜSSUNG (firstMessage):
${input.greeting ?? `Kanzlei ${input.kanzlei_name}, mein Name ist Anna. Wie kann ich Ihnen helfen?`}

TONALITÄT:
${tonHinweis[ton]}
${rechtsgebiete}

REGEL FÜR PROBLEMATISCHE GESPRÄCHE:
- Wenn der Anrufer aggressiv wird oder Falsch-Info verlangt → freundlich aber bestimmt »Das beantwortet Ihnen am besten Ihr Anwalt direkt — ich verbinde Sie / lasse Sie zurückrufen.« → escalate_to_lawyer aufrufen
- Wenn die Verbindung schlecht ist oder der Anrufer schweigt → »Ich kann Sie nicht hören, bitte rufen Sie noch einmal an.« → auflegen

ABSCHLUSS:
Fasse am Ende kurz zusammen was passiert ist (»Ich habe Ihnen einen Termin am ${"{date}"} um ${"{time}"} bei Herrn/Frau ${"{anwalt}"} reserviert. Sie bekommen eine Bestätigung per E-Mail.«), verabschiede dich höflich.

DATEN-MINIMIERUNG (DSGVO):
Erfasse nur was nötig ist (Name, Rückruf-Nummer, Anliegen-Schlagwort). Keine sensiblen Details (Krankheit, finanzielle Situation, etc.) — die holt sich der Anwalt im echten Gespräch ab.`;
};

/**
 * Produziert das vollständige Vapi-Assistant-Konfigurations-Objekt.
 * Wird gegen POST https://api.vapi.ai/assistant geschickt.
 *
 * Doc: https://docs.vapi.ai/api-reference/assistants/create-assistant
 */
export const buildVapiAssistantConfig = (input: VoiceAssistantInput) => {
  const systemPrompt = buildVoiceSystemPrompt(input);
  const greeting =
    input.greeting ??
    `Kanzlei ${input.kanzlei_name}, mein Name ist Anna. Wie kann ich Ihnen helfen?`;

  return {
    name: `SYSTEMS-${input.kanzlei_name}`,
    firstMessage: greeting,
    firstMessageMode: "assistant-speaks-first" as const,
    // Modell: GPT-4o für Voice-Latenz (Anthropic über Voice ist langsamer)
    model: {
      provider: "openai" as const,
      model: "gpt-4o",
      temperature: 0.5,
      messages: [{ role: "system", content: systemPrompt }],
      tools: [
        {
          type: "function" as const,
          function: {
            name: "lookup_mandant",
            description:
              "Prüfe ob ein Anrufer bereits als Mandant in der Kanzlei-Datenbank steht. Gibt mandant_id zurück oder null.",
            parameters: {
              type: "object",
              properties: {
                name_or_phone: {
                  type: "string",
                  description: "Name oder Telefonnummer des Anrufers",
                },
              },
              required: ["name_or_phone"],
            },
          },
        },
        {
          type: "function" as const,
          function: {
            name: "check_availability",
            description:
              "Hole verfügbare Termin-Slots an einem bestimmten Datum. Gibt 1-5 Vorschläge zurück.",
            parameters: {
              type: "object",
              properties: {
                date_iso: { type: "string", description: "Datum im Format YYYY-MM-DD" },
                dauer_min: { type: "number", description: "Gewünschte Termindauer in Minuten, default 30" },
              },
              required: ["date_iso"],
            },
          },
        },
        {
          type: "function" as const,
          function: {
            name: "book_appointment",
            description:
              "Buche einen Termin verbindlich. Anwalt bestätigt automatisch via Bestätigungs-Mail.",
            parameters: {
              type: "object",
              properties: {
                start_at_iso: { type: "string", description: "Start-Zeitpunkt YYYY-MM-DDTHH:mm" },
                dauer_min: { type: "number" },
                titel: { type: "string", description: "Kurzer Titel, z.B. »Erstgespräch Müller«" },
                mandant_id: { type: ["string", "null"] },
                telefon: { type: "string" },
                notiz: { type: "string", description: "Anliegen in 1-2 Sätzen" },
              },
              required: ["start_at_iso", "dauer_min", "titel", "telefon", "notiz"],
            },
          },
        },
        {
          type: "function" as const,
          function: {
            name: "capture_lead",
            description:
              "Lege einen neuen Mandant-Kontakt an wenn der Anrufer noch nicht in der Datenbank ist.",
            parameters: {
              type: "object",
              properties: {
                name: { type: "string" },
                telefon: { type: "string" },
                anliegen: { type: "string" },
                rechtsgebiet: { type: "string" },
              },
              required: ["name", "telefon", "anliegen"],
            },
          },
        },
        {
          type: "function" as const,
          function: {
            name: "escalate_to_lawyer",
            description:
              "Eskaliere SOFORT an den Anwalt — bei Notfall, juristischer Frage, oder wenn Anrufer das verlangt.",
            parameters: {
              type: "object",
              properties: {
                grund: { type: "string", description: "1 Satz warum eskaliert wird" },
                dringlichkeit: {
                  type: "string",
                  enum: ["sofort_durchstellen", "rueckruf_heute", "rueckruf_naechster_werktag"],
                },
              },
              required: ["grund", "dringlichkeit"],
            },
          },
        },
      ],
    },
    // Voice: deutsch, weiblich, freundlich. ElevenLabs »Anna« oder Cartesia »Sonic-DE«.
    voice: {
      provider: "11labs" as const,
      voiceId: "uYXf8XasLslADfZ2MB4u", // ElevenLabs »Anna DE«
      model: "eleven_turbo_v2_5",
      stability: 0.6,
      similarityBoost: 0.75,
      language: "de",
    },
    // Transcriber: deutsch
    transcriber: {
      provider: "deepgram" as const,
      model: "nova-2-general",
      language: "de-DE",
    },
    // End-of-Call: KI fasst zusammen + Webhook-Push für persistente Speicherung
    endCallFunctionEnabled: true,
    endCallMessage: "Vielen Dank für Ihren Anruf. Auf Wiederhören.",
    serverUrl: undefined, // wird vom Caller gesetzt
    // Sicherheit: max. 10 Min Anruf-Dauer (Spam-Schutz)
    maxDurationSeconds: 600,
    // Hintergrundgeräusche aus
    backgroundDenoisingEnabled: true,
    silenceTimeoutSeconds: 30,
  };
};
