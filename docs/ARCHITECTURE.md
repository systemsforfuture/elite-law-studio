# SYSTEMS™ Plattform — Architektur-Entscheidungen

> Internes Dokument für Engineering. Status v1 (April 2026). Ergänzt DEV SPEC v1.0.

## ADR-001 — KI-Provider: Anthropic Claude, zentral abgerechnet

**Entscheidung:** SYSTEMS hostet einen einzigen Anthropic-Account und ruft die API mit unserem Server-Key. Kanzleien verbinden **nicht** ihren eigenen Anthropic-Account.

### Begründung

| Option | Pro | Contra |
|---|---|---|
| Lawyer-eigener Anthropic-Key | DSGVO-Verantwortlichkeit klar | Kein Onboarding-Flow möglich (Kanzleien haben keine Keys), keine Marge, kein Modell-Routing möglich |
| **SYSTEMS-zentraler Key** ✓ | Einfaches Onboarding, Modell-Routing möglich, Marge eingebaut, AVV deckt das ab | Wir tragen Cost-Risiko, müssen Token zählen |
| Self-Hosting (Ollama) | Kostenkontrolle theoretisch | Modell-Qualität reicht nicht für deutsche Rechtssprache, GPU-Wartung, Latenz |

### Cost-Recovery-Modell

Subscription-Preise sind so kalkuliert, dass **75% Bruttomarge** bei einem typischen Tenant erreicht wird:

```
Growth-Tier MRR:                           990 €/mo

— Stack-Kosten —
Claude Sonnet 4.7 (typischer Verbrauch):  ~99 €
Vapi Voice (300 Min, im Subscription):    ~120 €  ← optionaler Pre-Paid-Topup
Supabase EU (Frankfurt):                   ~25 €
Vercel Pro:                                ~20 €
360dialog WhatsApp Business:               ~30 €
Resend:                                    ~10 €
                                          ─────
                                          ~304 €

Bruttomarge:                               686 € / 69%
```

Bei **Foundation-Tier (490€)** rechnen wir mit ~60% Marge da Volumen niedriger.
Bei **Premium (1.890€)** ~75% Marge plus dedicated CSM-Aufwand.

### Modell-Routing (Kosten-Optimierung)

Statt überall Sonnet/Opus, gezielt billigere Modelle einsetzen:

| Task | Modell | Begründung |
|---|---|---|
| Spam-Erkennung, Sprache-Detect, Klassifikation | Claude **Haiku 4.5** | ~10× billiger, Klassifikation ausreichend |
| Email-Triage, WhatsApp Standard | Sonnet 4.7 | Tonalität-sensitiv |
| Voice-Receptionist | Sonnet 4.7 | Latenz + Tonalität |
| Dokumenten-Analyse (Vision) | Sonnet 4.7 | Genauigkeit |
| Anwalts-Strategie | **Opus 4.7** (Premium) / Sonnet (Growth) | Komplexes juristisches Reasoning |

Routing-Layer wird in `apps/web/lib/ai/router.ts` zentralisiert. Geschätzte Cost-Reduktion: **30-40%**.

### Vapi-Telefon-Guthaben (Pre-Paid)

Sprach-Volumen variiert stark zwischen Kanzleien (Soloanwalt vs. 30-Personen-Kanzlei). Lösung:

- Subscription deckt **inkludiertes Minutenkontingent** ab (Foundation 200, Growth 500, Premium 1500)
- Darüber hinaus: Pre-Paid-Aufladung via Stripe
- Im Dashboard sichtbar als „Vapi-Guthaben" (siehe `/dashboard/abrechnung`)
- Auto-Top-up optional ab definiertem Schwellwert

Macht uns auch nicht angreifbar wenn ein Kunde plötzlich 10.000 Min/Mo verbraucht.

## ADR-002 — Multi-Tenant: Postgres RLS, kein Schema-per-Tenant

Entschieden, in Spec §5 begründet. Alle App-Tabellen haben `tenant_id`-Spalte + RLS-Policy. Tenant-Auflösung dreistufig: Domain → JWT → Session. Mismatch = 401.

## ADR-003 — Voice: Vapi.ai bis Kunde 50, dann Eigenbau

Wirtschaftlich validiert in Spec §3:

- Vapi: ~25k€ Mehrkosten/Jahr ggü. Eigenbau, aber Time-to-Market 4-6 Wochen schneller
- Eigenbau (Twilio + Deepgram + ElevenLabs + Claude) lohnt sich wirtschaftlich erst ab ~50 Kunden
- Migrations-Pfad: gleiche Telefonnummer behalten, nur Backend tauschen

## ADR-004 — Frontend: bei Vite + React, kein Next.js-Migrationszwang

Spec sieht Next.js 15 vor. Wir bleiben bewusst beim Vite-Setup für v1 weil:

- Existierendes Template mit Lovable-Integration funktioniert
- Frontend ist überwiegend Marketing + Authenticated SPA — SSR nicht zwingend
- Bei Skalierungsbedarf Migration in Sprint 4 möglich (Next.js App-Router ist API-kompatibel mit React-Router-Patterns)

Backend wird als separate API-Schicht aufgesetzt — Optionen:
1. **Hono auf Vercel/Cloudflare-Workers** — leichtgewichtig, EU-Edge, gut zu Supabase-Auth passend
2. Next.js API Routes — wenn wir später migrieren
3. Supabase Edge Functions — ausreichend für einfache RPC

Empfehlung: **Hono**, weil DSGVO-konformes Edge-Hosting in Frankfurt einfacher als Cloudflare/Vercel-Lambda mit US-Cold-Starts.

## ADR-005 — Anwalts-Strategie-Generator: Opus für Premium, Sonnet sonst

Killer-Feature, das in Akten-Detail-Seite integriert ist (`/dashboard/akten/<id>` → Tab „KI-Strategie").

**Pipeline:**
1. Eingabe: Akte + verknüpfte Dokumente + Konversationen + Mandanten-Notizen
2. Tool-Use Phase 1: Claude ruft `getRelevantBGB()`, `getBAGRulings()`, `getCaseHistory()` (Tool-Use statt Generierung → reduziert Halluzination)
3. Generation Phase: Strukturierter Output (Sachverhalt → Einordnung → Risiken → Optionen → Empfehlung → Schriftsatz-Skizze → Nächste Schritte)
4. Versionierung: Anwalt kann via Iteration-Prompt verfeinern, jede Version persistiert
5. Status-Workflow: draft → review → freigegeben

**Anti-Halluzination:**
- Constitutional Constraints im System-Prompt (keine spezifischen Schadensersatzbeträge erfinden, keine Mandanten-Daten erfinden)
- Tool-Use für Rechtsprechung (Anbindung an juris/beck-online geplant Sprint 5)
- Confidence-Score pro Strategie, < 0,80 = Warnung im UI

**Kosten pro Strategie-Generation:** ~0,18€ (Sonnet) bis ~0,90€ (Opus). Bei 5 Generationen/Akte/Mo und 100 aktiven Akten = ~90€/Mo zusätzliche KI-Kosten — passt in Marge.

## ADR-006 — Dokumenten-Versand & digitale Mandats-Signatur

Status: **noch nicht implementiert**, wird Sprint 3.

Anforderungen:
- Vorlagen-System für Standard-Schriftsätze (Mahnung, Klage, Vollmacht)
- Mail-Merge mit Mandanten-/Akten-Daten
- DocuSign- oder eIDAS-konforme Signatur (FES für Mandant, QES für Anwalt-Signatur)
- Automatische Übergabe ans beA bei gerichtlichen Schriftsätzen (Phase 2)

Mögliche Quelle: **getmydeal-Repo** (siehe Backlog) — falls dort Komponenten für Doc-Erstellung/Versand/Signatur existieren, prüfen und portieren statt neu bauen.

## ADR-007 — Mandanten-Portal (Client-Seite)

Status: **separates Sub-Projekt**, geplant Sprint 4.

Aktuell ist `/dashboard/*` ausschließlich Kanzlei-Admin-Sicht (Anwälte, Mitarbeiter). Mandanten haben noch keinen Login. White-Label-Mandantenportal wird unter `kanzlei-domain.de/portal` ausgeliefert mit eigenständiger Auth (Magic Links).

**Funktionalität (geplant):**
- Fall-Status-Tracker (vereinfachte Sicht der Akte)
- Sichere Nachrichten an Anwalt
- Dokumenten-Upload + Download
- Termin-Übersicht + Self-Service-Buchung
- Rechnungs-Einsicht + Online-Zahlung

Das alte `Dashboard.tsx`/Mandant-View aus dem Bergmann-Template ist wiederverwendbar als Ausgangspunkt — bewusst aus diesem Repo gelöscht, aber in Git-Historie verfügbar (`git show <commit>:src/pages/Dashboard.tsx`).

## ADR-008 — Audit & DSGVO

Spec §13 implementiert auf UI-Ebene. Backend-Anforderungen:

- Audit-Log-Tabelle mit Trigger auf jeder geschützten Tabelle
- 1 Jahr Aufbewahrung, dann automatischer Hard-Delete via pg_cron
- DSGVO-Export-Endpoint generiert ZIP mit allen mandantenbezogenen Daten (Anfrage → Lieferung in 72h SLA)
- Soft-Delete: 30 Tage Wiederherstellbarkeit, dann Hard-Delete + Audit-Eintrag
