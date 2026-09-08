-- OPCIONAL — só se quiseres a flag de onboarding também na tabela organizations.
-- O app funciona SEM isto: grava onboarding no Auth (user_metadata).
-- NÃO apaga dados. NÃO mexe em RLS.

alter table public.organizations
  add column if not exists onboarding_completed_at timestamptz;
