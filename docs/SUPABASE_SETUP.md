# Supabase-Setup — Schritt-für-Schritt

> Anleitung zum Verbinden des `dsgenkjlkdzkoplnxebg`-Supabase-Projekts mit dem
> `elite-law-studio`-Repo. Ein einmaliger Initial-Setup, dauert ~15 Min.

## 1. Lokale .env.local anlegen (auf deinem Rechner)

Im Repo-Root:

```bash
cp .env.example .env.local
```

`.env.local` öffnen und die Werte eintragen — diese Datei ist **gitignored**, landet nie im Repo:

```bash
VITE_SUPABASE_URL=https://dsgenkjlkdzkoplnxebg.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_lZZzyf9AKA2Je_vBoEwMAQ_71dio9_W
```

`npm run dev` neustarten — der Login-Screen sollte das gelbe „Demo-Modus"-Banner verlieren und stattdessen Magic-Link-Modus zeigen.

## 2. Migration im Supabase-Dashboard anwenden

Die Schema-Datei liegt unter `supabase/migrations/20260426120000_init_schema.sql`. Zwei Optionen:

### Option A — SQL Editor (empfohlen, kein CLI-Setup)

1. Öffne https://supabase.com/dashboard/project/dsgenkjlkdzkoplnxebg/sql/new
2. Inhalt der Datei `supabase/migrations/20260426120000_init_schema.sql` reinkopieren
3. **Run** klicken (unten rechts)
4. Erfolg: „Success. No rows returned" + alle Tabellen erscheinen im Schema-Tab

### Option B — Supabase CLI (für Profis)

```bash
# Einmalig
brew install supabase/tap/supabase   # oder: npm i -g supabase
supabase login                        # öffnet Browser, generiert Personal Access Token
supabase link --project-ref dsgenkjlkdzkoplnxebg

# Migration deployen
supabase db push
```

CLI fragt nach dem **DB-Passwort** — das findest du im Dashboard unter:
Settings → Database → Database password (Reset wenn vergessen).

> ⚠️ Das DB-Passwort gehört nur lokal in `.env.local` als `SUPABASE_DB_URL` oder in den GitHub-Actions-Secrets — niemals in den Chat oder ins Repo.

## 3. Demo-Tenant per Seed anlegen

Im SQL Editor:

```sql
-- supabase/seed.sql Inhalt einfügen und Run
```

Ergebnis: Ein Demo-Tenant „Kanzlei Bergmann" mit ID `11111111-1111-1111-1111-111111111111`.

> **Auto-Bootstrap aktiv:** Du musst dich **nicht** mehr manuell zur public.users-Tabelle hinzufügen. Sobald du dich per Magic Link einloggst, ruft die App `bootstrap_user_self()` auf:
> - **Erste Person** im System → wird automatisch Bergmann-Owner
> - **Eingeladene Personen** → werden automatisch dem einladenden Tenant zugeordnet (über `invite_user`-RPC)
> - **Andere** → bekommen Fehlermeldung „Keine offene Einladung"

## 4. Email-Templates für Magic Link anpassen (optional)

Authentication → Email Templates → **Magic Link** Template:

```
Subject: Ihr SYSTEMS™ Login-Link

<h2>Anmeldung bei SYSTEMS™</h2>
<p>Klicken Sie auf den Link unten, um sich anzumelden:</p>
<p><a href="{{ .ConfirmationURL }}">In SYSTEMS™ anmelden</a></p>
<p>Der Link ist 1 Stunde gültig.</p>
```

Authentication → URL Configuration → **Site URL**: `http://127.0.0.1:5173` (lokal) bzw. später deine Production-Domain.
**Redirect URLs**: füge `http://127.0.0.1:5173/auth/callback` und Production-Variante hinzu.

## 5. Login-Test

1. `npm run dev` starten
2. http://127.0.0.1:5173/login öffnen
3. Eigene E-Mail eintippen → **Magic-Link senden**
4. E-Mail-Inbox checken, Link klicken → Du landest im Dashboard

Wenn das klappt: **Schema, RLS, Auth funktionieren.** Backend-Foundation steht.

## 5b. KI-Edge-Functions konfigurieren (für echte KI-Antworten)

Fünf Edge Functions sind im Repo (`supabase/functions/`):

| Function | Zweck | Auth |
|---|---|---|
| `generate-strategie` | Anwalts-Strategie aus Akte generieren | User-JWT |
| `triage-inbox` | Email/WhatsApp kategorisieren + Antwort vorschlagen | User-JWT |
| `analyze-document` | Dokumente analysieren (PDF/Image), Klauseln/Fristen extrahieren | User-JWT |
| `capture-lead` | Lead aus Kontakt-Formular speichern | öffentlich |
| `create-tenant` | Onboarding-Wizard: Tenant + Owner-Einladung anlegen | öffentlich |

### Deployment

Per CLI:
```bash
supabase functions deploy generate-strategie
supabase functions deploy triage-inbox
supabase functions deploy analyze-document
supabase functions deploy capture-lead --no-verify-jwt
supabase functions deploy create-tenant --no-verify-jwt
```

`capture-lead` und `create-tenant` brauchen `--no-verify-jwt` weil sie ohne Login aufgerufen werden (Marketing-Forms bzw. Wizard).

### Anthropic-API-Key setzen

Damit die KI tatsächlich antwortet (statt Mock-Strings):

Option A — Dashboard:
- https://supabase.com/dashboard/project/dsgenkjlkdzkoplnxebg/settings/functions
- Section **Edge Function Secrets** → **Add new secret**
- Name: `ANTHROPIC_API_KEY` · Value: `sk-ant-api03-…` (aus https://console.anthropic.com/settings/keys)

Option B — CLI:
```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-api03-...
```

> Ohne Key liefern die Functions Mock-Antworten zurück. Die UI funktioniert trotzdem — du siehst gut formatierte Beispiel-Outputs.

> **Sicherheit:** Der Anthropic-Key ist NUR Server-side (Edge Function Secret). Niemals im Frontend, niemals im Repo. Bei Leak: in Anthropic Console rotieren.

## 6. Auto-Deploy aktivieren (optional, einmalige 2-Min-Aktion)

Damit zukünftige Migrations automatisch deployen wenn du auf `main` pushst — **nie wieder manuell SQL Editor öffnen.**

GitHub Repo → **Settings → Secrets and variables → Actions → New repository secret**:

| Secret-Name | Wert | Wo finden |
|---|---|---|
| `SUPABASE_ACCESS_TOKEN` | Personal Access Token | https://supabase.com/dashboard/account/tokens → **Generate new token** |
| `SUPABASE_DB_PASSWORD` | DB-Passwort des Projekts | Supabase Dashboard → Project Settings → Database → **Database password** (Reset wenn vergessen) |

Workflow-Datei: `.github/workflows/supabase-deploy.yml` — triggert bei jedem Push auf `main` mit Änderungen in `supabase/migrations/`.

> Der Personal Access Token gibt **account-weite** Rechte. Der ist NUR im GitHub-Secret — nirgendwo sonst. Bei Verdacht: in Supabase widerrufen.

## 7. Was als nächstes ansteht

Migrations-Backlog (alle bereits in dieser Codebase geplant):

- **Sprint 2.1** ✅ Auto-Bootstrap Bootstrap (`bootstrap_user_self`) + Audit-Trigger
- **Sprint 2.2 – 2.4** ✅ Alle Module nutzen jetzt `react-query` Hooks mit graceful fallback
  - Mandanten, Akten, Strategien, Termine, Dokumente, Rechnungen, Konversationen, Activities, Team
- **Sprint 2.5** ✅ Storage-Upload-Hook (`useUploadDokument`) bereit
- **Sprint 2.6** ✅ Audit-Triggers Postgres-side
- **Sprint 2.7** ✅ GitHub Action für `supabase db push` bei main-Push

Noch offen (Sprint 3+):

1. KI-Edge-Functions: Strategie-Generierung, Inbox-Triage, Voice-Webhook
2. Tatsächliche Daten-Migration aus RA-MICRO/DATEV (Importer-Backend)
3. Type-Generierung: `supabase gen types typescript --project-id dsgenkjlkdzkoplnxebg > src/lib/database.types.ts`
4. Email-Templates: Magic-Link, Einladung, Mahnung-Templates polieren
5. Beobachtbarkeit: Sentry / Logflare / pg_stat_statements

## Troubleshooting

**„permission denied for table users"** beim Login
→ Du hast vergessen Schritt 3b (User-Zeile in `public.users` anlegen). Ohne diese Zeile liefert `current_tenant_id()` NULL und alle RLS-Policies blocken.

**„Magic Link is invalid or has expired"**
→ Site URL / Redirect URLs nicht konfiguriert (Schritt 4) oder Link auf anderem Gerät geöffnet.

**Demo-Modus-Banner bleibt im Login obwohl `.env.local` gefüllt**
→ Vite-Dev-Server neu starten (`Ctrl+C` und nochmal `npm run dev`) — Env-Variablen werden nur beim Start gelesen.

**„relation public.users does not exist"**
→ Migration aus Schritt 2 wurde nicht ausgeführt oder fehlgeschlagen. Erneut ausführen.

## Sicherheit — Erinnerung

- ✅ `.env.local` ist gitignored — niemals committed
- ✅ Anon-Key ist im Frontend exposed — by design safe (RLS schützt)
- ❌ **Service-Role-Key niemals im Frontend, niemals im Repo, niemals im Chat**
- ❌ **DB-Passwort niemals im Repo, niemals im Chat**
- 🔄 Bei Verdacht eines Leaks: Dashboard → Settings → API → **Reset anon key** und/oder DB-Passwort
