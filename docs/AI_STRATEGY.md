# SYSTEMS™ — KI-Strategie & Skalierung

> Stand v118. Wie die KI-Kosten skalieren und wie wir sie unter Kontrolle halten.

## Multi-Provider-Routing

Die Plattform routet jeden KI-Aufruf basierend auf der Task-Art an den
optimalen Provider/Modell-Mix. Anwalt sieht nur »SYSTEMS-KI«, kein
Provider-Name.

| Task | Primary | Fallback | Warum |
|------|---------|----------|-------|
| `voice_triage` | gpt-4o-mini | Haiku 4.5 | Klassifikation, hohes Volumen, billig |
| `email_triage` | Haiku 4.5 | gpt-4o-mini | Sprache + Triage, günstig |
| `whatsapp_chat` | Haiku 4.5 | gpt-4o-mini | Empathisch + schnell |
| `lead_capture` | gpt-4o-mini | Haiku 4.5 | Spalten-Mapping, simpel |
| `doc_analysis` | Sonnet 4.6 | gpt-4o | Vision + Extraction |
| `mahnung_gen` | Sonnet 4.6 | Haiku 4.5 | Juristisches Deutsch |
| `assistant_chat` | Sonnet 4.6 | gpt-4o | Tenant-Kontext-Reasoning |
| `strategy_gen` | Opus 4.6 | gpt-4o | Tiefes juristisches Reasoning |

Quelle: `supabase/functions/_shared/llm.ts → TASK_MODELS`.

## Cost-Modell für 100 Kanzleien (Annahmen)

Pro Kanzlei: 50 Anrufe/Tag · 100 Emails/Tag · 30 Dokumente/Woche · 100 Assistant-Chats/Tag

### Anthropic-only (vorher)

| Modul | Volumen/Monat | $/Monat |
|-------|---------------|---------|
| Voice-Triage (Sonnet) | 150k | $1950 |
| Email-Triagist (Haiku) | 300k | $180 |
| WhatsApp (Haiku) | 60k | $36 |
| Doc-Analyst (Sonnet) | 12k | $200 |
| Strategie-Gen (Opus) | 1.6k | $240 |
| KI-Assistent (Sonnet) | 300k | $3900 |
| **Total** | | **~$6500** |

### Hybrid-Routing (jetzt)

| Modul | Modell | $/Monat |
|-------|--------|---------|
| Voice-Triage | gpt-4o-mini | $195 |
| Email-Triagist | Haiku | $180 |
| WhatsApp | Haiku | $36 |
| Doc-Analyst | Sonnet | $200 |
| Strategie-Gen | Opus | $240 |
| KI-Assistent | Sonnet | $3900 |
| **Total** | | **~$4750** |

→ **27% Cost-Drop** durch Voice-Switch auf gpt-4o-mini (Voice ist Klassifikation, kein Schreiben — gpt-4o-mini reicht).

Bei zusätzlicher Migration `assistant_chat` → gpt-4o-mini (für 90% der Trivial-Anfragen): **~50% Cost-Drop** möglich. Aktuell Sonnet, weil Tenant-Kontext-Reasoning besser.

## Tier-Limits (Tokens/Monat)

| Tier | Limit | Kosten/Monat-Plattform | Margin |
|------|-------|------------------------|--------|
| Foundation | 300k | ~€5 | 99% |
| Growth | 2M | ~€35 | 96% |
| Premium | unlimited | ~€80–200 | 80–90% |

`llm.complete()` prüft Limit vor jedem Aufruf. Bei Überschreitung: keine echten Aufrufe mehr, klare Fehlermeldung.

## Anthropic-Tier-Anforderungen

| User-Anzahl | Anthropic-Tier | Anforderung |
|-------------|----------------|-------------|
| 0–10 | Tier 1 | $5 spent |
| 10–50 | Tier 2 | $40 spent |
| 50–500 | Tier 3 | $200 spent |
| 500+ | Tier 4 | $400 spent + 7 days |

Bei 100 Kanzleien sind wir locker Tier 4 (3500€/Monat verbraten = ~$3850 spent in 1 Monat).

**Rate-Limits Tier 4:**
- Sonnet 4: 4000 RPM, 400k ITPM, 80k OTPM
- Opus 4: 400 RPM, 80k ITPM, 16k OTPM

Das deckt 100 Kanzleien × Peak 50 Anfragen/Min easy.

## Skalierungs-Pfad

| Phase | Kanzleien | Architektur | Monatliche KI-Kosten |
|-------|-----------|-------------|----------------------|
| 1 | 0–50 | Hybrid Anthropic+OpenAI | ~€2000 |
| 2 | 50–500 | + Caching für gleiche Anfragen | ~€10000 |
| 3 | 500+ | + Self-hosted Llama 3.x als 3. Provider für Volume-Tasks | ~€30000 statt €100000 |

In `llm.ts → TASK_MODELS` einfach `provider: "self_hosted"` Option hinzufügen mit `endpoint: "https://llm.systems-tm.de/v1"`.

## DSGVO-Aspekt

- Anthropic + OpenAI: Daten via SCC, Hosting US, akzeptabel für die meisten Kanzleien
- Mandanten-Daten in Prompts: anonymisiert (»Mandant 1«, »Akte XY«) wo möglich
- Self-hosted (Phase 3): Daten verlassen EU nie — KSP-relevant für Kanzleien mit besonders sensiblen Mandaten

Aktuelle Architektur: `_shared/llm.ts` ist Provider-Detail-versteckt vor Edge Functions, Switch zu self-hosted ist Code-Änderung NUR in `llm.ts`.

## Cost-Monitoring

Owner sieht im Modul **Setup → Abrechnung**:
- Aktueller Monat: X Aufrufe, Y Tokens, Z €
- Limit-Bar mit Farbe (grün/amber/rot)
- Per-Task-Breakdown (welches Modul wieviel KI verbraucht)
- Warning bei >80% Limit-Auslastung

DB-Tabelle: `llm_usage` — pro Aufruf eine Zeile mit tenant_id, task, provider, model, tokens, cost_eur. RLS strikt tenant-scoped.

## Wenn Anthropic 503'd

`complete()` versucht primary → fallback → mock automatisch. Anwalt merkt von einer 5-min-Anthropic-Outage NICHTS solange OPENAI_API_KEY gesetzt ist.

In Production-Logs: `[llm] anthropic failed, trying fallback: 503 Service Unavailable`.
