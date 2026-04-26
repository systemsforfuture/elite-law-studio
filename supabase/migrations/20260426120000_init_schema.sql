-- SYSTEMS™ Plattform — Initial Schema (DEV SPEC v1.0 §6)
-- Multi-Tenant via Postgres RLS · Frankfurt-Hosted · DSGVO-konform
--
-- Anwendung:
--   supabase db push        (CLI)
--   ODER: SQL Editor im Dashboard → einfügen → Run
--
-- Reihenfolge:
--   1. Extensions
--   2. Helper-Functions (current_tenant_id, updated_at-Trigger)
--   3. Enum-Types
--   4. Tabellen (mit FKs)
--   5. Indizes
--   6. RLS aktivieren + Policies
--   7. Trigger

-- ╔══════════════════════════════════════════════════════════════╗
-- ║ 1. EXTENSIONS                                                ║
-- ╚══════════════════════════════════════════════════════════════╝

create extension if not exists "uuid-ossp" with schema extensions;
create extension if not exists pgcrypto with schema extensions;

-- ╔══════════════════════════════════════════════════════════════╗
-- ║ 2. ENUM-TYPES                                                ║
-- ╚══════════════════════════════════════════════════════════════╝

do $$
begin
  if not exists (select 1 from pg_type where typname = 'subscription_tier') then
    create type public.subscription_tier as enum ('foundation', 'growth', 'premium');
  end if;
  if not exists (select 1 from pg_type where typname = 'subscription_status') then
    create type public.subscription_status as enum ('trial', 'active', 'past_due', 'canceled');
  end if;
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('owner', 'anwalt', 'mitarbeiter', 'support');
  end if;
  if not exists (select 1 from pg_type where typname = 'mandant_typ') then
    create type public.mandant_typ as enum ('privat', 'unternehmen');
  end if;
  if not exists (select 1 from pg_type where typname = 'mandant_status') then
    create type public.mandant_status as enum ('aktiv', 'interessent', 'abgeschlossen', 'archiviert');
  end if;
  if not exists (select 1 from pg_type where typname = 'akten_status') then
    create type public.akten_status as enum ('neu', 'in_bearbeitung', 'wartend', 'abgeschlossen', 'archiviert');
  end if;
  if not exists (select 1 from pg_type where typname = 'akten_stufe') then
    create type public.akten_stufe as enum ('fallaufnahme', 'strategie', 'verfahren', 'abschluss');
  end if;
  if not exists (select 1 from pg_type where typname = 'kanal') then
    create type public.kanal as enum ('voice', 'whatsapp', 'email', 'sms');
  end if;
  if not exists (select 1 from pg_type where typname = 'richtung') then
    create type public.richtung as enum ('inbound', 'outbound');
  end if;
  if not exists (select 1 from pg_type where typname = 'konv_status') then
    create type public.konv_status as enum ('automated', 'escalated', 'handled', 'pending');
  end if;
  if not exists (select 1 from pg_type where typname = 'termin_typ') then
    create type public.termin_typ as enum ('erstgespraech', 'gerichtstermin', 'wiedervorlage', 'intern', 'telefon');
  end if;
  if not exists (select 1 from pg_type where typname = 'dokument_status') then
    create type public.dokument_status as enum ('neu', 'ki_analysiert', 'geprueft', 'freigegeben', 'veraltet');
  end if;
  if not exists (select 1 from pg_type where typname = 'rechnung_status') then
    create type public.rechnung_status as enum (
      'entwurf', 'versendet', 'bezahlt', 'ueberfaellig',
      'mahnung_1', 'mahnung_2', 'mahnung_3', 'gerichtlich'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'audit_action') then
    create type public.audit_action as enum ('read', 'create', 'update', 'delete', 'export', 'login', 'ai_action');
  end if;
end$$;

-- ╔══════════════════════════════════════════════════════════════╗
-- ║ 3. HELPER-FUNCTIONS                                          ║
-- ╚══════════════════════════════════════════════════════════════╝

-- Liefert die tenant_id des aktuell eingeloggten Users.
-- Wird von allen RLS-Policies referenziert — ist STABLE damit Postgres
-- den Wert pro Query nur einmal berechnet.
create or replace function public.current_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select tenant_id from public.users where id = auth.uid()
$$;

-- Setzt updated_at automatisch.
create or replace function public.tg_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end$$;

-- ╔══════════════════════════════════════════════════════════════╗
-- ║ 4. TABELLEN                                                  ║
-- ╚══════════════════════════════════════════════════════════════╝

-- ─── Tenants ───────────────────────────────────────────────────
create table if not exists public.tenants (
  id                  uuid primary key default gen_random_uuid(),
  kanzlei_name        text not null,
  domain              text unique,
  subdomain           text unique,
  branding_config     jsonb not null default '{}'::jsonb,
  subscription_tier   public.subscription_tier not null default 'foundation',
  subscription_status public.subscription_status not null default 'trial',
  inhaber_name        text,
  notfall_nummer      text,
  rechtsgebiete       text[] default '{}',
  stripe_customer_id  text,
  encryption_key_id   text,
  onboarded_at        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists tenants_domain_idx on public.tenants(domain);
create index if not exists tenants_subdomain_idx on public.tenants(subdomain);

-- ─── Users (linked to auth.users) ──────────────────────────────
-- ID = auth.users.id (Supabase Auth User)
create table if not exists public.users (
  id              uuid primary key references auth.users(id) on delete cascade,
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  email           text not null,
  name            text not null,
  role            public.user_role not null default 'mitarbeiter',
  avatar_initials text,
  rechtsgebiete   text[] default '{}',
  active          boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists users_tenant_id_idx on public.users(tenant_id);

-- ─── Mandanten ─────────────────────────────────────────────────
create table if not exists public.mandanten (
  id                       uuid primary key default gen_random_uuid(),
  tenant_id                uuid not null references public.tenants(id) on delete cascade,
  typ                      public.mandant_typ not null,
  vorname                  text,
  nachname                 text,
  firmenname               text,
  email                    text,
  telefon                  text,
  whatsapp                 text,
  adresse                  jsonb default '{}'::jsonb,
  notes_encrypted          bytea,
  notes_preview            text,
  rechtsgebiet             text,
  herkunft                 text,
  status                   public.mandant_status not null default 'interessent',
  zugewiesener_anwalt_id   uuid references public.users(id) on delete set null,
  open_invoices_eur        numeric(10,2) default 0,
  last_contact             timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);
create index if not exists mandanten_tenant_id_idx on public.mandanten(tenant_id);
create index if not exists mandanten_status_idx on public.mandanten(tenant_id, status);
create index if not exists mandanten_anwalt_idx on public.mandanten(tenant_id, zugewiesener_anwalt_id);

-- ─── Akten ─────────────────────────────────────────────────────
create table if not exists public.akten (
  id                       uuid primary key default gen_random_uuid(),
  tenant_id                uuid not null references public.tenants(id) on delete cascade,
  aktenzeichen             text not null,
  titel                    text not null,
  rechtsgebiet             text,
  status                   public.akten_status not null default 'neu',
  stufe                    public.akten_stufe not null default 'fallaufnahme',
  mandant_id               uuid references public.mandanten(id) on delete set null,
  zugewiesener_anwalt_id   uuid references public.users(id) on delete set null,
  streitwert_eur           numeric(12,2),
  fristen                  jsonb default '[]'::jsonb,
  beschreibung             text,
  next_step                text,
  last_update              timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  unique (tenant_id, aktenzeichen)
);
create index if not exists akten_tenant_id_idx on public.akten(tenant_id);
create index if not exists akten_mandant_idx on public.akten(tenant_id, mandant_id);

-- ─── Konversationen ────────────────────────────────────────────
create table if not exists public.konversationen (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  mandant_id      uuid references public.mandanten(id) on delete set null,
  akte_id         uuid references public.akten(id) on delete set null,
  kanal           public.kanal not null,
  richtung        public.richtung not null,
  status          public.konv_status not null default 'pending',
  intent          text,
  betreff         text,
  preview         text,
  inhalt          text,
  audio_url       text,
  ai_handled      boolean not null default false,
  eskaliert_an    uuid references public.users(id) on delete set null,
  dauer_sek       integer,
  ungelesen       boolean not null default true,
  transcript      jsonb,
  zeitpunkt       timestamptz not null default now(),
  created_at      timestamptz not null default now()
);
create index if not exists konv_tenant_idx on public.konversationen(tenant_id);
create index if not exists konv_mandant_idx on public.konversationen(tenant_id, mandant_id);
create index if not exists konv_zeitpunkt_idx on public.konversationen(tenant_id, zeitpunkt desc);

-- ─── Termine ───────────────────────────────────────────────────
create table if not exists public.termine (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  titel        text not null,
  typ          public.termin_typ not null,
  start_at     timestamptz not null,
  ende_at      timestamptz,
  mandant_id   uuid references public.mandanten(id) on delete set null,
  akte_id      uuid references public.akten(id) on delete set null,
  anwalt_id    uuid references public.users(id) on delete set null,
  ort          text,
  notiz        text,
  bestaetigt   boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists termine_tenant_idx on public.termine(tenant_id);
create index if not exists termine_start_idx on public.termine(tenant_id, start_at);

-- ─── Dokumente ─────────────────────────────────────────────────
create table if not exists public.dokumente (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  mandant_id      uuid references public.mandanten(id) on delete set null,
  akte_id         uuid references public.akten(id) on delete set null,
  dateiname       text not null,
  storage_path    text not null,
  mime_type       text,
  groesse_bytes   bigint,
  status          public.dokument_status not null default 'neu',
  uploaded_by     text,
  ai_extracted    jsonb,
  uploaded_at     timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists dok_tenant_idx on public.dokumente(tenant_id);
create index if not exists dok_akte_idx on public.dokumente(tenant_id, akte_id);

-- ─── Rechnungen & Mahnwesen ───────────────────────────────────
create table if not exists public.rechnungen (
  id                    uuid primary key default gen_random_uuid(),
  tenant_id             uuid not null references public.tenants(id) on delete cascade,
  mandant_id            uuid references public.mandanten(id) on delete set null,
  akte_id               uuid references public.akten(id) on delete set null,
  rechnungsnummer       text not null,
  betrag_netto          numeric(10,2),
  betrag_brutto         numeric(10,2),
  rechnungsdatum        date,
  faelligkeit           date,
  bezahlt_am            date,
  status                public.rechnung_status not null default 'entwurf',
  mahnstufe             smallint not null default 0,
  naechste_aktion_am    date,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (tenant_id, rechnungsnummer)
);
create index if not exists rech_tenant_idx on public.rechnungen(tenant_id);
create index if not exists rech_status_idx on public.rechnungen(tenant_id, status);

-- ─── Activity-Log (Mandanten/Akten-Timeline) ───────────────────
create table if not exists public.activities (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  mandant_id   uuid references public.mandanten(id) on delete cascade,
  akte_id      uuid references public.akten(id) on delete cascade,
  ts           timestamptz not null default now(),
  type         text not null,
  actor        text not null,
  actor_name   text not null,
  title        text not null,
  detail       text,
  link_to      jsonb,
  created_at   timestamptz not null default now()
);
create index if not exists activity_tenant_ts_idx on public.activities(tenant_id, ts desc);
create index if not exists activity_mandant_idx on public.activities(tenant_id, mandant_id, ts desc);
create index if not exists activity_akte_idx on public.activities(tenant_id, akte_id, ts desc);

-- ─── Anwalts-Strategien (KI-generiert) ─────────────────────────
create table if not exists public.anwalts_strategien (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  akte_id         uuid not null references public.akten(id) on delete cascade,
  version         integer not null default 1,
  status          text not null default 'draft',
  generated_by    text not null,
  generated_at    timestamptz not null default now(),
  modell          text,
  konfidenz       numeric(3,2),
  sections        jsonb not null,
  iteration_prompt text,
  created_at      timestamptz not null default now()
);
create index if not exists strat_akte_idx on public.anwalts_strategien(tenant_id, akte_id, version desc);

-- ─── Audit-Log (DSGVO, 1 Jahr) ─────────────────────────────────
create table if not exists public.audit_log (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  user_id       uuid references public.users(id) on delete set null,
  ts            timestamptz not null default now(),
  action        public.audit_action not null,
  entity_type   text not null,
  entity_id     uuid,
  ip_address    inet,
  user_agent    text,
  details       text
);
create index if not exists audit_tenant_ts_idx on public.audit_log(tenant_id, ts desc);
create index if not exists audit_entity_idx on public.audit_log(tenant_id, entity_type, entity_id);

-- ╔══════════════════════════════════════════════════════════════╗
-- ║ 5. UPDATED-AT TRIGGER                                        ║
-- ╚══════════════════════════════════════════════════════════════╝

do $$
declare t text;
begin
  for t in
    select unnest(array[
      'tenants', 'users', 'mandanten', 'akten',
      'termine', 'dokumente', 'rechnungen'
    ])
  loop
    execute format($f$
      drop trigger if exists set_updated_at on public.%I;
      create trigger set_updated_at
        before update on public.%I
        for each row execute procedure public.tg_set_updated_at();
    $f$, t, t);
  end loop;
end$$;

-- ╔══════════════════════════════════════════════════════════════╗
-- ║ 6. ROW LEVEL SECURITY                                        ║
-- ║                                                              ║
-- ║ Drei Layer:                                                  ║
-- ║   1. Postgres RLS (hier)                                     ║
-- ║   2. App-Level Tenant-Resolution (Middleware)                ║
-- ║   3. Encryption-at-Rest pro Tenant (Supabase TDE)            ║
-- ╚══════════════════════════════════════════════════════════════╝

alter table public.tenants            enable row level security;
alter table public.users              enable row level security;
alter table public.mandanten          enable row level security;
alter table public.akten              enable row level security;
alter table public.konversationen    enable row level security;
alter table public.termine            enable row level security;
alter table public.dokumente          enable row level security;
alter table public.rechnungen         enable row level security;
alter table public.activities         enable row level security;
alter table public.anwalts_strategien enable row level security;
alter table public.audit_log          enable row level security;

-- ─── tenants ──── Sie sehen nur ihren eigenen Tenant
drop policy if exists tenants_own on public.tenants;
create policy tenants_own on public.tenants
  for select using (id = public.current_tenant_id());

-- ─── users ──── Sie sehen sich selbst + alle User des eigenen Tenants
drop policy if exists users_self_or_tenant on public.users;
create policy users_self_or_tenant on public.users
  for select using (
    id = auth.uid() or tenant_id = public.current_tenant_id()
  );

drop policy if exists users_self_update on public.users;
create policy users_self_update on public.users
  for update using (id = auth.uid());

-- ─── Standard-Tenant-Isolation für alle Datentabellen ──────────
do $$
declare tbl text;
begin
  for tbl in
    select unnest(array[
      'mandanten', 'akten', 'konversationen', 'termine',
      'dokumente', 'rechnungen', 'activities',
      'anwalts_strategien', 'audit_log'
    ])
  loop
    execute format($f$
      drop policy if exists %I_tenant_select on public.%I;
      create policy %I_tenant_select on public.%I
        for select using (tenant_id = public.current_tenant_id());
    $f$, tbl, tbl, tbl, tbl);

    execute format($f$
      drop policy if exists %I_tenant_insert on public.%I;
      create policy %I_tenant_insert on public.%I
        for insert with check (tenant_id = public.current_tenant_id());
    $f$, tbl, tbl, tbl, tbl);

    execute format($f$
      drop policy if exists %I_tenant_update on public.%I;
      create policy %I_tenant_update on public.%I
        for update using (tenant_id = public.current_tenant_id())
                   with check (tenant_id = public.current_tenant_id());
    $f$, tbl, tbl, tbl, tbl);

    -- Audit-Log darf nicht gelöscht werden (Compliance)
    if tbl <> 'audit_log' then
      execute format($f$
        drop policy if exists %I_tenant_delete on public.%I;
        create policy %I_tenant_delete on public.%I
          for delete using (tenant_id = public.current_tenant_id());
      $f$, tbl, tbl, tbl, tbl);
    end if;
  end loop;
end$$;

-- ╔══════════════════════════════════════════════════════════════╗
-- ║ 7. STORAGE BUCKET                                            ║
-- ╚══════════════════════════════════════════════════════════════╝

-- Pro-Tenant-Ordner-Struktur: /tenants/<tenant_id>/akten/<akte_id>/...
insert into storage.buckets (id, name, public)
values ('tenant-files', 'tenant-files', false)
on conflict (id) do nothing;

-- Storage-Policy: Pfad muss mit /tenants/<eigene_tenant_id>/ beginnen
drop policy if exists "tenant_files_select" on storage.objects;
create policy "tenant_files_select" on storage.objects
  for select using (
    bucket_id = 'tenant-files'
    and (storage.foldername(name))[1] = 'tenants'
    and (storage.foldername(name))[2] = public.current_tenant_id()::text
  );

drop policy if exists "tenant_files_insert" on storage.objects;
create policy "tenant_files_insert" on storage.objects
  for insert with check (
    bucket_id = 'tenant-files'
    and (storage.foldername(name))[1] = 'tenants'
    and (storage.foldername(name))[2] = public.current_tenant_id()::text
  );

drop policy if exists "tenant_files_delete" on storage.objects;
create policy "tenant_files_delete" on storage.objects
  for delete using (
    bucket_id = 'tenant-files'
    and (storage.foldername(name))[1] = 'tenants'
    and (storage.foldername(name))[2] = public.current_tenant_id()::text
  );

-- Done. Schema-Version: 0001
