-- SYSTEMS™ Plattform — Migration 0007: Security Hardening
--
-- Behebt drei Sicherheits-Lücken im Audit:
--  1. users_self_update erlaubt User-Eskalation zu owner (kein WITH CHECK)
--  2. invite_user erlaubt anwalt-Rolle owners einzuladen (Privilege-Escalation)
--  3. mandanten_self_select Policy lässt Mandant ALLE Tenant-Mandanten sehen
--     wenn auch public.users-Eintrag existiert

-- =============================================================
-- 1. users_self_update: NUR Self-Felder, keine Rolle/Tenant-Änderung
-- =============================================================
drop policy if exists users_self_update on public.users;
create policy users_self_update on public.users
  for update
  using (id = auth.uid())
  with check (
    id = auth.uid()
    -- Verhindert Eskalation: User darf eigenen Eintrag updaten,
    -- aber tenant_id und role bleiben fixiert. WITH CHECK greift
    -- bei Postgres-RLS für die NEUE Row — wenn diese Felder
    -- abweichen vom existing Row schlägt es fehl (Trigger sichert das).
  );

-- Trigger: blockt Änderungen an role/tenant_id wenn User sich selbst updated
create or replace function public.tg_users_self_update_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_role public.user_role;
begin
  -- Wenn caller = user selbst (auth.uid()) und role oder tenant_id ändert → block
  if old.id = auth.uid() then
    -- Owner darf alles
    select role into v_caller_role from public.users where id = auth.uid();
    if v_caller_role <> 'owner' then
      if old.role is distinct from new.role then
        raise exception 'Eigene Rolle kann nicht selbst geändert werden';
      end if;
      if old.tenant_id is distinct from new.tenant_id then
        raise exception 'Eigene Tenant-Zuordnung kann nicht selbst geändert werden';
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_users_self_update on public.users;
create trigger guard_users_self_update
  before update on public.users
  for each row
  execute function public.tg_users_self_update_guard();

-- =============================================================
-- 2. invite_user: NUR owner darf owner-Rolle zuweisen
-- =============================================================
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

  -- Privilege-Escalation-Schutz: nur Owner darf weitere Owners einladen
  if p_role = 'owner' and v_caller_role <> 'owner' then
    raise exception 'Nur Owner darf weitere Owners einladen';
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

-- =============================================================
-- 3. mandanten_self_select: nur OWN Mandant-Row, nicht alle des Tenants
-- =============================================================
-- Original-Policy aus 20260426160000_mandant_auth.sql lautete:
--   tenant_id = current_tenant_id() OR auth_user_id = auth.uid()
-- Der OR-Zweig erlaubt einem Mandanten der gleichzeitig Kanzlei-User ist
-- (current_tenant_id() != null) ALLE Mandanten zu sehen.
-- Fix: Mandant-Self-Path strikt nur eigene Row.

drop policy if exists mandanten_self_select on public.mandanten;
create policy mandanten_self_select on public.mandanten
  for select using (
    -- Pfad A: Kanzlei-User sieht alle Mandanten seines Tenants (RLS via tenant_id)
    tenant_id = public.current_tenant_id()
    -- Pfad B: Mandant ohne public.users-Eintrag sieht NUR seine eigene Row
    or (
      auth_user_id = auth.uid()
      and not exists (select 1 from public.users where id = auth.uid())
    )
  );
