-- SYSTEMS™ Migration — Client-Side E2E-Verschlüsselung (§203 StGB-konform)
--
-- Anwalts-sensible Daten (Strategien, Mandanten-Notizen, Akten-Beschreibungen)
-- werden client-side AES-256-GCM verschlüsselt. Der Schlüssel wird aus einer
-- Passphrase des Owners abgeleitet (PBKDF2 600.000 iters, SHA-256) und ist
-- dem Server NIEMALS zugänglich.
--
-- Daten-Modell:
--   1. tenants speichert: encrypted_dek (der Tenant-Key, mit Master verschlüsselt),
--      dek_salt, dek_iv. Bei Onboarding wird ein zufälliger DEK generiert.
--   2. Sensible Felder bekommen je ein _cipher (base64) und _iv (12-byte
--      base64). Klartext-Felder bleiben als optional fallback erhalten —
--      wenn der Tenant E2E aktiviert hat, werden sie geleert.
--   3. Ein tenant_setting `e2e_enabled` markiert ob der Tenant aktiv
--      verschlüsselt — sonst nutzt der Frontend die plain-Felder.
--
-- Recovery: Owner kriegt einen 24-Wörter-Code beim Setup. Daraus ist ein
-- alternativer Master-Key ableitbar, der ebenfalls den DEK entschlüsseln
-- kann. Der Server speichert das nicht, der Anwalt MUSS es drucken.
--
-- Idempotent.

-- ─── Tenant-Felder ────────────────────────────────────────────────
alter table public.tenants
  add column if not exists e2e_enabled       boolean not null default false,
  add column if not exists encrypted_dek      text,    -- base64 AES-GCM ciphertext
  add column if not exists dek_salt           text,    -- base64 PBKDF2-Salt für Master-Derive
  add column if not exists dek_iv             text,    -- base64 12-byte IV
  add column if not exists encrypted_dek_recovery text, -- gleicher DEK, gewrappt mit Recovery-Key
  add column if not exists dek_recovery_salt  text,
  add column if not exists dek_recovery_iv    text,
  add column if not exists e2e_enabled_at     timestamptz;

comment on column public.tenants.e2e_enabled
  is 'Wenn true: sensible Felder werden client-side verschlüsselt. Server kann sie nicht lesen.';
comment on column public.tenants.encrypted_dek
  is 'Data-Encryption-Key des Tenants, gewrappt mit Master-Key (aus Passphrase abgeleitet). Server hat keinen Zugriff auf den Master.';

-- ─── Anwalts-Strategien — höchste Sensibilität ───────────────────
alter table public.anwalts_strategien
  add column if not exists sections_cipher   text,    -- base64 AES-GCM(JSON.stringify(sections))
  add column if not exists sections_iv       text;

-- Wenn beide gesetzt sind: sections im Frontend ignorieren, _cipher entschlüsseln
comment on column public.anwalts_strategien.sections_cipher
  is 'AES-GCM verschlüsselte JSON-Sections. Aktiv wenn tenant.e2e_enabled=true.';

-- ─── Mandanten — Notizen-Vorschau ────────────────────────────────
alter table public.mandanten
  add column if not exists notes_preview_cipher  text,
  add column if not exists notes_preview_iv      text;

-- ─── Akten — Beschreibung + next_step ────────────────────────────
alter table public.akten
  add column if not exists beschreibung_cipher   text,
  add column if not exists beschreibung_iv       text,
  add column if not exists next_step_cipher      text,
  add column if not exists next_step_iv          text;

-- ─── Audit-Log: Schlüssel-Events ─────────────────────────────────
-- Wir wollen wissen wann e2e aktiviert/passphrase geändert wurde,
-- ohne den Schlüssel selbst zu loggen.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'audit_log_entity_check' and conrelid = 'public.audit_log'::regclass
  ) then
    -- Audit-Log akzeptiert sowieso freie entity_types — kein Constraint nötig
    null;
  end if;
end $$;
