# Environment-Variablen — vollständige Referenz

> Alle Secrets, sortiert nach „wo gehört das hin?". **Die Frontend-Vars sind harmlos** und gehören in `.env.local` (gitignored). **Server-only Secrets gehören NUR ins Supabase-Dashboard** unter Edge-Function-Secrets — niemals ins Repo, niemals in den Chat.

## Frontend (Vite, in `.env.local`)

| Variable | Pflicht | Wert | Wo finden |
|---|---|---|---|
| `VITE_SUPABASE_URL` | ✅ | `https://dsgenkjlkdzkoplnxebg.supabase.co` | Project Settings → API |
| `VITE_SUPABASE_ANON_KEY` | ✅ | `sb_publishable_…` | Project Settings → API |
| `VITE_SENTRY_DSN` | ⬜ | Sentry-DSN | Sentry-Dashboard, optional |

→ Sicher exponiert in Browser. RLS schützt Daten.

## Server-only — Supabase Edge-Function-Secrets

Setzen unter: https://supabase.com/dashboard/project/dsgenkjlkdzkoplnxebg/settings/functions

### KI-Layer

| Secret | Pflicht | Wofür |
|---|---|---|
| `ANTHROPIC_API_KEY` | empfohlen | KI-Strategie, Triage, Doc-Analyse, Mahnung, Daten-Mapping. Ohne diesen Key liefern alle KI-Functions Mock-Antworten. |

### Voice / Telefonie

| Secret | Pflicht | Wofür |
|---|---|---|
| `VAPI_WEBHOOK_SECRET` | optional | HMAC-Verifikation des Vapi-Webhooks. Ohne → Webhook akzeptiert alle Requests. |

### WhatsApp (360dialog Cloud API)

| Secret | Pflicht | Wofür |
|---|---|---|
| `WHATSAPP_API_TOKEN` | für Versand | API-Token aus 360dialog-Hub |
| `WHATSAPP_PHONE_NUMBER_ID` | für Versand | Phone-Number-ID des Business-Accounts |
| `WHATSAPP_VERIFY_TOKEN` | für Webhook-Setup | Frei wählbar, im Provider-Dashboard eintragen |
| `WHATSAPP_WEBHOOK_SECRET` | optional | HMAC-Verifikation eingehender Webhooks |

### Email (Resend)

| Secret | Pflicht | Wofür |
|---|---|---|
| `RESEND_API_KEY` | für Versand | API-Key aus https://resend.com/api-keys |
| `EMAIL_WEBHOOK_SECRET` | optional | HMAC-Verifikation Inbound-Mails |

### Stripe (Online-Zahlung)

| Secret | Pflicht | Wofür |
|---|---|---|
| `STRIPE_SECRET_KEY` | für Checkout | `sk_live_…` aus https://dashboard.stripe.com/apikeys |
| `STRIPE_WEBHOOK_SECRET` | für Webhook | `whsec_…` aus dem Webhook-Endpoint nach Anlegen |

## Server-only — GitHub Repo-Secrets

Setzen unter: Repo → Settings → Secrets and variables → Actions

| Secret | Pflicht | Wofür |
|---|---|---|
| `SUPABASE_ACCESS_TOKEN` | für Auto-Deploy | Personal Access Token aus https://supabase.com/dashboard/account/tokens |
| `SUPABASE_DB_PASSWORD` | für Auto-Deploy | DB-Passwort aus Project Settings → Database |

→ Mit beiden Secrets: jedes `git push origin main` mit Änderungen in `supabase/migrations/**` oder `supabase/functions/**` deployed automatisch.

## Mock-Mode-Verhalten

Solange Secrets fehlen, läuft alles im **Mock-Mode**:

| Function | Ohne Key macht sie… |
|---|---|
| `generate-strategie` | Liefert Mock-Text statt KI-Generation |
| `triage-inbox` | Liefert generischen Vorschlag |
| `analyze-document` | Liefert „Mock — KI nicht konfiguriert" |
| `generate-mahnung` | Liefert generischen Mahn-Text |
| `import-data` | Heuristisches Mapping statt KI |
| `send-message` | Schreibt nur in DB, sendet nicht |
| `stripe-checkout` | Demo-URL statt echte Session |

UI funktioniert immer. User kann alles durchklicken.

## Webhook-URLs für Provider

Nach Deploy stehen diese URLs zur Verfügung:

```
https://dsgenkjlkdzkoplnxebg.supabase.co/functions/v1/webhook-vapi
https://dsgenkjlkdzkoplnxebg.supabase.co/functions/v1/webhook-whatsapp
https://dsgenkjlkdzkoplnxebg.supabase.co/functions/v1/webhook-email
https://dsgenkjlkdzkoplnxebg.supabase.co/functions/v1/webhook-stripe
```

**Im jeweiligen Provider-Dashboard eintragen.**

## Schnell-Setup-Reihenfolge

1. **Lokal:** `.env.local` mit `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (siehe `.env.example`)
2. **Migrationen ausführen** — siehe `docs/SUPABASE_SETUP.md`
3. **Bergmann-Demo-Tenant seeden** — `supabase/seed.sql`
4. **Erste Person einloggen** → wird automatisch Owner via `bootstrap_user_self`
5. **Optional**: Anthropic-Key setzen für echte KI
6. **Optional**: Stripe/Resend/360dialog/Vapi-Keys nur wenn echtes Vendor-Setup gewünscht
7. **Optional**: GitHub-Secrets setzen für Auto-Deploy

## Sicherheits-Recap

- ✅ `.env.local` ist gitignored
- ✅ Anon-Key ist Frontend-safe (RLS schützt)
- ❌ **Service-Role-Key niemals teilen** (auch nicht im Chat)
- ❌ **Stripe-Secret-Key niemals teilen**
- ❌ **Anthropic-API-Key niemals teilen**
- 🔄 Bei Verdacht eines Leaks: sofort im jeweiligen Provider-Dashboard rotieren
