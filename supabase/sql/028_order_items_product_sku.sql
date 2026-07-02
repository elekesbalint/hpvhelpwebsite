-- NaturaSoft export: cikkszám pillanatkép a rendelés leadásakor (nem csak későbbi termékadatból).

alter table public.order_items
  add column if not exists product_sku text;

comment on column public.order_items.product_sku is
  'NaturaSoft cikkszám a rendelés pillanatában (products.sku / leírás / katalógus).';

-- IntimSelfCare SAM termékek cikkszáma (ha adminban még nincs kitöltve)
update public.products set sku = 'SAM001' where slug = 'hpv-humann-papillomavirus-sam1-onmintavetelezes' and (sku is null or sku = '');
update public.products set sku = 'ZNS002' where slug = 'sti-szexualisan-terjedo-infekciok-sam2-onmintavetelezes' and (sku is null or sku = '');
update public.products set sku = 'ZNS003' where slug = 'microbiom-sam3-onmintavetelezes' and (sku is null or sku = '');
update public.products set sku = 'ZNS004' where slug = 'hpv-sti-kombinacios-onmintavetelezes' and (sku is null or sku = '');
update public.products set sku = 'ZNS005' where slug = 'sti-microbiom-kombinacios-onmintavetelezes' and (sku is null or sku = '');
update public.products set sku = 'ZNS006' where slug = 'hpv-microbiom-kombinacios-onmintavetelezes' and (sku is null or sku = '');
update public.products set sku = 'ZNS007' where slug = 'hpv-sti-microbiom-kombinacios-onmintavetelezes' and (sku is null or sku = '');

-- Meglévő rendelési tételek visszamenőleges cikkszáma
update public.order_items oi
set product_sku = p.sku
from public.products p
where oi.product_id = p.id
  and (oi.product_sku is null or oi.product_sku = '')
  and p.sku is not null
  and p.sku <> '';
