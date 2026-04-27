-- SYSTEMS™ Plattform — Migration 0010
-- Performance: webhook-stripe sucht Tenant via provider_config->stripe->>connect_account_id.
-- Bei vielen Tenants ist das ein Sequential-Scan. Generated-Column + Index lösen das.

alter table public.tenants
  add column if not exists stripe_connect_account_id text
  generated always as (provider_config #>> '{stripe,connect_account_id}') stored;

create index if not exists tenants_stripe_connect_idx
  on public.tenants(stripe_connect_account_id)
  where stripe_connect_account_id is not null;

-- Voice-Webhook-Routing: tenant via voice.phone_number_id finden
alter table public.tenants
  add column if not exists voice_phone_number_id text
  generated always as (provider_config #>> '{voice,phone_number_id}') stored;

create index if not exists tenants_voice_phone_idx
  on public.tenants(voice_phone_number_id)
  where voice_phone_number_id is not null;
