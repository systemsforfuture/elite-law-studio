# SYSTEMS™ — Plattform-Readiness (Stand v149)

Ehrliche Bestandsaufnahme: was funktioniert, was Plattform-Setup braucht, wo noch Lücken sind.

## ✅ Production-Ready (Code + Daten + UI komplett)

| Bereich | Status | Notes |
|---|---|---|
| **Email-Triage-KI** | ✅ Live | Deutscher System-Prompt in `triage-inbox/index.ts`, Multi-Provider mit Fallback. |
| **Mahnwesen-KI** | ✅ Live | §288 BGB-konforme Texte, Stufen 1-3 + gerichtliches Mahnverfahren. |
| **Strategie-Generator** | ✅ Live | Sachverhalt + Risiken + Handlungsoptionen, Iterations-Prompt. |
| **Dokumenten-Analyse** | ✅ Live | OCR + KI-Extraktion + kritische-Klauseln-Erkennung. |
| **KI-Assistent (Chat)** | ✅ Live | Kontext-aware via Akten/Mandanten/Rechnungen, ⌘/-Trigger. |
| **Multi-Provider LLM** | ✅ Live | Anthropic→OpenAI→Mock-Fallback, automatischer Switch bei 5xx. |
| **Cost-Tracking** | ✅ Live | Per Tenant, Anomaly-Banner bei 3×-Spike, Tier-Limits enforced. |
| **DSGVO-Audit-Log** | ✅ Live | RLS pro Tenant, 6-Jahre-Aufbewahrung, CSV-Export funktional. |
| **Stripe-Connect** | ✅ Live | Kanzlei verbindet eigenes Bankkonto, Plattform nimmt 0€ weiter. |
| **Email-Domain-Verifizierung** | ✅ Live | Resend-API, 3 DNS-Records, automatische Verifikations-Prüfung. |
| **WhatsApp-Onboarding** | ⚠️ Halbfertig | Code lägt sub-Account an, Meta-Approval läuft manuell über Operations-Team. |

## ⚠️ Voice-Stack — fast komplett (seit v149)

| Feature | Status | Fehlt noch |
|---|---|---|
| **Tenant-spezifischer Vapi-Assistant** | ✅ Code | Wird bei `provision-voice-number` automatisch erstellt. |
| **Deutscher System-Prompt** | ✅ Code | `_shared/voice-prompt.ts` mit 4 Aufgaben + Eskalations-Regeln + DSGVO-Hinweis. |
| **Function-Tools-Definition** | ✅ Code | 5 Functions definiert (lookup, check_avail, book, lead, escalate). |
| **Function-Tool-Implementierung** | ❌ Stub | `webhook-vapi` hat nur `lookup_mandant` und `capture_lead` voll implementiert. **`check_availability`, `book_appointment`, `escalate_to_lawyer` müssen noch fertig gebaut werden** bevor die Voice-KI live geht — sonst sagt sie »Ich konnte den Termin nicht buchen«. |
| **Test-Anruf** | ✅ Code | Endpunkt `voice-test-call` ruft echte Vapi-API. UI-Dialog im Dashboard. |
| **Voice-Quality (Stimme)** | ✅ Code | ElevenLabs »Anna DE« via `voice-prompt.ts`, Plattform-Betreiber kann Voice-ID austauschen. |
| **Tenant-spezifischer Voice-Re-Config** | ❌ TODO | Wenn Anwalt seine Tonalität in Branding ändert, wird der Vapi-Assistant nicht automatisch aktualisiert. Aktuell: Anwalt muss neu provisionieren oder Operations-Team patcht manuell. |

## ⚠️ Operationale Plattform-Aufgaben (nicht im Code)

Diese muss der Plattform-Betreiber (du) erledigen, kann nicht der Anwalt:

1. **Vapi-Account anlegen** + `VAPI_API_KEY` als Supabase-Secret setzen
2. **(Optional) `VAPI_DEFAULT_ASSISTANT_ID`** als Fallback setzen
3. **`PUBLIC_BASE_URL`** Secret setzen (für Vapi-Webhook-URL)
4. **WhatsApp 360dialog-Account** mit Meta-Business-Verifikation
5. **Resend-Account** für transaktionale Emails
6. **Stripe-Account** mit Connect aktiviert
7. **Anthropic + OpenAI API-Keys** beide setzen für Hybrid-Routing
8. **Webhook-Secrets** für Vapi/360dialog/Stripe/Resend setzen (`WEBHOOK_STRICT=true`)

Siehe `docs/INTEGRATIONS/README.md` und `docs/RUNBOOK.md` für die kompletten Setup-Steps.

## ❌ Nicht im Code, würde Plattform aber stark verbessern

Diese Features wären die natürlichen nächsten Bauschritte:

1. **Live-Vapi-Assistant-Update** wenn Anwalt seine Tonalität ändert (statt Re-Provision)
2. **Vapi-Function-Tools-Implementierung** für alle 5 Tool-Calls (heute: 2/5 voll fertig)
3. **Voice-Anruf-Live-Transkript im Dashboard** (Vapi liefert es, müssen wir nur anzeigen)
4. **Mandant-Self-Service-Portal** (Mandant sieht eigene Akte, lädt Dokumente hoch)
5. **Email-Digest** (Morgens automatischer Bericht über Vortags-Aktivität)
6. **Mobile-App** (heute nur Mobile-Web, native iOS/Android wäre Premium)

## Bottom Line

**Was perfekt funktioniert:** Email/WhatsApp-Triage, Mahnwesen, Strategie-Generierung, Dokumenten-Analyse, gesamtes Dashboard mit Live-Daten, DSGVO-Compliance, Multi-Tenant-Isolation.

**Was 95% funktioniert:** Voice-Stack — die Konversation klappt, aber **die 3 noch nicht-implementierten Function-Tools** müssen vor Production-Schaltung gebaut werden, sonst verspricht die KI Termine die nicht im System landen.

**Was nicht im Code ist:** Plattform-Operations-Setup (Vapi-Account, Stripe-Account, Resend-Domain, Meta-Approval) — das macht der Plattform-Betreiber einmalig.
