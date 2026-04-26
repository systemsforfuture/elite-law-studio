-- SYSTEMS™ Plattform — Migration 0005
-- Mandanten-Authentifizierung: Mandant kann sich ins Portal einloggen
-- und sieht NUR seine eigenen Daten via RLS.

-- Verknüpfung zwischen mandant ↔ auth.users
alter table public.mandanten
  add column if not exists auth_user_id uuid references auth.users(id) on delete set null;

create index if not exists mandanten_auth_user_idx
  on public.mandanten(auth_user_id);

-- Helper: Mandant_id des aktuell eingeloggten Users (null wenn kein Mandant)
create or replace function public.current_mandant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.mandanten where auth_user_id = auth.uid() limit 1
$$;

-- Helper: Tenant_id des aktuell eingeloggten Mandanten
create or replace function public.current_mandant_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select tenant_id from public.mandanten where auth_user_id = auth.uid() limit 1
$$;

-- Mandant darf seinen eigenen Datensatz lesen
drop policy if exists mandanten_self_select on public.mandanten;
create policy mandanten_self_select on public.mandanten
  for select using (
    auth_user_id = auth.uid()
    or tenant_id = public.current_tenant_id()  -- Anwalt sieht alle
  );

-- Mandant darf seinen eigenen Datensatz updaten (nicht tenant_id ändern)
drop policy if exists mandanten_self_update on public.mandanten;
create policy mandanten_self_update on public.mandanten
  for update using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());

-- Mandant darf seine eigenen Akten lesen
drop policy if exists akten_mandant_select on public.akten;
create policy akten_mandant_select on public.akten
  for select using (
    tenant_id = public.current_tenant_id()
    or (
      tenant_id = public.current_mandant_tenant_id()
      and mandant_id = public.current_mandant_id()
    )
  );

-- Mandant darf seine eigenen Konversationen lesen
drop policy if exists konv_mandant_select on public.konversationen;
create policy konv_mandant_select on public.konversationen
  for select using (
    tenant_id = public.current_tenant_id()
    or (
      tenant_id = public.current_mandant_tenant_id()
      and mandant_id = public.current_mandant_id()
    )
  );

-- Mandant darf seine eigenen Termine lesen
drop policy if exists termine_mandant_select on public.termine;
create policy termine_mandant_select on public.termine
  for select using (
    tenant_id = public.current_tenant_id()
    or (
      tenant_id = public.current_mandant_tenant_id()
      and mandant_id = public.current_mandant_id()
    )
  );

-- Mandant darf seine eigenen Dokumente lesen
drop policy if exists dok_mandant_select on public.dokumente;
create policy dok_mandant_select on public.dokumente
  for select using (
    tenant_id = public.current_tenant_id()
    or (
      tenant_id = public.current_mandant_tenant_id()
      and mandant_id = public.current_mandant_id()
    )
  );

-- Mandant darf seine eigenen Rechnungen lesen
drop policy if exists rech_mandant_select on public.rechnungen;
create policy rech_mandant_select on public.rechnungen
  for select using (
    tenant_id = public.current_tenant_id()
    or (
      tenant_id = public.current_mandant_tenant_id()
      and mandant_id = public.current_mandant_id()
    )
  );

-- RPC: Mandant claimed seine eigene Auth-Verknüpfung beim ersten Login
-- Findet Mandant über Email → setzt auth_user_id
create or replace function public.bootstrap_mandant_self()
returns public.mandanten
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text;
  v_mandant public.mandanten;
begin
  if v_user_id is null then
    raise exception 'Nicht eingeloggt';
  end if;

  -- Bereits verknüpft?
  select * into v_mandant from public.mandanten where auth_user_id = v_user_id;
  if found then
    return v_mandant;
  end if;

  -- Email aus auth.users
  select email into v_email from auth.users where id = v_user_id;

  -- Mandant via Email finden
  select * into v_mandant
  from public.mandanten
  where lower(email) = lower(v_email)
  order by created_at desc
  limit 1;

  if not found then
    raise exception 'Kein Mandant mit dieser E-Mail-Adresse gefunden. Bitte wenden Sie sich an Ihre Kanzlei.';
  end if;

  -- Verknüpfung setzen
  update public.mandanten
  set auth_user_id = v_user_id, last_contact = now()
  where id = v_mandant.id;

  v_mandant.auth_user_id := v_user_id;
  return v_mandant;
end;
$$;

grant execute on function public.bootstrap_mandant_self() to authenticated;

-- Done. Schema-Version: 0005
