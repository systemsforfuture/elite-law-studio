-- SYSTEMS™ Plattform — Migration 0008
-- Plattform-Managed Integrations (NICHT BYO).
--
-- Architektur:
--  - SYSTEMS betreibt zentral Vapi (Voice), 360dialog (WhatsApp), Resend (Email)
--  - Stripe: SYSTEMS ist Connect-Plattform, jede Kanzlei hat einen Connect-Account
--  - Kanzlei sieht NIE einen Provider-Namen oder API-Key
--  - tenant.provider_config speichert NUR die kanzlei-spezifischen Daten
--    (Telefon-Nummer, WhatsApp-Nummer, Email-Domain, Stripe-Connect-ID)

alter table public.tenants
  add column if not exists provider_config jsonb not null default '{}'::jsonb;

-- Schema (kanzlei-spezifisch, KEINE API-Keys):
--
-- {
--   "voice": {
--     "enabled": false,
--     "phone_number": null,           -- "+493012345678" — die KI-Nummer der Kanzlei
--     "phone_number_id": null,        -- Vapi-internal ID, vom Provisioning gesetzt
--     "voice_id": "anna_de_friendly", -- Voice-Cloning-Slot oder Default
--     "greeting": null,               -- "Kanzlei XYZ, mein Name ist Anna…"
--     "provisioned_at": null,
--     "status": "not_provisioned"     -- not_provisioned | provisioning | active | suspended
--   },
--   "whatsapp": {
--     "enabled": false,
--     "phone_number": null,           -- "+493012345678" — Kanzlei trägt eigene WA-Nummer ein
--     "verification_status": "pending", -- pending | verified | failed
--     "verified_at": null,
--     "requested_at": null
--   },
--   "email": {
--     "enabled": false,
--     "custom_domain": null,          -- "deine-kanzlei.de"
--     "from_email": null,             -- "kanzlei@deine-kanzlei.de"
--     "verification_status": "pending", -- pending | verified | failed
--     "dns_records": [],              -- vom verify-email-domain Endpoint zurückgegeben
--     "verified_at": null
--   },
--   "stripe": {
--     "enabled": false,
--     "connect_account_id": null,     -- "acct_…" vom Connect-OAuth
--     "charges_enabled": false,
--     "payouts_enabled": false,
--     "connected_at": null
--   }
-- }

-- Default-Schema für bestehende Tenants
update public.tenants
set provider_config = jsonb_build_object(
  'voice', jsonb_build_object(
    'enabled', false,
    'phone_number', null,
    'phone_number_id', null,
    'voice_id', 'anna_de_friendly',
    'greeting', null,
    'provisioned_at', null,
    'status', 'not_provisioned'
  ),
  'whatsapp', jsonb_build_object(
    'enabled', false,
    'phone_number', null,
    'verification_status', 'pending',
    'verified_at', null,
    'requested_at', null
  ),
  'email', jsonb_build_object(
    'enabled', false,
    'custom_domain', null,
    'from_email', null,
    'verification_status', 'pending',
    'dns_records', '[]'::jsonb,
    'verified_at', null
  ),
  'stripe', jsonb_build_object(
    'enabled', false,
    'connect_account_id', null,
    'charges_enabled', false,
    'payouts_enabled', false,
    'connected_at', null
  )
)
where provider_config = '{}'::jsonb;

-- Owner-only Trigger für provider_config-Änderungen
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
    -- Service-Role (aus Edge Function) hat KEIN auth.uid() → erlauben
    if auth.uid() is not null and v_caller_role <> 'owner' then
      raise exception 'Nur Owner darf Integrationen ändern';
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

-- RPC: Status-View für die System-Status-Page (zeigt nur kanzlei-relevante Daten,
-- KEINE Provider-Namen, KEINE internen IDs).
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
    'voice', jsonb_build_object(
      'enabled', coalesce((v_config->'voice'->>'enabled')::boolean, false),
      'configured', v_config->'voice'->>'phone_number' is not null,
      'phone_number', v_config->'voice'->>'phone_number',
      'status', coalesce(v_config->'voice'->>'status', 'not_provisioned')
    ),
    'whatsapp', jsonb_build_object(
      'enabled', coalesce((v_config->'whatsapp'->>'enabled')::boolean, false),
      'configured', v_config->'whatsapp'->>'phone_number' is not null,
      'phone_number', v_config->'whatsapp'->>'phone_number',
      'verification_status', coalesce(v_config->'whatsapp'->>'verification_status', 'pending')
    ),
    'email', jsonb_build_object(
      'enabled', coalesce((v_config->'email'->>'enabled')::boolean, false),
      'configured', v_config->'email'->>'custom_domain' is not null,
      'custom_domain', v_config->'email'->>'custom_domain',
      'from_email', v_config->'email'->>'from_email',
      'verification_status', coalesce(v_config->'email'->>'verification_status', 'pending')
    ),
    'stripe', jsonb_build_object(
      'enabled', coalesce((v_config->'stripe'->>'enabled')::boolean, false),
      'configured', v_config->'stripe'->>'connect_account_id' is not null,
      'charges_enabled', coalesce((v_config->'stripe'->>'charges_enabled')::boolean, false),
      'payouts_enabled', coalesce((v_config->'stripe'->>'payouts_enabled')::boolean, false)
    )
  );
end;
$$;

grant execute on function public.provider_health() to authenticated;
