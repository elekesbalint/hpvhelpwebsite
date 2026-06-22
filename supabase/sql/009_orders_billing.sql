-- Számlázási adatok és szállítási e-mail külön mezőkben (ne a notes-ban legyenek).

alter table public.orders
  add column if not exists shipping_email text;

alter table public.orders
  add column if not exists billing_name text;

alter table public.orders
  add column if not exists billing_tax_number text;

alter table public.orders
  add column if not exists billing_address text;

alter table public.orders
  add column if not exists billing_company_contact text;

comment on column public.orders.shipping_email is 'Vevő e-mail a checkoutból (értesítésekhez).';
comment on column public.orders.billing_name is 'Számlázási név (cég vagy magánszemély).';
comment on column public.orders.billing_tax_number is 'Adószám (cég).';
comment on column public.orders.billing_address is 'Számlázási cím, ha eltér a szállítástól.';
comment on column public.orders.billing_company_contact is 'Cég + kapcsolattartó szállításhoz (céges rendelés).';
