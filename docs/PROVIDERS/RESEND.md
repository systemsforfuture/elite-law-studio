# Resend (Email-Outbound + Inbound) — Setup-Anleitung

> Magic-Links, Mahnungen, Mandanten-Antworten gehen über Resend raus. Inbound-Mails werden vom KI-Triagisten klassifiziert.

## Was du brauchst

- Account bei [resend.com](https://resend.com)
- Domain-Zugang für DNS-Einträge (z.B. `kanzlei-bergmann.de`)
- 5-10 Min für DNS-Propagation

## Schritt 1: Resend-Account + Domain

1. [resend.com](https://resend.com) → Sign up
2. Dashboard → **Domains** → **Add Domain** → `deine-kanzlei.de`
3. Resend zeigt dir 3 DNS-Einträge an (SPF, DKIM, DMARC):
   ```
   TXT  send  v=spf1 include:_spf.resend.com ~all
   TXT  resend._domainkey  <DKIM-Key>
   TXT  _dmarc  v=DMARC1; p=none;
   ```
4. Bei deinem DNS-Provider eintragen (Hetzner, Cloudflare, etc.)
5. Zurück bei Resend → **Verify** → grüner Haken nach 5-10 Min

## Schritt 2: API-Key

1. Resend-Dashboard → **API Keys** → **Create API Key**
2. Permissions: **Send + Domains**
3. Key kopieren — beginnt mit `re_…`

## Schritt 3: Inbound einrichten (für Email-Triagist)

1. Dashboard → **Inbound** → **Add Inbound Endpoint**
2. URL eintragen:
   ```
   https://<dein-supabase-projekt>.supabase.co/functions/v1/webhook-email
   ```
   (Findest du im SYSTEMS-Dashboard → Integrationen → Email)
3. **Receive emails at**: `*@deine-kanzlei.de` oder spezifisch `kontakt@deine-kanzlei.de`
4. Webhook-Secret kopieren (Resend generiert einen)

## Schritt 4: SYSTEMS verbinden

1. SYSTEMS-Dashboard → **Integrationen** → **Email (Resend)** aufklappen
2. Eintragen:
   - **Resend API-Key**: `re_…`
   - **Absender-Adresse**: `kanzlei@deine-kanzlei.de` (muss zur verifizierten Domain passen)
   - **Verifizierte Domain**: `deine-kanzlei.de`
   - **Inbound-Webhook-Secret**: dein Resend-Secret
3. **Speichern** → **Verbindung testen**

Der Test prüft:
- API-Key gültig?
- Domain `deine-kanzlei.de` bei Resend verifiziert?

## Schritt 5: Magic-Links in Supabase

Damit Login-Mails über Resend gehen (nicht über die default Supabase-Sender):

1. Supabase-Dashboard → **Authentication** → **SMTP Settings**
2. Custom-SMTP aktivieren:
   - Host: `smtp.resend.com`
   - Port: `587`
   - User: `resend`
   - Password: dein API-Key
   - Sender: `kanzlei@deine-kanzlei.de`

## Häufige Probleme

- **Domain wird nicht verified** → DNS-TTL abwarten (24h max), bei Cloudflare »Proxy« deaktivieren für die TXT-Records
- **Email landet im Spam** → DMARC-Eintrag korrekt? SPF auf `~all` (nicht `-all` für die ersten Wochen)
- **Inbound funktioniert nicht** → MX-Eintrag setzen: `mx  10  feedback-smtp.us-east-1.amazonses.com`
- **»Domain nicht verifiziert« beim Test** → Im Resend-Dashboard prüfen ob Status `verified` (nicht `pending`)

## Kosten-Schätzung

- Free-Tier: 3.000 Mails/Monat
- Pro: 20 USD/Monat für 50.000 Mails
- Realistisch für eine Kanzlei: 500-2.000 Mails/Monat → kostenlos
