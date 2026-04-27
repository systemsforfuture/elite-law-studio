-- SYSTEMS™ Plattform — Migration 0012
-- Daily-Aggregations-RPC für 30-Tage-Trend-Chart auf Abrechnung-Page.
-- Owner sieht ob Token-Verbrauch steigt/spikt → Anomalien früh erkennen.

create or replace function public.llm_usage_last_30_days()
returns table (
  day date,
  call_count bigint,
  tokens_sum bigint,
  cost_eur_sum numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid := public.current_tenant_id();
begin
  if v_tenant_id is null then
    raise exception 'Nicht authentifiziert';
  end if;
  return query
    with days as (
      select (current_date - i)::date as day
      from generate_series(0, 29) as i
    ),
    agg as (
      select
        date_trunc('day', u.ts)::date as day,
        count(*)::bigint as call_count,
        coalesce(sum(u.input_tokens + u.output_tokens), 0)::bigint as tokens_sum,
        coalesce(sum(u.cost_eur), 0)::numeric as cost_eur_sum
      from public.llm_usage u
      where u.tenant_id = v_tenant_id
        and u.ts >= current_date - interval '29 days'
      group by date_trunc('day', u.ts)
    )
    select
      d.day,
      coalesce(a.call_count, 0)::bigint,
      coalesce(a.tokens_sum, 0)::bigint,
      coalesce(a.cost_eur_sum, 0)::numeric
    from days d
    left join agg a on a.day = d.day
    order by d.day asc;
end;
$$;

grant execute on function public.llm_usage_last_30_days() to authenticated;
