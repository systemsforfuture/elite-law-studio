-- SYSTEMS™ Plattform — Migration 0004
-- Persistente Agenten-Konfiguration pro Tenant.
-- Speichert pro Agent: status, threshold, custom_prompt, tonalitaet.
-- Wird von Edge Functions zum Lesen + von Frontend zum Schreiben genutzt.

alter table public.tenants
  add column if not exists agent_config jsonb not null default '{}'::jsonb;

-- Default-Konfiguration für bestehenden Bergmann-Tenant
update public.tenants
set agent_config = jsonb_build_object(
  'voice_receptionist', jsonb_build_object(
    'status', 'aktiv',
    'konfidenz_threshold', 0.9,
    'tonalitaet', 'freundlich',
    'custom_prompt_addition', null
  ),
  'email_triagist', jsonb_build_object(
    'status', 'aktiv',
    'konfidenz_threshold', 0.85,
    'tonalitaet', 'freundlich',
    'custom_prompt_addition', null
  ),
  'whatsapp_conversationalist', jsonb_build_object(
    'status', 'aktiv',
    'konfidenz_threshold', 0.92,
    'tonalitaet', 'empathisch',
    'custom_prompt_addition', null
  ),
  'dokumenten_analyst', jsonb_build_object(
    'status', 'aktiv',
    'konfidenz_threshold', 0.85,
    'tonalitaet', 'formal',
    'custom_prompt_addition', null
  ),
  'termin_koordinator', jsonb_build_object(
    'status', 'aktiv',
    'konfidenz_threshold', 0.88,
    'tonalitaet', 'freundlich',
    'custom_prompt_addition', null
  ),
  'mahnungs_eskalator', jsonb_build_object(
    'status', 'aktiv',
    'konfidenz_threshold', 0.95,
    'tonalitaet', 'formal',
    'custom_prompt_addition', null
  )
)
where id = '11111111-1111-1111-1111-111111111111'
  and agent_config = '{}'::jsonb;

-- Done. Schema-Version: 0004
