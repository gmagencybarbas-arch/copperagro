-- CopperAgro — limpar clientes (só tabelas que existirem)
-- Cole no SQL Editor e execute.

begin;

do $$
declare
  t text;
  tables text[] := array[
    'stock_movements',
    'sales',
    'expenses',
    'sectors',
    'organization_settings',
    'profiles',
    'organizations',
    'keepalive_daily'
  ];
begin
  foreach t in array tables loop
    if to_regclass('public.' || t) is not null then
      execute format('truncate table public.%I restart identity cascade', t);
      raise notice 'truncated: public.%', t;
    else
      raise notice 'skip (não existe): public.%', t;
    end if;
  end loop;
end $$;

-- Contas de login
delete from auth.users;

commit;

-- Conferência (só as que existirem)
select n.nspname || '.' || c.relname as tabela, (xpath('//row/c/text()', query_to_xml(format('select count(*) as c from %I.%I', n.nspname, c.relname), false, true, '')))[1]::text::int as n
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relname in (
    'organizations','profiles','sectors','sales','expenses',
    'stock_movements','organization_settings','keepalive_daily'
  )
union all
select 'auth.users', count(*)::int from auth.users
order by 1;
