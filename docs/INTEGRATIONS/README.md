# Integrationen — Plattform-managed

> Anwälte sehen keine Provider-Namen. Alles läuft über die SYSTEMS-Plattform.
> Was die Kanzlei einträgt: nur eigene Daten (Telefon, Domain, Bank).

## Modul-Übersicht

| Modul | Was die Kanzlei macht | Was SYSTEMS macht |
|---|---|---|
| **KI-Telefon** | Vorwahl wählen, »Nummer anlegen« klicken | Provisioniert Telefon-Nummer + KI-Assistant via Plattform-Vapi-Account |
| **WhatsApp** | Eigene WA-Business-Nummer eintragen | Hängt Nummer als Sub-Account am Plattform-360dialog-Account; Operations-Team treibt Meta-Approval |
| **E-Mail** | Domain + Absender-Adresse eintragen | Legt Domain bei Plattform-Resend an, gibt 3 DNS-Records zurück, Anwalt trägt sie ein |
| **Zahlungen** | Auf »Konto verbinden« klicken, KYC bei Stripe | Plattform-Connect-Onboarding, Geld geht direkt auf Anwalts-Bankkonto |

## Plattform-Voraussetzungen

Damit die obigen Module funktionieren, müssen folgende Function-Secrets gesetzt sein (vom Plattform-Betreiber, nicht der Kanzlei):

```bash
# Pflicht
supabase secrets set ANTHROPIC_API_KEY=sk-ant-…           # KI
supabase secrets set RESEND_API_KEY=re_…                   # E-Mail-Plattform
supabase secrets set STRIPE_SECRET_KEY=sk_live_…           # Zahlungs-Plattform
supabase secrets set VAPI_API_KEY=vapi_…                   # Voice-Plattform
supabase secrets set VAPI_DEFAULT_ASSISTANT_ID=asst_…      # Default-Assistant
supabase secrets set WHATSAPP_API_KEY=D360-…               # WhatsApp-Plattform
supabase secrets set PUBLIC_BASE_URL=https://systems-tm.de # Für Stripe-Onboarding-Return

# Sicherheit
supabase secrets set WEBHOOK_STRICT=true
```

## Wenn ein neuer Anwalt onboarded

1. Magic-Link → Dashboard → »Demo-Daten anlegen« (optional)
2. Sidebar → **Setup → Integrationen**
3. Pro Modul:
   - **KI-Telefon**: Vorwahl wählen → »Anlegen« → Nummer ist sofort live (~30 Sek)
   - **WhatsApp**: WA-Nummer eintragen → »Einrichten« → Operations meldet sich in 24h
   - **E-Mail**: Domain eintragen → DNS-Records kopieren → bei Domain-Provider eintragen → »Verifizierung prüfen«
   - **Zahlungen**: »Konto verbinden« → Stripe-Onboarding-Flow → KYC abschließen
4. **Setup → System-Status** prüfen — alle 4 Module grün?

## Kosten-Modell

Die Plattform-Provider-Kosten (Vapi-Minuten, 360dialog-Subscriptions, Resend-Mails, Stripe-Gebühren) trägt der Plattform-Betreiber und reicht sie pauschal/per-use weiter. Die Kanzlei sieht im Modul »Abrechnung« eine konsolidierte Rechnung mit Verbrauchsdaten — nicht die einzelnen Provider.

## Operations-Aufgaben (SYSTEMS-Team)

- WhatsApp-Approval: nach `link-whatsapp-number` → Eintrag in 360dialog-Hub manuell erstellen, Mandanten-Account-Verifizierung pushen
- DNS-Verify-Pollen: `verify-email-domain` (action=poll) ist nur User-getriggert. Optional: Cron der alle pending-Domains nach 1h, 6h, 24h pollt
- Stripe-Webhook: bei `account.updated` → `charges_enabled` aktualisieren auf der Tenant-Row
