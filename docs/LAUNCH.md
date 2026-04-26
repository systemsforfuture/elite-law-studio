# SYSTEMS™ Launch-Checkliste

> 30 Minuten von Repo zu Live. Reihenfolge strikt einhalten.

## Voraussetzungen

- [x] GitHub-Repo ist clone-bar (du liest das hier)
- [x] Supabase-Projekt `dsgenkjlkdzkoplnxebg` existiert
- [ ] Node 20+ + npm lokal installiert
- [ ] `supabase` CLI optional (für Auto-Deploy bequemer)

## Schritt 1 — Lokal aufsetzen (3 Min)

```bash
git clone https://github.com/systemsforfuture/elite-law-studio.git
cd elite-law-studio
npm install
cp .env.example .env.local
```

`.env.local` öffnen und folgende Zeilen eintragen:

```
VITE_SUPABASE_URL=https://dsgenkjlkdzkoplnxebg.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_lZZzyf9AKA2Je_vBoEwMAQ_71dio9_W
```

```bash
npm run dev
```

Öffnen: http://127.0.0.1:8080/ → SYSTEMS-Marketing-Seite muss erscheinen.

## Schritt 2 — Datenbank-Migrationen ausführen (5 Min)

Supabase Dashboard → **SQL Editor** → **New query** öffnen:
https://supabase.com/dashboard/project/dsgenkjlkdzkoplnxebg/sql/new

Folgende 5 Migration-Files **in dieser Reihenfolge** copy-pasten und je „Run" klicken:

1. `supabase/migrations/20260426120000_init_schema.sql` — Schema (11 Tabellen + RLS + Storage-Bucket)
2. `supabase/migrations/20260426130000_bootstrap_and_audit.sql` — Bootstrap-RPCs + Audit-Trigger
3. `supabase/migrations/20260426140000_tenant_update_policy.sql` — Tenant-Owner-Update RLS
4. `supabase/migrations/20260426150000_agent_config.sql` — Agent-Config-JSONB
5. `supabase/migrations/20260426160000_mandant_auth.sql` — Mandanten-Auth-RLS

Erwartetes Ergebnis: jede Migration „Success. No rows returned"

## Schritt 3 — Seed-Daten (1 Min)

Im SQL Editor: Inhalt von `supabase/seed.sql` reinkopieren → Run.

→ Erzeugt Demo-Tenant „Kanzlei Bergmann" mit fester UUID.

## Schritt 4 — Email-Templates (2 Min)

Supabase Dashboard → **Authentication → Email Templates**:

- **Magic Link**: Inhalt von `supabase/templates/magic-link.html` reinkopieren
- **Invite User**: Inhalt von `supabase/templates/invite.html` reinkopieren

**Authentication → URL Configuration**:
- Site URL: `http://127.0.0.1:8080` (lokal) bzw. später deine Domain
- Additional Redirect URLs: füge `http://127.0.0.1:8080/auth/callback` und `http://127.0.0.1:8080/portal/dashboard` hinzu

## Schritt 5 — KI-Edge-Function-Secret (1 Min, optional aber empfohlen)

Ohne diesen Key liefern alle KI-Functions Mock-Antworten. Mit Key: echte KI.

Supabase Dashboard → **Settings → Functions → Edge Function Secrets** → **Add new secret**:
- Name: `ANTHROPIC_API_KEY`
- Value: `sk-ant-api03-…` (aus https://console.anthropic.com/settings/keys)

## Schritt 6 — GitHub Auto-Deploy aktivieren (2 Min)

Damit künftige Migrations + Edge-Functions automatisch deployen.

GitHub Repo → **Settings → Secrets and variables → Actions → New repository secret**:

| Name | Value | Wo finden |
|---|---|---|
| `SUPABASE_ACCESS_TOKEN` | Personal Access Token | https://supabase.com/dashboard/account/tokens |
| `SUPABASE_DB_PASSWORD` | DB-Passwort | Supabase Dashboard → Project Settings → Database → Database password |

→ Ohne diese Secrets läuft der Workflow weiter — er skippt sich selbst gracefully (keine Fail-Mails).

## Schritt 7 — Erste Anmeldung (1 Min)

```bash
# Falls Dev-Server nicht mehr läuft:
npm run dev
```

1. http://127.0.0.1:8080/login öffnen
2. Deine eigene E-Mail eintippen → **Magic-Link senden**
3. E-Mail öffnen, Link klicken
4. Du landest im Dashboard, wirst automatisch **Owner der Bergmann-Demo-Kanzlei** (`bootstrap_user_self` RPC handled das)

**Klappt das**: Backend, Auth, RLS alles funktioniert. ✅

## Schritt 8 — Provider-Setups (optional, je nach Use Case)

| Provider | Was es macht | Setup-Doku |
|---|---|---|
| **Vapi.ai** | Voice-Anrufe annehmen | https://docs.vapi.ai · Phone-Number provisionieren · Webhook eintragen `https://dsgenkjlkdzkoplnxebg.supabase.co/functions/v1/webhook-vapi` |
| **360dialog** | WhatsApp Business | https://docs.360dialog.com · Webhook eintragen `…/webhook-whatsapp` · Verify-Token + WHATSAPP_API_TOKEN setzen |
| **Resend** | Email Transactional | https://resend.com · Domain verifizieren · `RESEND_API_KEY` setzen · Inbound-Webhook `…/webhook-email` |
| **Stripe** | Online-Zahlung Rechnungen | https://stripe.com · `STRIPE_SECRET_KEY` setzen · Webhook `…/webhook-stripe` für `checkout.session.completed` · `STRIPE_WEBHOOK_SECRET` |

**Alle optional** — die Plattform funktioniert ohne diese Provider im Mock-Modus.

## Schritt 9 — Production-Deployment (5 Min)

### Frontend → Vercel oder Netlify

Vercel:
```bash
npm i -g vercel
vercel
# Folge dem Wizard. Wähle SPA / Vite-Build.
```

Env-Variablen in Vercel-Dashboard setzen:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- (optional) `VITE_SENTRY_DSN`

### Domain anbinden

In Vercel → Settings → Domains → Custom Domain hinzufügen.

In Supabase Dashboard → Authentication → URL Configuration:
- Site URL aktualisieren auf deine Production-Domain
- Redirect URLs: deine Production-URLs hinzufügen

## Was geht nicht ohne Externe / Wochen Setup

- **Echte Telefonnummer für Voice-KI** — Vapi-Provisioning + Number-Porting bei Telekom dauert Tage
- **WhatsApp Business approval** — Meta-Business-Verification dauert Wochen
- **beA-Schnittstelle** — Beck-online-Integration ist ein eigenes Projekt
- **Custom-Domain pro Tenant** — Wildcard-Cert + Vercel-Routing-Config

## Troubleshooting

**„permission denied for table users"**
→ Migration 0001 + 0002 nicht durchgelaufen. Erneut ausführen.

**Magic-Link-Mail kommt nicht**
→ Authentication → Logs → schauen. Standard-Supabase-SMTP hat oft Spam-Probleme. Custom-SMTP (Resend) konfigurieren.

**„Keine offene Einladung für …"**
→ Du bist nicht der erste User + hast keine Einladung. Owner muss dich via Team-Page einladen. Oder Demo-Tenant löschen + erste Person ist automatisch Owner.

**Stripe-Webhook firet nicht**
→ Webhook-URL falsch in Stripe-Dashboard. `STRIPE_WEBHOOK_SECRET` muss zum Endpoint passen, nicht globaler Secret.

## Checkliste

- [ ] Lokal läuft `npm run dev`
- [ ] Migrations 1-5 ausgeführt
- [ ] Seed ausgeführt
- [ ] Email-Templates angepasst
- [ ] ANTHROPIC_API_KEY gesetzt (optional)
- [ ] GitHub-Secrets gesetzt (optional)
- [ ] Erste Magic-Link-Anmeldung erfolgreich → ich bin Bergmann-Owner
- [ ] In `/dashboard/agenten` einen Agent pausieren → in DB sichtbar
- [ ] In `/dashboard/branding` Tonalität ändern → speichern → Toast erscheint
- [ ] In `/dashboard/mandanten` „Neuer Mandant" → Dialog → anlegen → Mandant erscheint
- [ ] In `/dashboard/voice` „Test-Anruf simulieren" → Dialog mit KI-Konversation
- [ ] Cmd+K drücken → Command-Palette öffnet sich
- [ ] Theme-Toggle → Dark Mode funktioniert
- [ ] Vercel-Deploy
- [ ] Custom-Domain angebunden

Wenn alle Häkchen → **Live.**
