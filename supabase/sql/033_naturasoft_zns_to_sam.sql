-- ZNS* → SAM* cikkszámok (NaturaSoft törzs szerint) + HH00073 újra-export.

update public.products
set sku = 'SAM001'
where slug = 'hpv-humann-papillomavirus-sam1-onmintavetelezes'
  and (sku is null or sku = '' or sku ~* '^zns');

update public.order_items
set product_sku = 'SAM001'
where product_sku ~* '^zns001$';

update public.orders
set natursoft_exported_at = null
where order_number in ('HH00073', 'HH00074', 'HH00075');
