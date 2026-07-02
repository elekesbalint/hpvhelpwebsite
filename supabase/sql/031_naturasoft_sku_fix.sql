-- NaturaSoft export: SAM cikkszámok javítása (NaturaSoft törzs szerint).

-- SAM Full HPV → SAM001 (NaturaSoft törzs)
update public.products set sku = 'SAM001'
where slug = 'hpv-humann-papillomavirus-sam1-onmintavetelezes'
  and (sku is null or sku = '' or sku = 'ZNS001' or sku ~* '^sams');

-- Többi SAM teszt → SAM002–SAM007
update public.products set sku = 'SAM002'
where slug = 'sti-szexualisan-terjedo-infekciok-sam2-onmintavetelezes'
  and (sku is null or sku = '' or sku ~* '^(sam|zns)');

update public.products set sku = 'SAM003'
where slug = 'microbiom-sam3-onmintavetelezes'
  and (sku is null or sku = '' or sku ~* '^(sam|zns)');

update public.products set sku = 'SAM004'
where slug = 'hpv-sti-kombinacios-onmintavetelezes'
  and (sku is null or sku = '' or sku ~* '^(sam|zns)');

update public.products set sku = 'SAM005'
where slug = 'sti-microbiom-kombinacios-onmintavetelezes'
  and (sku is null or sku = '' or sku ~* '^(sam|zns)');

update public.products set sku = 'SAM006'
where slug = 'hpv-microbiom-kombinacios-onmintavetelezes'
  and (sku is null or sku = '' or sku ~* '^(sam|zns)');

update public.products set sku = 'SAM007'
where slug = 'hpv-sti-microbiom-kombinacios-onmintavetelezes'
  and (sku is null or sku = '' or sku ~* '^(sam|zns)');

-- Rendelési tételek: frissítés termék SKU-ra, ha hibás
update public.order_items oi
set product_sku = p.sku
from public.products p
where oi.product_id = p.id
  and p.sku is not null
  and p.sku <> ''
  and (
    oi.product_sku is null
    or oi.product_sku = ''
    or oi.product_sku ~ '^[0-9a-f]{8}$'
    or oi.product_sku ~* '^sam[^0-9]'
    or oi.product_sku ~* '^sams'
  );
