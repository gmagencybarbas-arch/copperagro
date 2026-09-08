-- CopperAgro — INSTALAÇÃO LIMPA
-- ⚠️ NÃO USE no projeto com dados / schema já existente (date, stock_base_sacas, etc.).
-- Para o banco real: supabase/adapt-live-schema.sql
--
-- Usa isto APENAS se quiseres apagar tabelas públicas do app e recriar do zero.
-- Contas em auth.users NÃO são apagadas aqui — apaga no Auth se precisares.

-- 1) Remover views/tabelas antigas
drop view if exists public.admin_monthly_sales cascade;
drop view if exists public.admin_client_overview cascade;

drop table if exists public.keepalive_daily cascade;
drop table if exists public.stock_movements cascade;
drop table if exists public.sales cascade;
drop table if exists public.expenses cascade;
drop table if exists public.sectors cascade;
drop table if exists public.organization_settings cascade;
drop table if exists public.profiles cascade;
drop table if exists public.organizations cascade;

drop function if exists public.handle_new_user() cascade;
drop function if exists public.current_org_id() cascade;
drop function if exists public.is_platform_admin() cascade;
drop function if exists public.keepalive_bump() cascade;

-- 2) Schema novo (igual a schema.sql)
create extension if not exists "pgcrypto";

do $$ begin
  create type public.movement_type as enum ('entry', 'exit');
exception
  when duplicate_object then null;
end $$;

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  plan text not null default 'standard' check (plan in ('standard', 'plus', 'infinity')),
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  email text not null,
  telegram_id text,
  role text not null default 'owner' check (role in ('owner', 'member')),
  is_platform_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_settings (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  stock_total_sacas bigint not null default 0 check (stock_total_sacas >= 0),
  updated_at timestamptz not null default now()
);

create table public.sectors (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  id text not null,
  name text not null,
  unit text not null,
  color text not null,
  icon text not null default 'boxes',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (organization_id, id)
);

create table public.sales (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  sector_id text not null,
  sale_date date not null,
  quantity bigint not null check (quantity > 0),
  unit_price numeric(14, 4) not null check (unit_price > 0),
  total_price numeric(14, 2) not null,
  buyer text not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (organization_id, sector_id) references public.sectors(organization_id, id)
);

create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  sector_id text not null,
  movement_date date not null,
  type public.movement_type not null,
  quantity bigint not null check (quantity > 0),
  note text,
  related_sale_id uuid references public.sales(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  foreign key (organization_id, sector_id) references public.sectors(organization_id, id)
);

create unique index stock_movements_sale_exit
  on public.stock_movements (organization_id, related_sale_id)
  where related_sale_id is not null;

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  sector_id text,
  expense_date date not null,
  description text not null,
  amount numeric(14, 2) not null check (amount > 0),
  category text not null default 'outros'
    check (category in ('combustível', 'manutenção', 'mão de obra', 'insumos', 'outros')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  foreign key (organization_id, sector_id) references public.sectors(organization_id, id)
);

create index sales_org_date on public.sales (organization_id, sale_date desc);
create index sales_org_sector on public.sales (organization_id, sector_id);
create index stock_org_date on public.stock_movements (organization_id, movement_date desc);
create index expenses_org_date on public.expenses (organization_id, expense_date desc);
create index profiles_org on public.profiles (organization_id);

create or replace function public.current_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id from public.profiles where id = auth.uid()
$$;

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select is_platform_admin from public.profiles where id = auth.uid()),
    false
  )
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  org_id uuid;
  display_name text;
  company_name text;
begin
  display_name := nullif(trim(coalesce(new.raw_user_meta_data->>'name', '')), '');
  company_name := nullif(trim(coalesce(new.raw_user_meta_data->>'company_name', '')), '');
  if display_name is null then
    display_name := split_part(new.email, '@', 1);
  end if;
  if company_name is null then
    company_name := 'Minha Fazenda';
  end if;

  insert into public.organizations (name, plan)
  values (company_name, 'standard')
  returning id into org_id;

  insert into public.profiles (id, organization_id, name, email, role)
  values (new.id, org_id, display_name, new.email, 'owner');

  insert into public.organization_settings (organization_id, stock_total_sacas)
  values (org_id, 0);

  insert into public.sectors (organization_id, id, name, unit, color, icon) values
    (org_id, 'cafe', 'Café', 'saca', 'green', 'coffee'),
    (org_id, 'leite', 'Leite', 'litro', 'blue', 'milk'),
    (org_id, 'bovino', 'Bovino', 'arroba', 'amber', 'beef'),
    (org_id, 'hortifruti', 'Hortifruti', 'caixa', 'rose', 'sprout');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.organization_settings enable row level security;
alter table public.sectors enable row level security;
alter table public.sales enable row level security;
alter table public.stock_movements enable row level security;
alter table public.expenses enable row level security;

drop policy if exists "orgs_select" on public.organizations;
create policy "orgs_select" on public.organizations for select
  using (id = public.current_org_id() or public.is_platform_admin());
drop policy if exists "orgs_update" on public.organizations;
create policy "orgs_update" on public.organizations for update
  using (id = public.current_org_id() or public.is_platform_admin());

drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles for select
  using (organization_id = public.current_org_id() or public.is_platform_admin() or id = auth.uid());
drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_update" on public.profiles for update
  using (id = auth.uid() or public.is_platform_admin());

drop policy if exists "settings_select" on public.organization_settings;
create policy "settings_select" on public.organization_settings for select
  using (organization_id = public.current_org_id() or public.is_platform_admin());
drop policy if exists "settings_update" on public.organization_settings;
create policy "settings_update" on public.organization_settings for update
  using (organization_id = public.current_org_id() or public.is_platform_admin());
drop policy if exists "settings_insert" on public.organization_settings;
create policy "settings_insert" on public.organization_settings for insert
  with check (organization_id = public.current_org_id() or public.is_platform_admin());

drop policy if exists "sectors_select" on public.sectors;
create policy "sectors_select" on public.sectors for select
  using (organization_id = public.current_org_id() or public.is_platform_admin());
drop policy if exists "sectors_insert" on public.sectors;
create policy "sectors_insert" on public.sectors for insert
  with check (organization_id = public.current_org_id() or public.is_platform_admin());
drop policy if exists "sectors_update" on public.sectors;
create policy "sectors_update" on public.sectors for update
  using (organization_id = public.current_org_id() or public.is_platform_admin());

drop policy if exists "sales_select" on public.sales;
create policy "sales_select" on public.sales for select
  using (organization_id = public.current_org_id() or public.is_platform_admin());
drop policy if exists "sales_insert" on public.sales;
create policy "sales_insert" on public.sales for insert
  with check (organization_id = public.current_org_id() or public.is_platform_admin());
drop policy if exists "sales_update" on public.sales;
create policy "sales_update" on public.sales for update
  using (organization_id = public.current_org_id() or public.is_platform_admin());
drop policy if exists "sales_delete" on public.sales;
create policy "sales_delete" on public.sales for delete
  using (organization_id = public.current_org_id() or public.is_platform_admin());

drop policy if exists "stock_select" on public.stock_movements;
create policy "stock_select" on public.stock_movements for select
  using (organization_id = public.current_org_id() or public.is_platform_admin());
drop policy if exists "stock_insert" on public.stock_movements;
create policy "stock_insert" on public.stock_movements for insert
  with check (organization_id = public.current_org_id() or public.is_platform_admin());
drop policy if exists "stock_update" on public.stock_movements;
create policy "stock_update" on public.stock_movements for update
  using (organization_id = public.current_org_id() or public.is_platform_admin());
drop policy if exists "stock_delete" on public.stock_movements;
create policy "stock_delete" on public.stock_movements for delete
  using (organization_id = public.current_org_id() or public.is_platform_admin());

drop policy if exists "expenses_select" on public.expenses;
create policy "expenses_select" on public.expenses for select
  using (organization_id = public.current_org_id() or public.is_platform_admin());
drop policy if exists "expenses_insert" on public.expenses;
create policy "expenses_insert" on public.expenses for insert
  with check (organization_id = public.current_org_id() or public.is_platform_admin());
drop policy if exists "expenses_update" on public.expenses;
create policy "expenses_update" on public.expenses for update
  using (organization_id = public.current_org_id() or public.is_platform_admin());
drop policy if exists "expenses_delete" on public.expenses;
create policy "expenses_delete" on public.expenses for delete
  using (organization_id = public.current_org_id() or public.is_platform_admin());

create or replace view public.admin_client_overview as
select
  o.id as organization_id,
  o.name as farm_name,
  o.plan,
  o.created_at as client_since,
  p.id as owner_id,
  p.name as owner_name,
  p.email as owner_email,
  coalesce((
    select sum(s.total_price)::numeric(14,2) from public.sales s where s.organization_id = o.id
  ), 0) as sales_revenue,
  coalesce((
    select sum(s.quantity) from public.sales s where s.organization_id = o.id
  ), 0) as sales_quantity,
  coalesce((
    select count(*) from public.sales s where s.organization_id = o.id
  ), 0) as sales_count,
  coalesce((
    select sum(e.amount)::numeric(14,2) from public.expenses e where e.organization_id = o.id
  ), 0) as expenses_total,
  coalesce((
    select st.stock_total_sacas from public.organization_settings st where st.organization_id = o.id
  ), 0) as stock_contract,
  coalesce((
    select sum(case when m.type = 'entry' then m.quantity else 0 end)
    from public.stock_movements m where m.organization_id = o.id
  ), 0) as stock_entries,
  coalesce((
    select sum(case when m.type = 'exit' then m.quantity else 0 end)
    from public.stock_movements m where m.organization_id = o.id
  ), 0) as stock_exits,
  (
    select count(*) from public.sectors sec where sec.organization_id = o.id
  ) as sector_count
from public.organizations o
left join public.profiles p
  on p.organization_id = o.id and p.role = 'owner';

create or replace view public.admin_monthly_sales as
select
  s.organization_id,
  o.name as farm_name,
  date_trunc('month', s.sale_date)::date as month,
  sum(s.quantity) as quantity,
  sum(s.total_price)::numeric(14,2) as revenue,
  avg(s.unit_price)::numeric(14,4) as avg_unit_price
from public.sales s
join public.organizations o on o.id = s.organization_id
group by 1, 2, 3;

grant select on public.admin_client_overview to authenticated;
grant select on public.admin_monthly_sales to authenticated;
grant execute on function public.current_org_id() to authenticated, anon;
grant execute on function public.is_platform_admin() to authenticated, anon;
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
