-- Csomagpont rendelések: shipping_method javítása, ha pickup_point_id megvan de posta/gls van mentve.

update public.orders
set shipping_method = 'csomagpont'
where pickup_point_id is not null
  and pickup_point_id <> ''
  and shipping_method in ('posta', 'gls');

-- HH00073 és hasonló: újra-exportálható (NaturaSoftban törölni a hibás megrendelést előtte)
update public.orders
set natursoft_exported_at = null
where order_number = 'HH00073';
