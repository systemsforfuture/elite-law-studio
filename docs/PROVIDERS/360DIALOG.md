# 360dialog (WhatsApp Business API) — Setup-Anleitung

> Eingehende WhatsApp-Nachrichten werden empathisch beantwortet, juristische Themen an den Anwalt eskaliert.

## Was du brauchst

- WhatsApp Business Account verifiziert
- Ein dedizierter Telefonanschluss (kann nicht parallel mit normaler WhatsApp verwendet werden)
- Account bei [360dialog](https://www.360dialog.com)
- 3-7 Tage für die WhatsApp-Business-Approval (Meta verifiziert)

## Schritt 1: Phone-Number vorbereiten

1. **WICHTIG**: Wenn die Nummer bereits in WhatsApp Personal/Business benutzt wird, musst du sie dort zuerst deinstallieren
2. Wähle eine Festnetz- oder Mobil-Nummer auf die du SMS-OTP empfangen kannst
3. Bevorzugt eine separate Geschäftsnummer

## Schritt 2: 360dialog-Account anlegen

1. [hub.360dialog.io](https://hub.360dialog.io) → Sign up als WhatsApp Business
2. Verifiziere die Phone-Number per OTP
3. Trage Firmenname + Adresse + Branche ein (»Legal Services / Anwaltskanzlei«)
4. Warte auf Meta-Approval (E-Mail kommt in 1-7 Tagen)

## Schritt 3: API-Key generieren

1. 360dialog-Dashboard → **Settings** → **API Keys** → **Generate new key**
2. Key kopieren — beginnt mit `D360-…`

## Schritt 4: Webhook eintragen

1. SYSTEMS-Dashboard → **Integrationen** → **WhatsApp** → »Webhook-URL« kopieren
2. 360dialog-Dashboard → **Settings** → **Webhooks** → URL eintragen:
   ```
   https://<dein-supabase-projekt>.supabase.co/functions/v1/webhook-whatsapp
   ```
3. Verify-Token + Secret generieren (zufälliger String)
4. Im 360dialog-Dashboard als Webhook-Secret eintragen

## Schritt 5: SYSTEMS verbinden

1. SYSTEMS-Dashboard → **Integrationen** → **WhatsApp (360dialog)** aufklappen
2. Eintragen:
   - **360dialog API-Key**: `D360-…`
   - **Phone Number ID**: deine Geschäftsnummer im Format `493012345678` (ohne `+`)
   - **Webhook-Secret**: gleicher String wie bei 360dialog
3. **Speichern** → **Verbindung testen**

## Message-Templates anlegen

WhatsApp Business erlaubt keine free-form-Outbound-Messages an Mandanten die nicht in den letzten 24h geschrieben haben. Du brauchst pre-approved Templates:

1. 360dialog-Dashboard → **Templates** → **+ Create**
2. Beispiel-Templates für Anwaltskanzleien:
   - **Termin-Erinnerung**: »Sehr geehrte/r {{1}}, hiermit erinnern wir Sie an Ihren Termin am {{2}}. Bei Fragen rufen Sie uns gerne an.«
   - **Mahnung-Stufe-1**: »Sehr geehrte/r {{1}}, Ihre Rechnung {{2}} über {{3}} ist seit {{4}} Tagen offen…«
3. Meta verifiziert die Templates (1-2h)

## Schritt 6: Phone-Number in Tenant eintragen

Damit eingehende Webhook-Events richtig zugeordnet werden:

1. SYSTEMS-Dashboard → **White-Label** → **Notfall-Nummer**
2. Trage die WhatsApp-Nummer ein (international, mit `+`): z.B. `+493012345678`

Ohne diesen Schritt landen Nachrichten ins Logging-Loch.

## Häufige Probleme

- **»invalid signature«** → Webhook-Secret stimmt nicht überein
- **Template-Send fehlgeschlagen** → Template noch nicht von Meta approved (warten)
- **Phone-Number-ID falsch** → Format ohne `+`: `493012345678` (12-15 Ziffern)
- **Mandant kriegt keine Antwort** → Tenant.notfall_nummer fehlt → Webhook 422

## Kosten-Schätzung

- 360dialog: ab 49 €/Monat (Business-Tier)
- Pro Conversation: ~0,06–0,10 € (je nach Land + Initiator)
- Plus eigene LLM-Kosten für Antwortgenerierung
