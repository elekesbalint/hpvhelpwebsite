-- Termék cikkszám + kategória megjelenítési sorrend

alter table public.products
  add column if not exists sku text;

create index if not exists idx_products_sku on public.products (sku)
  where sku is not null and sku <> '';

alter table public.categories
  add column if not exists sort_order integer;

update public.categories set sort_order = 1 where slug = 'sam-noi-ontesztek' and sort_order is null;
update public.categories set sort_order = 2 where slug = 'samm-kezelesek-es-kotroll' and sort_order is null;
update public.categories set sort_order = 3 where slug = 'protection-intim-biztonsag' and sort_order is null;
update public.categories set sort_order = 4 where slug = 'egyeb' and sort_order is null;

update public.categories
set sort_order = 100
where sort_order is null;
