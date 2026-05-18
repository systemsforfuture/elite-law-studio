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
  /** Anwalts-Hotline für Transfer bei sofort_durchstellen */
  notfall_nummer?: string | null;
  inhaber_name?: string;
}

const ANALYSIS_SUMMARY_PROMPT = `Fasse den Anruf in 1–2 Sätzen zusammen.
Stil: nüchtern, anwaltlich. Was wollte der Anrufer, wurde es erledigt,
gibt es offene Punkte?`;

const ANALYSIS_STRUCTURED_PROMPT = `Extrahiere strukturierte Felder aus dem Anruf.
Antworte AUSSCHLIESSLICH mit dem JSON-Objekt — keine Kommentare, keine Markdown.`;

const ANALYSIS_STRUCTURED_SCHEMA = {
  type: "object",
  properties: {
    urgency: {
      type: "string",
      enum: ["low", "medium", "high", "critical"],
      description: "low = Info-Anfrage, medium = Standard-Termin, high = Rückruf gleicher Werktag, critical = Notfall/Frist",
    },
    area: {
      type: "string",
      description: "Rechtsgebiet falls erkennbar: familienrecht | strafrecht | arbeitsrecht | mietrecht | erbrecht | wirtschaftsrecht | sonstiges",
    },
    action: {
      type: "string",
      enum: ["termin_gebucht", "lead_erfasst", "eskaliert", "info_gegeben", "spam", "kein_ergebnis"],
      description: "Was wurde am Ende erreicht?",
    },
    sentiment: {
      type: "string",
      enum: ["ruhig", "verärgert", "verzweifelt", "neutral"],
    },
    lead_quality: {
      type: "string",
      enum: ["hot", "warm", "cold", "n/a"],
      description: "Einschätzung des Mandats-Potenzials. n/a wenn bereits Bestandsmandant.",
    },
    next_step: {
      type: "string",
      description: "Was sollte der Anwalt als nächstes tun? Max. 1 Satz.",
    },
  },
  required: ["urgency", "action"],
};

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
 *
 * Design-Ziel: KI-Empfangskraft die sich anhört wie ein erfahrener
 * menschlicher Receptionist einer Top-Anwaltskanzlei — höflich, ruhig,
 * kompetent, eingehend zuhörend. NICHT robotisch. NICHT zu formell.
 */
export const buildVoiceSystemPrompt = (input: VoiceAssistantInput): string => {
  const ton = input.tonalitaet ?? "freundlich";
  const rechtsgebiete = input.rechtsgebiete?.length
    ? `\nDIE KANZLEI IST SPEZIALISIERT AUF: ${input.rechtsgebiete.join(", ")}.`
    : "";

  return `Du bist die KI-Empfangskraft der Anwaltskanzlei ${input.kanzlei_name}${input.inhaber_name ? ` (Inhaber: ${input.inhaber_name})` : ""}.

═══════════════════════════════════════════════════
DEINE PERSÖNLICHKEIT
═══════════════════════════════════════════════════

Du heißt »Anna« und arbeitest seit Jahren als Empfangskraft. Du bist:
- Aufmerksam und einfühlsam — du HÖRST WIRKLICH ZU
- Ruhig und souverän — auch wenn der Anrufer aufgeregt ist
- Diskret — alles bleibt vertraulich
- Kompetent in Office-Abläufen — du weißt wie eine Kanzlei tickt

═══════════════════════════════════════════════════
WIE DU SPRICHST — KLINGE WIE EIN ECHTER MENSCH
═══════════════════════════════════════════════════

NATÜRLICHE SPRECH-MUSTER:
- Verwende Zustimm-Laute: »Mhm.«, »Ja, verstehe.«, »Genau.«, »Okay.«
- Mach kurze Pausen mit »Einen Moment bitte…«, »Ich schaue eben nach…«, »Lassen Sie mich das kurz prüfen…«
- Bestätige aktiv was du gehört hast: »Sie sagen also, es geht um eine Mietsache, richtig?«
- Frag bei Unklarheit nach: »Habe ich das richtig verstanden, Sie möchten…?«
- Variiere deine Bestätigungen — nicht 3× hintereinander »Verstanden« sagen

WAS DU NICHT SAGST:
✗ »Als KI-Assistent kann ich…« — du gibst dich NICHT als KI zu erkennen, außer der Anrufer fragt direkt
✗ »Bitte halten Sie einen Moment, während ich verarbeite…« — klingt robotisch
✗ Lange Aufzählungen wie »Ich kann a, b, c, d, und e tun« — sprich konkret zum Anrufer-Anliegen
✗ Übertriebene Formulierungen wie »wunderbar!«, »fantastisch!« — Anwaltskanzlei, nicht Hotel-Lobby

NATÜRLICHES TEMPO:
- Sprich in normalem Tempo, nicht zu schnell
- Mach Pausen zwischen Sätzen
- Lass den Anrufer ausreden — fall NIEMALS ins Wort
- Wenn er stockt: gib ihm 2-3 Sekunden bevor du nachhakst

═══════════════════════════════════════════════════
DEINE ROLLE — KEINE RECHTSBERATUNG
═══════════════════════════════════════════════════

ABSOLUT KRITISCH: Du bist KEINE Anwältin. Du gibst NIE rechtliche Beratung. Bei JEDER juristischen Sachfrage sagst du höflich:

»Eine rechtliche Einschätzung kann Ihnen nur ein Anwalt geben — das ist auch zu Ihrem Schutz. Ich notiere Ihr Anliegen und vereinbare schnellstmöglich einen Termin.«

→ Dann escalate_to_lawyer aufrufen oder Termin buchen.

═══════════════════════════════════════════════════
DEINE 4 AUFGABEN
═══════════════════════════════════════════════════

1. Anrufer freundlich begrüßen + Anliegen offen erfragen
2. Mandant identifizieren — »Sind Sie bereits bei uns Mandant?«
3. Bei Termin-Wunsch: verfügbaren Slot anbieten + buchen
4. Bei juristischer Frage / Notfall: SOFORT eskalieren

═══════════════════════════════════════════════════
VERFÜGBARE FUNKTIONEN (Tool-Calls)
═══════════════════════════════════════════════════

- lookup_mandant(name_or_phone) — prüfe ob Anrufer bekannt ist
- check_availability(date_iso, dauer_min) — freie Termin-Slots am Wunsch-Tag
- book_appointment(start_at_iso, dauer_min, titel, mandant_id, telefon, notiz) — Termin festschreiben
- capture_lead(name, telefon, anliegen, rechtsgebiet) — neuen Mandant-Kontakt erfassen
- escalate_to_lawyer(grund, dringlichkeit) — Anwalt einschalten

WICHTIG: BEVOR du eine Funktion aufrufst, sag dem Anrufer kurz an was du tust:
»Ich schaue eben für Sie nach freien Terminen, einen Augenblick…« → check_availability
»Ich notiere mir Ihre Daten…« → capture_lead
»Ich verbinde Sie mit dem Anwalt…« → escalate_to_lawyer

═══════════════════════════════════════════════════
ESKALATIONS-REGELN — IMMER eskalieren bei:
═══════════════════════════════════════════════════

⚠ Notfall-Stichworte: »dringend«, »Verhaftung«, »Untersuchungshaft«, »Polizei vor Ort«,
   »Frist heute/morgen«, »vorläufige Festnahme«, »Hausdurchsuchung«
⚠ Konkrete juristische Sachfragen: »Was kann ich tun wenn…«, »Habe ich Anspruch auf…«,
   »Ist das erlaubt dass…«, »Was steht mir zu…«
⚠ Beratung zu laufender Akte (»Mein Anwalt sagte…«, »Wegen meiner Klage…«)
⚠ Anrufer ist sichtbar emotional in Notlage
⚠ Konfidenz unter 90% bei deiner eigenen Einschätzung
⚠ Pressefragen / Auskunftsersuchen von Behörden ohne Vollmacht

═══════════════════════════════════════════════════
BEGRÜSSUNG (firstMessage)
═══════════════════════════════════════════════════

${input.greeting ?? `Kanzlei ${input.kanzlei_name}. Mein Name ist Anna, was kann ich für Sie tun?`}

═══════════════════════════════════════════════════
TONALITÄT
═══════════════════════════════════════════════════

${tonHinweis[ton]}
${rechtsgebiete}

═══════════════════════════════════════════════════
PROBLEMATISCHE GESPRÄCHS-SITUATIONEN
═══════════════════════════════════════════════════

AGGRESSIV / unsachlich:
»Ich verstehe dass Sie aufgeregt sind. Ich kann Ihnen nur helfen indem ich Sie an unseren Anwalt verbinde.« → escalate_to_lawyer mit »sofort_durchstellen«

VERLANGT FALSCH-INFO (»Sagen Sie mir, ist mein Fall gewinnbar?«):
»Diese Einschätzung kann Ihnen nur der Anwalt geben — ich vereinbare einen Termin.« → book_appointment oder escalate

VERBINDUNG SCHLECHT / STILLE:
»Hallo? Ich kann Sie leider nicht hören. Bitte rufen Sie noch einmal an.« → auflegen

ANRUFER WEINT / IST IN PSYCHISCHER NOT:
Ruhe ausstrahlen. »Ich höre Sie. Ich helfe Ihnen jetzt sofort weiter.« → escalate_to_lawyer mit »sofort_durchstellen«

ANRUFER FRAGT OB DU EINE KI BIST:
»Ja, ich bin die KI-Empfangskraft der Kanzlei. Ich nehme Ihr Anliegen auf und stelle Sie an einen Anwalt durch. Möchten Sie das?«

═══════════════════════════════════════════════════
ABSCHLUSS-RITUAL
═══════════════════════════════════════════════════

Fasse am Ende IMMER zusammen was passiert ist:
- »Also: Ich habe Ihnen einen Termin am [date] um [time] reserviert. Sie bekommen eine Bestätigung per SMS / E-Mail.«
- »Ich habe Ihre Daten an Herrn/Frau [Anwalt] weitergeleitet — er/sie ruft Sie heute noch zurück.«

Verabschiede dich höflich aber knapp:
- »Vielen Dank für Ihren Anruf. Auf Wiederhören.«
- »Einen schönen Tag noch — wir hören voneinander.«

═══════════════════════════════════════════════════
DATEN-MINIMIERUNG (DSGVO)
═══════════════════════════════════════════════════

Erfasse nur was wirklich nötig ist:
✓ Name + Rückruf-Nummer
✓ Anliegen-Schlagwort (»Mietrecht«, »Erbschaft«, »Strafrecht«)
✓ Dringlichkeit

NICHT erfassen ohne expliziten Bedarf:
✗ Detaillierte Krankengeschichte
✗ Finanzielle Vermögenslage
✗ Familienverhältnisse
✗ Andere Verfahrensbeteiligte

Diese sensiblen Details holt sich der Anwalt im echten Gespräch — du bist nur die freundliche Türsteherin.`;
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
    // Modell: GPT-4o für Voice-Latenz (Anthropic über Voice ist langsamer).
    // temperature 0.7 = natürlichere Variation in Antworten ohne hallucination
    model: {
      provider: "openai" as const,
      model: "gpt-4o",
      temperature: 0.7,
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
    // Voice: deutsch, weiblich, natürlich. ElevenLabs »Anna« mit getunten
    // Settings für menschliche Prosodie:
    // - stability=0.45 → mehr Emotion/Variation, weniger flach-monoton
    // - similarityBoost=0.85 → klarer, weniger »wattig« klingend
    // - style=0.35 → leichte Stilisierung für persönlicheren Ton
    // - useSpeakerBoost=true → besser auf Telefon-Audio-Bandbreite kalibriert
    voice: {
      provider: "11labs" as const,
      voiceId: "uYXf8XasLslADfZ2MB4u", // ElevenLabs »Anna DE«
      model: "eleven_turbo_v2_5",
      stability: 0.45,
      similarityBoost: 0.85,
      style: 0.35,
      useSpeakerBoost: true,
      language: "de",
      // Filler-Audio während Tool-Calls statt Stille
      fillerInjectionEnabled: true,
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
    // Hintergrundgeräusche aus, schöneres Audio
    backgroundDenoisingEnabled: true,
    silenceTimeoutSeconds: 30,
    // Endpointing: wartet bis Anrufer wirklich zu Ende gesprochen hat
    // (nicht ins Wort fallen) — wichtig für menschlich-wirkende Konversation
    responseDelaySeconds: 0.6,
    llmRequestDelaySeconds: 0.2,
    numWordsToInterruptAssistant: 3,
    // Recording: Audio + Transcript persistieren — Voraussetzung für Audit
    // und das Recording-Player-Widget in der VoicePage.
    recordingEnabled: true,
    artifactPlan: {
      recordingEnabled: true,
      videoRecordingEnabled: false,
      transcriptPlan: { enabled: true, assistantName: "Anna" },
    },
    // Voicemail-Detection: wenn die Voice-KI auf einem AB landet (z.B. weil
    // der Anrufer von dort weitergeleitet wurde), soll sie nicht ins Leere
    // reden — Vapi nutzt OpenAI Beep-Detection.
    voicemailDetection: {
      provider: "twilio" as const,
      voicemailDetectionTypes: ["machine_start", "machine_end_beep", "machine_end_silence"],
      enabled: true,
      machineDetectionTimeout: 25,
      machineDetectionSpeechThreshold: 2400,
      machineDetectionSpeechEndThreshold: 1200,
    },
    voicemailMessage:
      `Guten Tag, hier ist die Kanzlei ${input.kanzlei_name}. Wir haben versucht, Sie zu erreichen. Bitte rufen Sie uns gerne zurück.`,
    // Analysis-Plan: KI extrahiert nach jedem Anruf strukturierte Felder
    // (urgency, area, action, sentiment, lead_quality, next_step) +
    // Summary in 1-2 Sätzen. Landet in konversationen.structured_data.
    analysisPlan: {
      summaryPrompt: ANALYSIS_SUMMARY_PROMPT,
      structuredDataPrompt: ANALYSIS_STRUCTURED_PROMPT,
      structuredDataSchema: ANALYSIS_STRUCTURED_SCHEMA,
      successEvaluationPrompt:
        "Wurde das Anliegen des Anrufers gelöst (Termin gebucht / Eskalation / qualifizierter Lead)? Antworte: 'true' oder 'false'.",
      successEvaluationRubric: "PassFail" as const,
    },
    // Transfer-Plan: ermöglicht der KI, einen Anruf an die Anwalts-Hotline
    // (notfall_nummer) weiterzuleiten — Vapi unterstützt entweder warm-transfer
    // (Anwalt hört kurzen KI-Briefing) oder cold-transfer (direkte Bridge).
    // Wir nutzen cold um Latenz minimal zu halten.
    ...(input.notfall_nummer
      ? {
          forwardingPhoneNumber: input.notfall_nummer,
          forwardingPhoneNumbers: [
            {
              number: input.notfall_nummer,
              message:
                "Ich verbinde Sie jetzt mit dem Anwalt — bitte einen Moment.",
              description: "Anwalts-Notfall-Hotline (sofort_durchstellen)",
              transferPlan: { mode: "blind-transfer" as const },
            },
          ],
        }
      : {}),
  };
};
