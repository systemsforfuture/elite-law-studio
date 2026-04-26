-- SYSTEMS™ Plattform — Migration 0002
-- Auto-Bootstrap für neue User + Einladungs-System + Audit-Trigger
--
-- Was diese Migration macht:
--   1. tenant_invitations Tabelle (Owner lädt User per Email ein)
--   2. bootstrap_user_self() RPC — beim ersten Login self-claim einer Einladung
--   3. seed_first_owner() RPC — wenn noch GAR keine User → erste Person wird
--      Bergmann-Owner (nur für Demo-Setup, in Prod via Invite)
--   4. Audit-Log-Trigger auf allen relevanten Tabellen

-- ╔══════════════════════════════════════════════════════════════╗
-- ║ 1. EINLADUNGEN                                               ║
-- ╚══════════════════════════════════════════════════════════════╝

create table if not exists public.tenant_invitations (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  email        text not null,
  name         text,
  role         public.user_role not null default 'mitarbeiter',
  invited_by   uuid references public.users(id) on delete set null,
  invited_at   timestamptz not null default now(),
  claimed_at   timestamptz,
  expires_at   timestamptz not null default now() + interval '14 days',
  unique (tenant_id, email)
);
create index if not exists invitations_email_idx on public.tenant_invitations(lower(email));

alter table public.tenant_invitations enable row level security;

-- Owner & Anwälte können Einladungen für ihren Tenant lesen/erstellen
drop policy if exists invitations_tenant_select on public.tenant_invitations;
create policy invitations_tenant_select on public.tenant_invitations
  for select using (tenant_id = public.current_tenant_id());

drop policy if exists invitations_tenant_insert on public.tenant_invitations;
create policy invitations_tenant_insert on public.tenant_invitations
  for insert with check (
    tenant_id = public.current_tenant_id()
    and exists (
      select 1 from public.users
      where id = auth.uid() and role in ('owner', 'anwalt')
    )
  );

drop policy if exists invitations_tenant_delete on public.tenant_invitations;
create policy invitations_tenant_delete on public.tenant_invitations
  for delete using (
    tenant_id = public.current_tenant_id()
    and exists (
      select 1 from public.users
      where id = auth.uid() and role = 'owner'
    )
  );

-- ╔══════════════════════════════════════════════════════════════╗
-- ║ 2. BOOTSTRAP-RPC                                             ║
-- ╚══════════════════════════════════════════════════════════════╝

-- Wird beim ersten Login aufgerufen. Logik:
--   a) Wenn public.users-Zeile existiert → return
--   b) Wenn Einladung für die Email existiert → claim
--   c) Wenn KEIN User im System → erste Person wird Bergmann-Owner (Demo-Setup)
--   d) Sonst: Fehler "Keine Einladung für diese Email"
create or replace function public.bootstrap_user_self()
returns public.users
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text;
  v_existing public.users;
  v_invitation public.tenant_invitations;
  v_user_count int;
  v_user public.users;
  v_demo_tenant_id uuid := '11111111-1111-1111-1111-111111111111';
begin
  if v_user_id is null then
    raise exception 'Nicht eingeloggt';
  end if;

  -- (a) Schon registriert?
  select * into v_existing from public.users where id = v_user_id;
  if found then
    return v_existing;
  end if;

  -- Email aus auth.users
  select email into v_email from auth.users where id = v_user_id;

  -- (b) Offene Einladung?
  select * into v_invitation
  from public.tenant_invitations
  where lower(email) = lower(v_email)
    and claimed_at is null
    and expires_at > now()
  order by invited_at desc
  limit 1;

  if found then
    insert into public.users (id, tenant_id, email, name, role, avatar_initials)
    values (
      v_user_id,
      v_invitation.tenant_id,
      v_email,
      coalesce(v_invitation.name, split_part(v_email, '@', 1)),
      v_invitation.role,
      upper(substring(coalesce(v_invitation.name, v_email) from 1 for 2))
    )
    returning * into v_user;

    update public.tenant_invitations
    set claimed_at = now()
    where id = v_invitation.id;

    return v_user;
  end if;

  -- (c) Demo-Bootstrap: erste Person wird Bergmann-Owner
  select count(*) into v_user_count from public.users;
  if v_user_count = 0 and exists (
    select 1 from public.tenants where id = v_demo_tenant_id
  ) then
    insert into public.users (id, tenant_id, email, name, role, avatar_initials)
    values (
      v_user_id,
      v_demo_tenant_id,
      v_email,
      split_part(v_email, '@', 1),
      'owner',
      upper(substring(v_email from 1 for 2))
    )
    returning * into v_user;
    return v_user;
  end if;

  -- (d) Keine Einladung
  raise exception 'Keine offene Einladung für % gefunden. Bitte vom Owner einladen lassen.', v_email;
end;
$$;

grant execute on function public.bootstrap_user_self() to authenticated;

-- ╔══════════════════════════════════════════════════════════════╗
-- ║ 3. EINLADUNGS-RPC (Vereinfachung für Frontend)               ║
-- ╚══════════════════════════════════════════════════════════════╝

create or replace function public.invite_user(
  p_email text,
  p_name text,
  p_role public.user_role default 'mitarbeiter'
)
returns public.tenant_invitations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid := public.current_tenant_id();
  v_caller_role public.user_role;
  v_invitation public.tenant_invitations;
begin
  if v_tenant_id is null then
    raise exception 'Nicht authentifiziert';
  end if;

  select role into v_caller_role from public.users where id = auth.uid();
  if v_caller_role not in ('owner', 'anwalt') then
    raise exception 'Nur Owner/Anwalt darf einladen';
  end if;

  insert into public.tenant_invitations (tenant_id, email, name, role, invited_by)
  values (v_tenant_id, p_email, p_name, p_role, auth.uid())
  on conflict (tenant_id, email) do update
    set name = excluded.name,
        role = excluded.role,
        invited_at = now(),
        expires_at = now() + interval '14 days',
        claimed_at = null
  returning * into v_invitation;

  return v_invitation;
end;
$$;

grant execute on function public.invite_user(text, text, public.user_role) to authenticated;

-- ╔══════════════════════════════════════════════════════════════╗
-- ║ 4. AUDIT-LOG TRIGGER                                         ║
-- ╚══════════════════════════════════════════════════════════════╝

-- Universeller Trigger der bei jedem INSERT/UPDATE/DELETE auf
-- audit-pflichtigen Tabellen einen audit_log-Eintrag erzeugt.
create or replace function public.tg_audit_log()
returns trigger
language plpgsql
security definer
as $$
declare
  v_tenant_id uuid;
  v_action public.audit_action;
  v_entity_id uuid;
begin
  if tg_op = 'INSERT' then
    v_action := 'create';
    v_tenant_id := new.tenant_id;
    v_entity_id := new.id;
  elsif tg_op = 'UPDATE' then
    v_action := 'update';
    v_tenant_id := new.tenant_id;
    v_entity_id := new.id;
  elsif tg_op = 'DELETE' then
    v_action := 'delete';
    v_tenant_id := old.tenant_id;
    v_entity_id := old.id;
  end if;

  insert into public.audit_log (tenant_id, user_id, action, entity_type, entity_id, details)
  values (
    v_tenant_id,
    auth.uid(),
    v_action,
    tg_table_name,
    v_entity_id,
    case
      when tg_op = 'UPDATE' then 'Geändert'
      when tg_op = 'INSERT' then 'Neu angelegt'
      else 'Gelöscht'
    end
  );

  return coalesce(new, old);
end;
$$;

-- Trigger an alle relevanten Tabellen hängen
do $$
declare t text;
begin
  for t in
    select unnest(array[
      'mandanten', 'akten', 'konversationen',
      'termine', 'dokumente', 'rechnungen',
      'anwalts_strategien'
    ])
  loop
    execute format($f$
      drop trigger if exists audit_changes on public.%I;
      create trigger audit_changes
        after insert or update or delete on public.%I
        for each row execute procedure public.tg_audit_log();
    $f$, t, t);
  end loop;
end$$;

-- Done. Schema-Version: 0002
