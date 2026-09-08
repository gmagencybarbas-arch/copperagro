-- Keep-alive CopperAgro — evita pausa do free tier por inatividade
-- Cole no SQL Editor do Supabase e execute (depois de reativar o projeto).

create table if not exists public.keepalive_daily (
  day date primary key,
  users_count bigint not null default 0 check (users_count >= 0),
  updated_at timestamptz not null default now()
);

comment on table public.keepalive_daily is
  'Ping diário: grava o dia e soma +1 em users_count para manter o projeto activo.';

create or replace function public.keepalive_bump()
returns public.keepalive_daily
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.keepalive_daily;
begin
  insert into public.keepalive_daily (day, users_count)
  values ((timezone('America/Sao_Paulo', now()))::date, 1)
  on conflict (day) do update
    set users_count = public.keepalive_daily.users_count + 1,
        updated_at = now()
  returning * into r;
  return r;
end;
$$;

revoke all on function public.keepalive_bump() from public;
grant execute on function public.keepalive_bump() to anon, authenticated, service_role;

alter table public.keepalive_daily enable row level security;

drop policy if exists "keepalive_daily_select_anon" on public.keepalive_daily;
create policy "keepalive_daily_select_anon"
  on public.keepalive_daily for select
  to anon, authenticated
  using (true);
