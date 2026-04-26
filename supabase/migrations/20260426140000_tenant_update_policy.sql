-- SYSTEMS™ Plattform — Migration 0003
-- Erlaubt Owners ihren eigenen Tenant zu UPDATEN (Branding, Tonalität).

drop policy if exists tenants_owner_update on public.tenants;
create policy tenants_owner_update on public.tenants
  for update
  using (
    id = public.current_tenant_id()
    and exists (
      select 1 from public.users
      where id = auth.uid() and role = 'owner'
    )
  )
  with check (
    id = public.current_tenant_id()
  );

-- Done. Schema-Version: 0003
