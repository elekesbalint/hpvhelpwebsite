-- Növekvő, emberbarát rendelésszám (HH00001, HH00002, …) NaturaSoft iktatószámhoz és megjelenítéshez.

create sequence if not exists public.order_number_seq;

alter table public.orders
  add column if not exists order_number text;

create unique index if not exists orders_order_number_unique
  on public.orders (order_number)
  where order_number is not null;

comment on column public.orders.order_number is
  'Nyilvános rendelésszám: HH + 5 számjegy (pl. HH00001). NaturaSoft rendeles_id / iktatószám.';

-- Meglévő rendelések visszamenőleges számozása létrehozási sorrendben.
with numbered as (
  select
    id,
    row_number() over (order by created_at asc, id asc) as rn
  from public.orders
  where order_number is null
)
update public.orders o
set order_number = 'HH' || lpad(n.rn::text, 5, '0')
from numbered n
where o.id = n.id;

select setval(
  'public.order_number_seq',
  coalesce(
    (
      select max(substring(order_number from 3)::bigint)
      from public.orders
      where order_number ~ '^HH[0-9]+$'
    ),
    0
  )
);

create or replace function public.assign_order_number()
returns trigger
language plpgsql
as $$
begin
  if new.order_number is null or btrim(new.order_number) = '' then
    new.order_number := 'HH' || lpad(nextval('public.order_number_seq')::text, 5, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_orders_assign_order_number on public.orders;
create trigger trg_orders_assign_order_number
before insert on public.orders
for each row
execute function public.assign_order_number();
