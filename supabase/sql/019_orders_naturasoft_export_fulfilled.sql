-- NaturaSoft export index: paid + fulfilled

drop index if exists public.idx_orders_naturasoft_export;

create index if not exists idx_orders_naturasoft_export
  on public.orders (status, natursoft_exported_at)
  where status in ('paid', 'fulfilled');
