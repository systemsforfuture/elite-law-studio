-- SYSTEMS™ Plattform — Migration 0008
-- BYO-Credentials: jede Kanzlei trägt ihre eigenen Provider-API-Keys ein.
-- Vapi (Voice), 360dialog (WhatsApp), Resend (Email), Stripe (Zahlungen).
--
-- Sicherheit:
--  - jsonb in tenants-Tabelle, nur Owner-RLS
--  - Werte sollten in Production via Supabase Vault verschlüsselt werden;
--    für MVP: plain jsonb + strikte RLS reicht (nur Owner sieht eigene Keys)
--  - Edge Functions lesen via service_role (bypassed RLS) und nutzen die
--    Keys per Tenant statt platform-weit aus Function-Secrets.

alter table public.tenants
  add column if not exists provider_config jsonb not null default '{}'::jsonb;

-- Default-Schema für bestehende Tenants
update public.tenants
set provider_config = jsonb_build_object(
  'vapi', jsonb_build_object(
    'enabled', false,
    'api_key', null,
    'assistant_id', null,
    'phone_number_id', null,
    'webhook_secret', null,
    'last_test_at', null,
    'last_test_ok', null
  ),
  'whatsapp', jsonb_build_object(
    'enabled', false,
    'provider', '360dialog',
    'api_key', null,
    'phone_number_id', null,
    'webhook_secret', null,
    'last_test_at', null,
    'last_test_ok', null
  ),
  'resend', jsonb_build_object(
    'enabled', false,
    'api_key', null,
    'from_email', null,
    'verified_domain', null,
    'inbound_webhook_secret', null,
    'last_test_at', null,
    'last_test_ok', null
  ),
  'stripe', jsonb_build_object(
    'enabled', false,
    'secret_key', null,
    'webhook_secret', null,
    'connect_account_id', null,
    'last_test_at', null,
    'last_test_ok', null
  )
)
where provider_config = '{}'::jsonb;

-- Owner-only Policy für update auf provider_config:
-- Trigger blockt updates die provider_config ändern, wenn caller != owner.
create or replace function public.tg_provider_config_owner_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_role public.user_role;
begin
  if old.provider_config is distinct from new.provider_config then
    select role into v_caller_role from public.users where id = auth.uid();
    if v_caller_role <> 'owner' then
      raise exception 'Nur Owner darf Provider-Konfiguration ändern';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_provider_config_owner on public.tenants;
create trigger guard_provider_config_owner
  before update on public.tenants
  for each row
  execute function public.tg_provider_config_owner_guard();

-- Eine RPC die nur die enabled-Flags + last_test-Status zurück liefert,
-- ohne die API-Keys (für die System-Status-Page sicher zu zeigen).
create or replace function public.provider_health()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid := public.current_tenant_id();
  v_config jsonb;
begin
  if v_tenant_id is null then
    raise exception 'Nicht authentifiziert';
  end if;
  select provider_config into v_config from public.tenants where id = v_tenant_id;

  return jsonb_build_object(
    'vapi', jsonb_build_object(
      'enabled', coalesce((v_config->'vapi'->>'enabled')::boolean, false),
      'configured', v_config->'vapi'->>'api_key' is not null,
      'last_test_at', v_config->'vapi'->>'last_test_at',
      'last_test_ok', v_config->'vapi'->>'last_test_ok'
    ),
    'whatsapp', jsonb_build_object(
      'enabled', coalesce((v_config->'whatsapp'->>'enabled')::boolean, false),
      'configured', v_config->'whatsapp'->>'api_key' is not null,
      'last_test_at', v_config->'whatsapp'->>'last_test_at',
      'last_test_ok', v_config->'whatsapp'->>'last_test_ok'
    ),
    'resend', jsonb_build_object(
      'enabled', coalesce((v_config->'resend'->>'enabled')::boolean, false),
      'configured', v_config->'resend'->>'api_key' is not null,
      'verified_domain', v_config->'resend'->>'verified_domain',
      'last_test_at', v_config->'resend'->>'last_test_at',
      'last_test_ok', v_config->'resend'->>'last_test_ok'
    ),
    'stripe', jsonb_build_object(
      'enabled', coalesce((v_config->'stripe'->>'enabled')::boolean, false),
      'configured', v_config->'stripe'->>'secret_key' is not null,
      'last_test_at', v_config->'stripe'->>'last_test_at',
      'last_test_ok', v_config->'stripe'->>'last_test_ok'
    )
  );
end;
$$;

grant execute on function public.provider_health() to authenticated;
