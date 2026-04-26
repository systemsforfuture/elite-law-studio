-- SYSTEMS™ Plattform — Seed-Daten für lokale Entwicklung
--
-- Erzeugt einen Demo-Tenant „Kanzlei Bergmann" mit ein paar Beispiel-
-- Mandanten / Akten. KEINE User — Auth-User legen wir nach Login an.
--
-- Anwendung:
--   psql $SUPABASE_DB_URL -f supabase/seed.sql
--   ODER: SQL Editor → Run

-- Demo-Tenant
insert into public.tenants (
  id, kanzlei_name, domain, subdomain,
  branding_config, subscription_tier, subscription_status,
  inhaber_name, notfall_nummer, rechtsgebiete,
  onboarded_at
) values (
  '11111111-1111-1111-1111-111111111111',
  'Kanzlei Bergmann',
  'kanzlei-bergmann.de',
  'bergmann.systems-tm.de',
  jsonb_build_object(
    'primary_color', '#1A2A3A',
    'accent_color', '#C4B8A4',
    'tonalitaet', 'freundlich',
    'voice_id', 'systems_voice_bergmann',
    'greeting', 'Kanzlei Bergmann, mein Name ist Anna. Wie kann ich Ihnen helfen?'
  ),
  'growth',
  'active',
  'Dr. Maximilian Bergmann',
  '+49 30 123 456 78',
  array['Familienrecht', 'Arbeitsrecht', 'Erbrecht', 'Vertragsrecht'],
  '2026-02-14T10:00:00Z'
)
on conflict (id) do update set
  kanzlei_name = excluded.kanzlei_name,
  branding_config = excluded.branding_config,
  updated_at = now();

-- Hinweis: Nutzer der Kanzlei werden über Magic Links angelegt.
-- Die App sieht beim ersten Login nach, ob ein public.users-Eintrag
-- für die auth.uid() existiert; wenn nein, wird er hier eingefügt
-- (siehe AuthContext / RPC `bootstrap_user`).
--
-- Beispiel-Mandanten / Akten lassen wir hier weg — die werden über
-- den Daten-Importer bzw. die App erzeugt. Mock-Fixtures bleiben
-- für UI-Tests in src/data/mockData.ts.
