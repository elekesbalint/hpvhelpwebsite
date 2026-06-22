-- Termék megjelenítési sorrend (admin + webshop)

alter table public.products
  add column if not exists sort_order integer;

comment on column public.products.sort_order is
  'Megjelenítési sorrend (kisebb = előrébb). NULL = régi sorrend (created_at).';

-- Meglévő termékek: létrehozás szerinti sorrend, 10-es lépésköz (később könnyű beszúrni)
with numbered as (
  select
    id,
    row_number() over (order by created_at asc, name asc) * 10 as ord
  from public.products
  where sort_order is null
)
update public.products p
set sort_order = numbered.ord
from numbered
where p.id = numbered.id;

create index if not exists idx_products_sort_order on public.products (sort_order);
