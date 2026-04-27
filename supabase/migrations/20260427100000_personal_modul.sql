-- SYSTEMS™ Plattform — Migration 0006
-- HR / Personal-Modul: Zeiterfassung, Urlaubsanträge, Mitarbeiter-Kontingente.
-- Multi-Tenant via current_tenant_id() RLS, gleiches Muster wie init_schema.

-- =============================================================
-- 1. Zeiterfassung
-- =============================================================
create table if not exists public.zeiterfassung (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  mitarbeiter_id uuid not null references public.users(id) on delete cascade,
  datum         date not null,
  start_zeit    time not null,
  ende_zeit     time not null,
  dauer_min     int not null,
  akte_id       uuid references public.akten(id) on delete set null,
  mandant_id    uuid references public.mandanten(id) on delete set null,
  beschreibung  text,
  art           text not null check (art in ('billable', 'intern', 'training')),
  tarif_eur     numeric(10,2),
  created_at    timestamptz not null default now()
);

create index if not exists idx_zeiterfassung_tenant_datum
  on public.zeiterfassung (tenant_id, datum desc);
create index if not exists idx_zeiterfassung_mitarbeiter
  on public.zeiterfassung (mitarbeiter_id, datum desc);

alter table public.zeiterfassung enable row level security;

create policy zeiterfassung_tenant_select on public.zeiterfassung
  for select using (tenant_id = public.current_tenant_id());

create policy zeiterfassung_tenant_insert on public.zeiterfassung
  for insert with check (tenant_id = public.current_tenant_id());

create policy zeiterfassung_owner_or_self_update on public.zeiterfassung
  for update using (
    tenant_id = public.current_tenant_id()
    and (
      mitarbeiter_id = auth.uid()
      or exists (
        select 1 from public.users
        where id = auth.uid() and role = 'owner'
      )
    )
  )
  with check (tenant_id = public.current_tenant_id());

create policy zeiterfassung_owner_delete on public.zeiterfassung
  for delete using (
    tenant_id = public.current_tenant_id()
    and exists (
      select 1 from public.users
      where id = auth.uid() and role = 'owner'
    )
  );

-- =============================================================
-- 2. Urlaubsanträge
-- =============================================================
create table if not exists public.urlaub_antraege (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  mitarbeiter_id uuid not null references public.users(id) on delete cascade,
  von           date not null,
  bis           date not null,
  tage          int not null,
  art           text not null check (art in ('urlaub', 'krankheit', 'home_office', 'sonstiges')),
  status        text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  kommentar     text,
  approver_id   uuid references public.users(id) on delete set null,
  approved_at   timestamptz,
  created_at    timestamptz not null default now(),
  check (bis >= von)
);

create index if not exists idx_urlaub_tenant_status
  on public.urlaub_antraege (tenant_id, status, von desc);
create index if not exists idx_urlaub_mitarbeiter
  on public.urlaub_antraege (mitarbeiter_id, von desc);

alter table public.urlaub_antraege enable row level security;

create policy urlaub_tenant_select on public.urlaub_antraege
  for select using (tenant_id = public.current_tenant_id());

create policy urlaub_self_insert on public.urlaub_antraege
  for insert with check (
    tenant_id = public.current_tenant_id()
    and mitarbeiter_id = auth.uid()
  );

-- Mitarbeiter darf eigenen Antrag bearbeiten solange pending; Owner darf immer
create policy urlaub_owner_or_self_update on public.urlaub_antraege
  for update using (
    tenant_id = public.current_tenant_id()
    and (
      (mitarbeiter_id = auth.uid() and status = 'pending')
      or exists (
        select 1 from public.users
        where id = auth.uid() and role = 'owner'
      )
    )
  )
  with check (tenant_id = public.current_tenant_id());

create policy urlaub_owner_delete on public.urlaub_antraege
  for delete using (
    tenant_id = public.current_tenant_id()
    and exists (
      select 1 from public.users
      where id = auth.uid() and role = 'owner'
    )
  );

-- =============================================================
-- 3. Mitarbeiter-Kontingente (Jahres-Urlaubsanspruch + Stunden)
-- =============================================================
create table if not exists public.mitarbeiter_kontingent (
  tenant_id          uuid not null references public.tenants(id) on delete cascade,
  mitarbeiter_id     uuid not null references public.users(id) on delete cascade,
  jahr               int not null,
  urlaubstage_total  int not null default 28,
  kranktage_genommen int not null default 0,
  ueberstunden_min   int not null default 0,
  soll_stunden_woche numeric(4,1) not null default 40,
  primary key (mitarbeiter_id, jahr)
);

alter table public.mitarbeiter_kontingent enable row level security;

create policy kontingent_tenant_select on public.mitarbeiter_kontingent
  for select using (tenant_id = public.current_tenant_id());

create policy kontingent_owner_write on public.mitarbeiter_kontingent
  for all using (
    tenant_id = public.current_tenant_id()
    and exists (
      select 1 from public.users
      where id = auth.uid() and role = 'owner'
    )
  )
  with check (tenant_id = public.current_tenant_id());

-- =============================================================
-- 4. View: Urlaubstage genommen pro Mitarbeiter und Jahr
-- =============================================================
create or replace view public.urlaub_uebersicht as
select
  k.mitarbeiter_id,
  k.tenant_id,
  k.jahr,
  k.urlaubstage_total,
  coalesce(sum(case when ua.art = 'urlaub' and ua.status = 'approved' then ua.tage else 0 end), 0)::int as urlaubstage_genommen,
  k.urlaubstage_total - coalesce(sum(case when ua.art = 'urlaub' and ua.status = 'approved' then ua.tage else 0 end), 0)::int as urlaubstage_offen,
  k.kranktage_genommen,
  k.ueberstunden_min,
  k.soll_stunden_woche
from public.mitarbeiter_kontingent k
left join public.urlaub_antraege ua
  on ua.mitarbeiter_id = k.mitarbeiter_id
  and extract(year from ua.von) = k.jahr
group by k.mitarbeiter_id, k.tenant_id, k.jahr, k.urlaubstage_total,
         k.kranktage_genommen, k.ueberstunden_min, k.soll_stunden_woche;
