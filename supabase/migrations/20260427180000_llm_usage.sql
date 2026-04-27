-- SYSTEMS™ Plattform — Migration 0011
-- Cost-Tracking pro LLM-Aufruf für:
--  - Per-Tenant-Abrechnung (welche Kanzlei verbraucht wieviel)
--  - Tier-Limits enforcen (foundation/growth/premium)
--  - Provider-Drift erkennen (was wenn Anthropic down → OpenAI-Spike?)

create table if not exists public.llm_usage (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  ts            timestamptz not null default now(),
  task          text not null,
  provider      text not null check (provider in ('anthropic', 'openai', 'mock')),
  model         text not null,
  input_tokens  int not null default 0,
  output_tokens int not null default 0,
  cost_eur      numeric(10,4) not null default 0
);

create index if not exists llm_usage_tenant_ts_idx
  on public.llm_usage (tenant_id, ts desc);
create index if not exists llm_usage_tenant_task_idx
  on public.llm_usage (tenant_id, task);

alter table public.llm_usage enable row level security;

create policy llm_usage_tenant_select on public.llm_usage
  for select using (tenant_id = public.current_tenant_id());

-- Insert/Update: nur via service-role (Edge Functions). Kein User-Pfad.

-- =============================================================
-- View: Monatliche Aggregation pro Tenant
-- =============================================================
create or replace view public.llm_usage_monthly as
select
  tenant_id,
  date_trunc('month', ts)::date as month,
  task,
  provider,
  count(*)::int as call_count,
  sum(input_tokens)::int as input_tokens_sum,
  sum(output_tokens)::int as output_tokens_sum,
  sum(cost_eur)::numeric(10,4) as cost_eur_sum
from public.llm_usage
group by tenant_id, date_trunc('month', ts), task, provider;

-- =============================================================
-- RPC: Aktueller-Monat-Verbrauch
-- =============================================================
create or replace function public.llm_usage_current_month()
returns table (
  task text,
  provider text,
  call_count bigint,
  input_tokens_sum bigint,
  output_tokens_sum bigint,
  cost_eur_sum numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid := public.current_tenant_id();
  v_month_start timestamptz := date_trunc('month', now());
begin
  if v_tenant_id is null then
    raise exception 'Nicht authentifiziert';
  end if;
  return query
    select
      u.task,
      u.provider,
      count(*)::bigint as call_count,
      coalesce(sum(u.input_tokens), 0)::bigint as input_tokens_sum,
      coalesce(sum(u.output_tokens), 0)::bigint as output_tokens_sum,
      coalesce(sum(u.cost_eur), 0)::numeric as cost_eur_sum
    from public.llm_usage u
    where u.tenant_id = v_tenant_id
      and u.ts >= v_month_start
    group by u.task, u.provider
    order by cost_eur_sum desc;
end;
$$;

grant execute on function public.llm_usage_current_month() to authenticated;

-- =============================================================
-- RPC: Total-Tokens Aktueller Monat (für Tier-Limit-Check)
-- =============================================================
create or replace function public.llm_usage_total_month(p_tenant_id uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total int;
begin
  select coalesce(sum(input_tokens + output_tokens), 0)::int
    into v_total
  from public.llm_usage
  where tenant_id = p_tenant_id
    and ts >= date_trunc('month', now());
  return v_total;
end;
$$;

-- Edge Functions rufen diese RPC mit service-role auf.
grant execute on function public.llm_usage_total_month(uuid) to service_role;
