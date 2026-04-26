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

## 3. Demo-Tenant + Owner-User anlegen

### 3a — Tenant per Seed

Im SQL Editor:

```sql
-- supabase/seed.sql Inhalt einfügen und Run
```

Oder per CLI:

```bash
psql "$SUPABASE_DB_URL" -f supabase/seed.sql
```

Ergebnis: Ein Demo-Tenant „Kanzlei Bergmann" mit ID `11111111-1111-1111-1111-111111111111`.

### 3b — Ersten Auth-User erstellen + zum Tenant verknüpfen

Ohne Auth-User kommst du nicht ins Dashboard (RLS verlangt `auth.uid()`).

**Im Supabase-Dashboard:**

1. Authentication → Users → **Add user** → **Create new user**
2. Email: deine echte E-Mail · Password: irgendwas (du benutzt eh Magic Link) · **Auto confirm email** anhaken
3. Danach im SQL Editor — die UUID des Users aus Authentication-Tab kopieren:

```sql
insert into public.users (id, tenant_id, email, name, role, avatar_initials)
values (
  'AUTH-USER-UUID-HIER',                               -- aus auth.users kopieren
  '11111111-1111-1111-1111-111111111111',              -- Bergmann-Tenant
  'deine@mail.de',
  'Dein Name',
  'owner',
  'DN'
);
```

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

## 6. Was als nächstes ansteht (Sprint 2.1+)

1. **Auto-Bootstrap der `public.users`-Zeile** beim ersten Login (RPC `bootstrap_user`)
2. **Module-für-Modul-Migration** der Mock-Daten:
   - Mandanten → Supabase Queries
   - Akten → Supabase Queries
   - Konversationen, Termine, Dokumente, Rechnungen, Aktivitäten, Strategien
3. **Storage-Upload** für Dokumente in Bucket `tenant-files`
4. **Audit-Log-Trigger** auf jeder Tabelle (write-only via Postgres-Trigger)
5. **GitHub Action** für automatisches `supabase db push` bei main-Push (mit GitHub-Secret)

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
