-- Diagnóstico rápido — cola no SQL Editor e manda o resultado se ainda falhar
select table_name, column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name in ('sales', 'expenses', 'stock_movements', 'organizations', 'profiles', 'sectors')
order by table_name, ordinal_position;
