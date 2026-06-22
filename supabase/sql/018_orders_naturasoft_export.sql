-- NaturaSoft megrendelés-export követés (webáruház → számlázó XML)

alter table public.orders
  add column if not exists natursoft_exported_at timestamptz;

comment on column public.orders.natursoft_exported_at is
  'Mikor került átadásra a NaturaSoft XML exportban (NULL = még nem exportált).';

create index if not exists idx_orders_natursoft_export
  on public.orders (status, natursoft_exported_at)
  where status = 'paid';
