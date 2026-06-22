-- Csomagpont adatok a rendelésen (checkout csomagpont választó)

alter table public.orders
  add column if not exists pickup_point_id text,
  add column if not exists pickup_point_name text,
  add column if not exists pickup_point_address text,
  add column if not exists pickup_point_provider text,
  add column if not exists pickup_point_meta jsonb;

comment on column public.orders.pickup_point_id is 'Belső azonosító: provider:externalId';
comment on column public.orders.pickup_point_provider is 'foxpost | gls | mpl';
comment on column public.orders.pickup_point_meta is 'Címirat API-hoz szükséges extra mezők (providerPointId, deliveryMode, glsPsdId, stb.)';
