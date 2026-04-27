# Vapi (Voice-Agent) — Setup-Anleitung

> Eingehende Anrufe werden 24/7 von der KI angenommen, qualifiziert und bei Bedarf an den Anwalt eskaliert.

## Was du brauchst

- Account bei [vapi.ai](https://vapi.ai)
- Kreditkarte (Vapi rechnet pro Minute ab, ca. 0,07 USD/min für Sprachausgabe)
- Eine Telefonnummer die du via Vapi provisionierst (oder eine eigene SIP-Nummer mit Twilio-Integration)

## Schritt 1: Vapi-Account anlegen

1. [vapi.ai](https://vapi.ai) → Sign up
2. Im Dashboard → Profil → API-Keys → **Create new** → Name: `SYSTEMS Production`
3. Key kopieren — beginnt mit `vapi_…`

## Schritt 2: Assistant erstellen

1. Dashboard → **Assistants** → **+ Create Assistant**
2. Name: `Empfang Kanzlei <NAME>`
3. **Model**: OpenAI gpt-4o-mini (gut + günstig) oder Claude Haiku
4. **First Message**: `Kanzlei <NAME>, mein Name ist Anna. Wie kann ich Ihnen helfen?`
5. **System Prompt** (Beispiel — anpassen):
   ```
   Du bist die KI-Assistentin der Kanzlei <NAME>. Nimm den Anruf höflich entgegen.
   - Bei Termin-Anfrage: erfasse Name, Anliegen, gewünschtes Datum
   - Bei Notfall (Stichworte: Verhaftung, Frist heute, dringend): SOFORT eskalieren
   - Bei juristischer Sachfrage: NICHT beraten, sondern Termin anbieten
   - Sprache: ausschließlich Deutsch, Sie-Form
   ```
6. **Voice**: ElevenLabs/Bella oder PlayHT/Anna (deutsch)
7. Assistant speichern → **Assistant ID** kopieren (`asst_…`)

## Schritt 3: Telefonnummer provisionieren

1. Dashboard → **Phone Numbers** → **+ Buy number** → DE-Nummer wählen
2. Nummer mit dem Assistant verknüpfen
3. **Phone Number ID** kopieren (`pn_…`)

## Schritt 4: Webhook-URL eintragen

1. Im Assistant → **Server URL**:
   ```
   https://<dein-supabase-projekt>.supabase.co/functions/v1/webhook-vapi
   ```
   (URL findest du im SYSTEMS-Dashboard → Integrationen → Vapi → »Webhook-URL«)
2. **Webhook Secret** generieren (zufälliger 32-Char-String, z.B. via `openssl rand -hex 32`)
3. Im Vapi-Dashboard als HMAC-Secret eintragen

## Schritt 5: SYSTEMS verbinden

1. SYSTEMS-Dashboard → **Integrationen** → **Voice-Agent (Vapi)** aufklappen
2. Eintragen:
   - **Vapi API-Key**: `vapi_…`
   - **Assistant ID**: `asst_…`
   - **Phone Number ID**: `pn_…`
   - **Webhook-Secret (HMAC)**: dein generierter Secret-String
3. **Speichern** → **Verbindung testen**

Wenn grün: ein Anrufer testet jetzt deine Voice-KI live.

## Schritt 6: Tenant-Telefonnummer in der Kanzlei eintragen

Damit eingehende Webhook-Events richtig zugeordnet werden:

1. SYSTEMS-Dashboard → **White-Label** (oder direkt im Tenant)
2. **Notfall-Nummer** = die Vapi-Nummer (im internationalen Format `+4930…`)

Ohne diesen Schritt wird der Webhook 422 zurückgeben (»tenant_not_resolvable«).

## Häufige Probleme

- **»invalid signature«** → Webhook-Secret stimmt nicht überein. Prüfe ob du in Vapi und SYSTEMS exakt den gleichen String eingetragen hast.
- **Assistant antwortet nicht auf Deutsch** → System-Prompt explizit auf »ausschließlich Deutsch« setzen.
- **Anruf wird sofort beendet** → Vapi-Account hat kein Guthaben. Im Vapi-Billing aufladen.
- **Hohe Latenz** → Voice-Engine wechseln (PlayHT ist schnell, ElevenLabs hochwertiger aber langsamer).

## Kosten-Schätzung

- ~0,07 USD pro Minute Sprachausgabe (PlayHT)
- ~0,10 USD pro Minute (ElevenLabs)
- + ~0,01 USD pro Minute LLM-Tokens (gpt-4o-mini)
- Monatlich ~30 USD für 100 Anrufe à 5 Min
