-- SYSTEMS™ Migration — Voice-KI Hardening (PR1)
--
-- Erweitert konversationen um die Felder, die der webhook-vapi
-- aus dem end-of-call-report von Vapi extrahieren kann:
--   - recording_url   → Audio-File-URL von Vapi (S3)
--   - cost_eur        → Vapi-Kosten in EUR (numeric(10,4) für Cent-genaue Buchung)
--   - structured_data → JSON aus Vapi-analysis (urgency, area, action, sentiment)
--   - vapi_call_id    → externe Call-ID für Lookup / Replay
--   - started_at      → call.started Timestamp (separater Anruf-Start)
--   - ended_at        → call.ended Timestamp (separat von zeitpunkt)
--   - escalation_reason → Grund-Text wenn KI escalate_to_lawyer auslöst
--   - escalation_urgency → enum-artig: sofort_durchstellen | rueckruf_heute | rueckruf_naechster_werktag
--
-- Idempotent — kann ohne Risiko mehrfach laufen.

alter table public.konversationen
  add column if not exists recording_url         text,
  add column if not exists cost_eur              numeric(10,4),
  add column if not exists structured_data       jsonb,
  add column if not exists vapi_call_id          text,
  add column if not exists started_at            timestamptz,
  add column if not exists ended_at              timestamptz,
  add column if not exists escalation_reason     text,
  add column if not exists escalation_urgency    text;

-- Index für Vapi-Call-ID-Lookups (idempotent gegen Doppelpersistenz beim Webhook-Replay)
create unique index if not exists konv_vapi_call_id_uniq
  on public.konversationen(vapi_call_id)
  where vapi_call_id is not null;

-- Index auf structured_data->>'urgency' für Dashboard-Filter
create index if not exists konv_urgency_idx
  on public.konversationen ((structured_data->>'urgency'))
  where structured_data is not null;

-- ─────────────────────────────────────────────────────────────────
-- Separation der KI-Telefon-Nummer (Vapi) von der Notfall-Hotline (Anwalt)
-- ─────────────────────────────────────────────────────────────────
--
-- BUG vor v159: provision-voice-number hat `notfall_nummer` mit der gekauften
-- Vapi-KI-Nummer überschrieben — und dieselbe Nummer wurde dann als Transfer-
-- Ziel bei "sofort_durchstellen" genutzt = KI ruft sich selbst an (Loop).
--
-- Fix: separate Spalte `voice_phone_number` + Migration der bestehenden Daten
-- (best-effort: wenn provider_config.voice.phone_number gesetzt ist und
-- notfall_nummer damit identisch ist, dann kopieren wir es rüber und nullen
-- notfall_nummer — der Owner kann seine echte Notfall-Hotline neu setzen).

alter table public.tenants
  add column if not exists voice_phone_number text;

-- Migration: voice_phone_number aus provider_config.voice.phone_number befüllen
update public.tenants t
   set voice_phone_number = (t.provider_config->'voice'->>'phone_number')
 where t.voice_phone_number is null
   and (t.provider_config->'voice'->>'phone_number') is not null;

-- Aufräumen: wenn notfall_nummer = voice_phone_number (Legacy-Bug-Daten),
-- dann notfall_nummer leeren — sonst transferiert die KI an sich selbst.
update public.tenants
   set notfall_nummer = null
 where notfall_nummer is not null
   and notfall_nummer = voice_phone_number;

create index if not exists tenant_voice_phone_idx
  on public.tenants(voice_phone_number)
  where voice_phone_number is not null;

comment on column public.tenants.voice_phone_number
  is 'KI-Telefonnummer (Vapi/Voice-Provider). Anrufe an diese Nummer landen bei der KI-Empfangskraft.';
comment on column public.tenants.notfall_nummer
  is 'Notfall-Hotline / Anwalts-Mobil. Hierhin transferiert die KI bei dringlichkeit=sofort_durchstellen.';

comment on column public.konversationen.recording_url
  is 'Audio-URL des Anruf-Recordings (Vapi liefert signed S3-URL im end-of-call-report)';
comment on column public.konversationen.cost_eur
  is 'Anruf-Kosten in EUR (Vapi-Minuten + Voice/Transcriber-Provider)';
comment on column public.konversationen.structured_data
  is 'KI-extrahierte strukturierte Felder aus dem Anruf: {urgency, area, action, sentiment, lead_quality, next_step}';
comment on column public.konversationen.vapi_call_id
  is 'Externe Call-ID vom Voice-Provider — wird vor User versteckt, nur intern für Idempotenz/Audit';
comment on column public.konversationen.escalation_urgency
  is 'Bei kanal=voice und status=escalated: sofort_durchstellen | rueckruf_heute | rueckruf_naechster_werktag';
