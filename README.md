# SYSTEMS™ Plattform

> Die SaaS-Plattform, auf der die Anwaltskanzlei der nächsten Generation läuft. Multi-Tenant, White-Label, in 24 Stunden live. Voice-Agent · KI-Inbox · Termin-Koordination · Dokumenten-Analyse · Mahnwesen — alles autonom, alles unter eigener Domain.

[![CI](https://github.com/systemsforfuture/elite-law-studio/actions/workflows/ci.yml/badge.svg)](https://github.com/systemsforfuture/elite-law-studio/actions/workflows/ci.yml)

## Was hier drin ist

### Marketing & Onboarding
- `/` — SYSTEMS-Marketing-Seite (verkauft die Plattform an Kanzleien)
- `/template/kanzlei` — White-Label-Demo: so sieht die Funnel-Seite einer Kanzlei aus
- `/onboarding` — 6-Step-Wizard mit echter Tenant-Erstellung + Magic-Link
- `/login` — Kanzlei-Login (Anwälte/Mitarbeiter)
- `/portal` — Mandanten-Login
- `/portal/dashboard` — Mandanten-Sicht (Status / Nachrichten / Termine / Dokumente / Rechnungen)

### Kanzlei-Admin-Dashboard (`/dashboard/*`)
14 Module:

| Route | Inhalt |
|---|---|
| `/dashboard` | KPIs, KI-Aktivität (live), kritische Fristen, Vapi-Guthaben |
| `/dashboard/voice` | Anrufprotokoll + Transcript-Player + **Test-Anruf-Simulator** |
| `/dashboard/inbox` | Email/WhatsApp-Triage mit KI-Vorschlag + echtem Versand |
| `/dashboard/agenten` | Konfig der 6 KI-Agenten (Pause / Threshold / Custom Prompt) |
| `/dashboard/mandanten` | CRM mit Activity-Timeline · Neuer-Mandant-Dialog |
| `/dashboard/akten` | Akten + **KI-Anwaltsstrategie-Generator mit Iteration** |
| `/dashboard/termine` | Monats-Kalender, Wiedervorlagen |
| `/dashboard/dokumente` | Upload + KI-Klausel-Analyse + PDF-Vorschau |
| `/dashboard/mahnwesen` | 4-stufige Eskalations-Pipeline mit KI-Mahn-Generator |
| `/dashboard/import` | Excel/CSV/RA-MICRO/DATEV → KI-Auto-Mapping → Bulk-Insert |
| `/dashboard/branding` | Domain · Farben · Voice-Branding (persistent in DB) |
| `/dashboard/team` | Team mit echtem Invite-Flow + Detail-Profile |
| `/dashboard/abrechnung` | Subscription · Telefon-Guthaben · Stripe-Top-up |
| `/dashboard/audit` | Live Audit-Log + Compliance-Status (DSGVO) |

## Tech-Stack

- **Frontend**: Vite + React 18 + TypeScript + Tailwind + shadcn/ui + react-query
- **Backend**: Supabase (Postgres 16 + RLS + Auth + Storage + Realtime + Edge Functions)
- **KI**: Anthropic Claude (Haiku/Sonnet/Opus je nach Task-Komplexität)
- **CI/CD**: GitHub Actions — `ci.yml` (typecheck/build/test) + `supabase-deploy.yml` (auto-deploy)

## Edge Functions (14)

Alle deployen sich automatisch beim Push nach `main` mit Änderungen unter `supabase/functions/**`.

**KI-Functions** (User-JWT):
- `generate-strategie` — Anwalts-Strategie aus Akte (Opus)
- `triage-inbox` — Email/WhatsApp Kategorisierung + Antwort-Vorschlag (Sonnet)
- `analyze-document` — PDF/Image-Analyse mit Klausel-Extraktion (Sonnet Vision)
- `generate-mahnung` — 4-stufige Mahn-Texte mit §288 BGB (Sonnet)
- `import-data` — Excel/CSV → KI-Auto-Mapping (Haiku)
- `send-message` — Outbound Email (Resend) + WhatsApp (360dialog)
- `stripe-checkout` — Stripe-Checkout-Session für Rechnungen

**Public** (`--no-verify-jwt`):
- `capture-lead` — Kontakt-Form-Endpoint für Funnel-Seiten
- `create-tenant` — Onboarding-Wizard erzeugt Tenant + Magic-Link

**Webhooks** (HMAC-secured):
- `webhook-vapi` — Voice-Anrufe → Konversationen
- `webhook-whatsapp` — Inbound WA → Konversationen + Auto-Triage
- `webhook-email` — Inbound Mails → Konversationen + Auto-Triage
- `webhook-stripe` — Payment-Events → Rechnung als bezahlt

## Schema (Migration 0001-0004)

11 Tabellen: `tenants`, `users`, `mandanten`, `akten`, `konversationen`, `termine`, `dokumente`, `rechnungen`, `activities`, `anwalts_strategien`, `audit_log`, `tenant_invitations`. Alles RLS-geschützt mit `current_tenant_id()` als Tenant-Boundary. Audit-Log via Postgres-Trigger.

## Setup (für Entwickler)

```bash
# 1. Repo klonen
git clone https://github.com/systemsforfuture/elite-law-studio.git
cd elite-law-studio
npm install

# 2. Env konfigurieren
cp .env.example .env.local
# .env.local mit VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY befüllen

# 3. Lokale Entwicklung
npm run dev

# 4. Backend deployen
# Siehe docs/SUPABASE_SETUP.md
```

## Dokumentation

- [`docs/SUPABASE_SETUP.md`](docs/SUPABASE_SETUP.md) — Step-by-Step Backend-Setup
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — Architektur-Entscheidungen (8 ADRs)
- [`docs/ENVIRONMENT.md`](docs/ENVIRONMENT.md) — Vollständige Env-Var-Referenz

## Sicherheit & DSGVO

- Hosting in Frankfurt (Supabase EU)
- Multi-Tenant-Isolation via Postgres RLS auf 3 Layern
- Audit-Log auf jeder Datentabelle
- §43e BRAO konform
- Beschlagnahmefrei (Daten werden so gespeichert, dass keine Behörde direkten Zugriff bekommt)

## Lizenz

Proprietär · © SYSTEMS GmbH 2026.
