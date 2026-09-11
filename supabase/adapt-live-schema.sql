-- =============================================================================
-- OPCIONAL — NÃO é migração obrigatória. NÃO cria tabelas novas.
-- =============================================================================
-- Contexto: o Vercel por vezes apontava para um projeto Supabase ANTIGO
-- (schema com profiles / sale_date / organization_settings). O banco CORRETO
-- do CopperAgro é o projeto live (organizations.id = user, coluna date,
-- stock_base_sacas). O app já funciona com esse schema sem alterar o banco.
--
-- Este ficheiro só adiciona, se quiseres, a flag de onboarding em organizations.
-- Onboarding também funciona só via Auth user_metadata (sem esta coluna).
-- NÃO apaga dados. NÃO mexe em RLS. NÃO cria ai_launches nem tabelas AI.
-- =============================================================================

alter table public.organizations
  add column if not exists onboarding_completed_at timestamptz;

