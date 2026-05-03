# Voice-Stack — Setup für Plattform-Betreiber

Das Voice-Modul nutzt Vapi.ai (versteckt vor Anwälten als »SYSTEMS-Voice-KI«). Pro Kanzlei wird automatisch ein eigener Assistant erstellt, mit Tonalität + Rechtsgebieten der Kanzlei und allen Function-Tools.

## Was dieser Code automatisch tut (seit v149)

Beim Klick »KI-Telefon einrichten« in der Anwalts-UI passiert serverseitig:

1. **Tenant-spezifischen Vapi-Assistant erstellen** via `POST https://api.vapi.ai/assistant`
   - System-Prompt aus `_shared/voice-prompt.ts` (4 Aufgaben, 5 Function-Tools, DSGVO-Hinweis)
   - Tonalität aus `branding_config.tonalitaet` (formal/freundlich/empathisch/direkt)
   - Rechtsgebiete der Kanzlei werden in den Prompt injiziert
   - Voice: ElevenLabs »Anna DE« (`uYXf8XasLslADfZ2MB4u`, `eleven_turbo_v2_5`)
   - Transcriber: Deepgram `nova-2-general` mit `de-DE`
   - Webhook-URL: `${PUBLIC_BASE_URL}/functions/v1/webhook-vapi`
   - Max Anruf-Dauer: 10 Min (Spam-Schutz)

2. **DE-Telefonnummer kaufen** (`POST https://api.vapi.ai/phone-number/buy`) und an den eben erstellten Assistant binden

3. **Speichern** in `tenants.provider_config.voice`:
   ```json
   {
     "enabled": true,
     "phone_number": "+49303330033",
     "phone_number_id": "vapi-phone-uuid",
     "assistant_id": "vapi-assistant-uuid",
     "status": "active",
     "greeting": "Kanzlei XYZ, mein Name ist Anna…"
   }
   ```

## Pflicht-Secrets (vom Plattform-Betreiber zu setzen)

```bash
supabase secrets set VAPI_API_KEY=vapi_...
supabase secrets set PUBLIC_BASE_URL=https://systems-tm.de
```

Optional als Fallback wenn die Tenant-Assistant-Erstellung scheitert (z.B. Vapi-Outage):

```bash
supabase secrets set VAPI_DEFAULT_ASSISTANT_ID=asst_...
```

## ElevenLabs Voice-ID

Default ist `uYXf8XasLslADfZ2MB4u` (ElevenLabs »Anna DE«). Andere deutsche Stimmen: siehe [ElevenLabs Voice Library](https://elevenlabs.io/voice-library?language=de). Die Voice-ID kannst du in `_shared/voice-prompt.ts` → `buildVapiAssistantConfig.voice.voiceId` ändern.

## Vapi-Function-Tools — wichtige TODOs

Der Assistant ist konfiguriert mit 5 Tool-Functions:
- `lookup_mandant(name_or_phone)` — sucht bestehenden Mandant
- `check_availability(date_iso, dauer_min)` — verfügbare Termin-Slots
- `book_appointment(start_at, dauer_min, titel, mandant_id, telefon, notiz)` — Termin festschreiben
- `capture_lead(name, telefon, anliegen, rechtsgebiet)` — neuen Mandant-Kontakt
- `escalate_to_lawyer(grund, dringlichkeit)` — Anwalt sofort hinzuschalten

**WICHTIG**: Diese Tool-Aufrufe werden von Vapi an `serverUrl` (= `webhook-vapi`) als POST mit `type: "function-call"` geschickt. Der `webhook-vapi`-Handler muss die 5 Functions implementieren — heute existieren noch nur `lookup_mandant` und `capture_lead` voll, die anderen sind Stubs. **Production-Empfehlung**: vor Live-Schaltung alle 5 Tool-Implementierungen finalisieren. Die Voice-KI wird sonst sagen »Ich konnte den Termin nicht buchen«.

## Test-Workflow für eine neue Kanzlei

1. Anwalt klickt im Dashboard »Setup → Integrationen → KI-Telefon → Anlegen«
2. Vapi liefert in ~30 Sekunden eine deutsche Festnetz-Nummer
3. Anwalt klickt »Test-Anruf simulieren« → eigene Mobil-Nummer eintragen → Vapi ruft die KI ruft den Anwalt → Anwalt spricht mit seiner KI
4. Anwalt prüft im Dashboard »Voice-Agent« → Anrufprotokoll → KI hat alles korrekt protokolliert

## Wenn der KI-Receptionist nicht gut klingt

Symptom-Diagnose:

| Symptom | Ursache | Fix |
|---|---|---|
| KI klingt monoton/roboterhaft | Voice-Provider-Config | `_shared/voice-prompt.ts` → `voice.stability` runterregeln auf 0.4 |
| KI antwortet zu lange | `temperature` zu hoch | `model.temperature` auf 0.3 setzen |
| KI versteht Anrufer schlecht | Transcriber-Sprache falsch | `transcriber.language: "de-DE"` prüfen |
| KI eskaliert zu wenig | System-Prompt zu lasch | In `buildVoiceSystemPrompt` strengere Regeln (Konfidenz auf 95%) |
| KI eskaliert zu oft | System-Prompt zu streng | Konfidenz-Schwelle auf 80% senken |

## Tenant-spezifische Anpassungen

Anwalt kann unter »Branding → Tonalität« seine Tonalität ändern. Diese wird beim Klick »Voice-KI neu konfigurieren« (TODO: noch zu bauen) in den Vapi-Assistant gepatched. Aktuell muss der Plattform-Betreiber die Anpassung manuell triggern oder die Kanzlei erneut provisioniert werden.
