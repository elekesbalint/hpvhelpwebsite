create or replace function public.decrement_product_stock_for_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_requested_count integer;
  v_updated_count integer;
begin
  if not exists (
    select 1
    from public.orders o
    where o.id = p_order_id
      and (o.user_id = auth.uid() or public.is_admin())
  ) then
    raise exception 'Nincs jogosultság a rendeléshez.';
  end if;

  with requested as (
    select oi.product_id, sum(oi.quantity)::integer as qty
    from public.order_items oi
    where oi.order_id = p_order_id
      and oi.product_id is not null
    group by oi.product_id
  ),
  updated as (
    update public.products p
    set stock = p.stock - r.qty
    from requested r
    where p.id = r.product_id
      and p.stock >= r.qty
    returning p.id
  )
  select
    (select count(*) from requested),
    (select count(*) from updated)
  into v_requested_count, v_updated_count;

  if v_requested_count <> v_updated_count then
    raise exception 'Nincs elegendő készlet az egyik termékből.';
  end if;
end;
$$;

grant execute on function public.decrement_product_stock_for_order(uuid) to authenticated;
