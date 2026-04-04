alter table public.categories
  add column if not exists vat_rate numeric(5,2);

alter table public.products
  add column if not exists vat_rate numeric(5,2);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'categories_vat_rate_check'
  ) then
    alter table public.categories
      add constraint categories_vat_rate_check
      check (vat_rate is null or (vat_rate >= 0 and vat_rate <= 100));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'products_vat_rate_check'
  ) then
    alter table public.products
      add constraint products_vat_rate_check
      check (vat_rate is null or (vat_rate >= 0 and vat_rate <= 100));
  end if;
end $$;
