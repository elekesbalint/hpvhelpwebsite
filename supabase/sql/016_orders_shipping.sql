-- Szállítási mód és futár nyomkövetés a rendelésen

alter table public.orders
  add column if not exists shipping_method text,
  add column if not exists tracking_number text,
  add column if not exists shipping_carrier text;

comment on column public.orders.shipping_method is 'Checkout: posta | gls | csomagpont | pickup | abroad';
comment on column public.orders.tracking_number is 'GLS/MPL csomagszám a címirat generálás után';
comment on column public.orders.shipping_carrier is 'gls | mpl';
