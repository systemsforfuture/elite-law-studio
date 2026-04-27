# Stripe (Mandanten-Zahlungen) — Setup-Anleitung

> Mandanten zahlen Honorar-Rechnungen direkt im Mandanten-Portal. Webhook aktualisiert den Zahlstatus automatisch.

## Was du brauchst

- Account bei [stripe.com](https://stripe.com)
- Steuer-ID + Firmen-Adresse für Stripe-Onboarding
- Bank-Konto für Auszahlungen

## Schritt 1: Stripe-Account anlegen

1. [stripe.com](https://stripe.com) → Start now → Geschäftskonto erstellen
2. Vollständige KYC-Daten (Geschäftsführer, Adresse, Bankkonto)
3. Stripe verifiziert in 1-3 Tagen → `charges_enabled: true`

## Schritt 2: API-Keys

1. Stripe-Dashboard → **Developers** → **API keys**
2. **Live mode** umschalten (oben rechts)
3. **Secret key** kopieren — beginnt mit `sk_live_…`

⚠️ NIE den Secret-Key per Email schicken oder in Git pushen.

## Schritt 3: Webhook einrichten

1. Stripe-Dashboard → **Developers** → **Webhooks** → **+ Add endpoint**
2. URL:
   ```
   https://<dein-supabase-projekt>.supabase.co/functions/v1/webhook-stripe
   ```
3. Events auswählen:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
4. **Signing secret** kopieren — beginnt mit `whsec_…`

## Schritt 4: SYSTEMS verbinden

1. SYSTEMS-Dashboard → **Integrationen** → **Zahlungen (Stripe)** aufklappen
2. Eintragen:
   - **Secret-Key**: `sk_live_…`
   - **Webhook-Signing-Secret**: `whsec_…`
   - **Connect Account ID** (optional, für Plattform-Stripe): `acct_…`
3. **Speichern** → **Verbindung testen**

Der Test prüft:
- API-Key gültig?
- `charges_enabled` true (Stripe hat Account verifiziert)?

## Schritt 5: Tax + Invoicing

Wichtig für deutsche Anwälte (UStG-konform):

1. Dashboard → **Tax** → **Settings**
2. **Origin Address** → deine Kanzlei-Adresse
3. **Tax Behavior**: »Inclusive« (Mandant sieht Brutto-Preis im Checkout)
4. **VAT Rate**: 19% Standard, 0% wenn Reverse-Charge

## Schritt 6: Test-Zahlung

1. SYSTEMS-Dashboard → eine offene Rechnung als Mandant öffnen
2. Mandanten-Portal → »Bezahlen via Stripe« → Stripe-Checkout
3. Mit Test-Karte `4242 4242 4242 4242` (im Test-Mode) durchgehen
4. Webhook sollte den Rechnung-Status auf `bezahlt` setzen

## Häufige Probleme

- **»charges_enabled: false«** → Stripe-Onboarding noch nicht abgeschlossen
- **Webhook 401 »invalid signature«** → `whsec_…` nicht korrekt
- **Mandant sieht falschen Betrag** → Tax-Setting auf »Inclusive« oder »Exclusive« checken
- **Auszahlung fehlt** → Stripe zahlt erst nach 7 Tagen (Standard) aus, im Dashboard auf »Daily payouts« umstellen

## Kosten-Schätzung

- Stripe-Gebühr: 1,5% + 0,25 € pro Karten-Zahlung in EU
- SEPA-Lastschrift: 0,8% + 0,25 €
- Bei 5.000 € Honorar pro Monat: ~75 € Gebühren
