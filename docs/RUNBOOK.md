# SYSTEMS™ — End-to-End Deploy-Runbook

> Schritt-für-Schritt-Anleitung vom Repo zum Live-System mit echten KI-Agenten.
> Ziel: 60 Minuten von 0 auf produktiv. Reihenfolge strikt einhalten.

---

## 0. Vorab-Check

Diese Punkte müssen vor dem Deploy erledigt sein:

- [ ] Supabase-Projekt existiert (URL + Anon-Key bekannt)
- [ ] Vercel-Account vorhanden + GitHub-Repo verbunden
- [ ] `supabase` CLI lokal installiert (`brew install supabase/tap/supabase` oder `npm i -g supabase`)
- [ ] Anthropic-Account mit API-Key (Tier 2+ wegen Sonnet/Opus)
- [ ] Optional: Vapi (Voice), 360dialog (WhatsApp), Resend (Email), Stripe (Zahlungen) Accounts

**Faustregel**: Mit nur Anthropic + Supabase + Vercel funktioniert die Plattform zu ~80% live. Die externen Provider sind add-ons.

---

## 1. Datenbank deployen

```bash
# Lokale Supabase-Verbindung herstellen
supabase login
supabase link --project-ref <project-ref>

# Schema deployen (alle 7 Migrationen)
supabase db push
```

Das deployed:
1. `20260426120000_init_schema.sql` — 12 Tabellen, Enums, RLS-Policies
2. `20260426130000_bootstrap_and_audit.sql` — Helper-RPCs + Audit-Trigger
3. `20260426140000_tenant_update_policy.sql` — Tenant-Self-Update-Policy
4. `20260426150000_agent_config.sql` — Agent-Konfiguration JSONB
5. `20260426160000_mandant_auth.sql` — Mandanten-Login-Schema
6. `20260427100000_personal_modul.sql` — HR-Modul (Zeiterfassung, Urlaub)
7. `20260427120000_security_hardening.sql` — Privilege-Escalation-Schutz

**Verify** im Supabase-Dashboard → Database → Tables. Du solltest 15 public-Tables sehen.

---

## 2. Storage-Bucket einrichten

```sql
-- Im Supabase SQL-Editor ausführen
insert into storage.buckets (id, name, public) values ('tenant-files', 'tenant-files', false);
```

Storage-RLS-Policies sind bereits via Migration 0001 angewendet.

---

## 3. Edge Functions deployen

```bash
supabase functions deploy
```

Das deployed alle 16 Funktionen:
- `analyze-document` — KI-Dokumenten-Analyse
- `assistant-chat` — globaler KI-Assistent
- `capture-lead` — Lead-Webhook
- `create-tenant` — Onboarding
- `generate-mahnung` — KI-Mahnung
- `generate-strategie` — KI-Akten-Strategie
- `import-data` — CSV-Bulk-Import
- `seed-demo-data` — Demo-Daten-Seed
- `send-message` — Email/WhatsApp-Outbound
- `stripe-checkout` — Mandanten-Zahlung
- `triage-inbox` — Inbox-KI-Vorschlag
- `webhook-email` — Email-Inbound
- `webhook-stripe` — Stripe-Webhook
- `webhook-vapi` — Voice-Anruf-Webhook
- `webhook-whatsapp` — WhatsApp-Inbound

---

## 4. Function-Secrets setzen

```bash
# KI-Provider — PFLICHT
supabase secrets set ANTHROPIC_API_KEY=sk-ant-xxxxx

# Email-Versand — PFLICHT für Magic-Links
supabase secrets set RESEND_API_KEY=re_xxxxx

# Webhook-Strict-Mode — PFLICHT in Production
supabase secrets set WEBHOOK_STRICT=true

# Optional je nach aktiviertem Modul:
supabase secrets set STRIPE_SECRET_KEY=sk_live_xxxxx
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxxxx
supabase secrets set VAPI_API_KEY=vapi_xxxxx
supabase secrets set VAPI_WEBHOOK_SECRET=xxxxx
supabase secrets set WHATSAPP_API_KEY=xxxxx
supabase secrets set WHATSAPP_WEBHOOK_SECRET=xxxxx
supabase secrets set EMAIL_WEBHOOK_SECRET=xxxxx
```

**Wichtig:** `WEBHOOK_STRICT=true` lehnt jeden Webhook ohne gültige HMAC-Signatur ab. Ohne dieses Flag sind die Webhook-Endpoints unsicher.

---

## 5. Frontend deployen (Vercel)

In Vercel-Dashboard → Project Settings → Environment Variables:

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhb…
VITE_SENTRY_DSN=https://…  # optional
```

```bash
# Lokal pushen, Vercel deployed automatisch
git push origin main
```

Nach 90 Sekunden ist die Plattform unter `https://<project>.vercel.app` erreichbar.

---

## 6. Custom-Domain + DNS

Vercel-Dashboard → Project → Domains → Add `systems-tm.de`.

DNS bei deinem Registrar:
```
A     @       76.76.21.21
CNAME www     cname.vercel-dns.com
```

Wildcard für Tenant-Subdomains (z.B. `bergmann.systems-tm.de`):
```
CNAME *       cname.vercel-dns.com
```

---

## 7. Auth-Templates anpassen

Supabase-Dashboard → Authentication → Email Templates:

- **Magic-Link-Template** ersetzen mit `supabase/templates/magic-link.html`
- **Invite-Template** ersetzen mit `supabase/templates/invite.html`

Diese sind in SYSTEMS-Branding (navy + gold) gestaltet.

---

## 8. Realtime aktivieren

Supabase-Dashboard → Database → Replication:

Realtime einschalten für:
- `mandanten`
- `akten`
- `konversationen`
- `termine`
- `dokumente`
- `rechnungen`
- `activities`
- `anwalts_strategien`
- `audit_log`
- `zeiterfassung`
- `urlaub_antraege`

---

## 9. Smoke-Test gegen Production

1. **Onboarding-Flow** durchgehen:
   ```
   https://systems-tm.de/onboarding
   ```
   Test-Kanzlei anlegen, Magic-Link kommt per Email an.

2. **Magic-Link** in Inbox klicken → Dashboard öffnet sich.

3. **Demo-Daten anlegen** (Empty-Tenant-Banner) → 3 Mandanten + Akten + Termine erscheinen.

4. **KI-Strategie** in einer Akte generieren → Sonnet antwortet in 5–15s mit JSON-Strategie.

5. **DATEV-Export** im Mahnwesen → CSV-Download.

6. **KI-Assistent** öffnen (`⌘/`) → »Tagesprios« fragen → kontextsensitive Antwort mit echten Zahlen.

---

## 10. Monitoring + Observability

**Sentry** (optional):
```bash
# In Vercel-Env hinzufügen
VITE_SENTRY_DSN=https://xxxxx@sentry.io/yyyyy
```

**Supabase-Logs** durchgehen:
- Database → Logs → Query-Errors
- Edge Functions → jede Function einzeln → Logs

---

## Troubleshooting

### Magic-Link kommt nicht an
- `RESEND_API_KEY` gesetzt?
- Sender-Domain bei Resend verifiziert?
- Spam-Folder geprüft?

### KI-Antworten dauern ewig
- Anthropic Tier 1 hat enge Rate-Limits → Tier 2+ upgraden
- Sonnet-Latenz live ist 3–8s — das ist normal

### »tenant_not_resolvable« in Webhook-Logs
- Tenant hat keine `notfall_nummer` oder `domain` gesetzt für die eingehende Quelle
- Dashboard → Setup → Tenant editieren

### »Ungültige Webhook-Signatur«
- `WEBHOOK_STRICT=true` aktiv aber Provider-Secret nicht gesetzt
- Provider sendet Signatur in Upper-Case Hex (Stripe) → bereits gefixt, ggf. Funktion redeployen

### Demo-Daten-Button erscheint nicht
- Empty-Tenant-CTA zeigt sich nur bei 0 Mandanten + 0 Akten + 0 Rechnungen
- Wenn schon Daten da: Daten erst löschen oder direkt Mandanten anlegen

---

## Roll-Out-Checkliste pro Kanzlei

Wenn ein Anwalt sich anmeldet:

- [ ] Onboarding ausgefüllt (Kanzlei-Name, Inhaber, Email, Tier, Branding)
- [ ] Magic-Link geklickt → Owner-Bootstrap erfolgreich
- [ ] Demo-Daten angelegt ODER eigene CSV importiert
- [ ] Team eingeladen (mind. 1 Anwalt + 1 Mitarbeiter)
- [ ] Voice-Test im Voice-Page durchgeführt
- [ ] Voice-Provider (Vapi-Phone-Number) auf SYSTEMS-Webhook gestellt
- [ ] WhatsApp-Provider (360dialog) auf SYSTEMS-Webhook gestellt
- [ ] Email-Provider (Resend) auf SYSTEMS-Webhook gestellt
- [ ] Branding angepasst (Logo, Farben, Tonalität)
- [ ] Subscription via Stripe aktiviert

---

## Post-Launch-Monitoring (erste 14 Tage)

Tägliche Spot-Checks:
- Audit-Log lückenlos? (Supabase-Dashboard → SQL: `select count(*), max(ts) from audit_log;`)
- Edge-Function-Errors? (Supabase → Functions → Logs)
- Anthropic-Token-Verbrauch im Anthropic-Dashboard
- Stripe-Zahlungen?

Bei Mass-Issues:
1. Vercel zurück auf vorherigen Deploy
2. Migration via `supabase db rollback` rückgängig wenn nötig
3. Sentry-Issues durchgehen
