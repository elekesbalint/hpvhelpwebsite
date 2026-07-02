-- Rendelési tételek cikkszám javítása (hibás UUID-részlet vagy üres érték).
-- Futtatás: Supabase SQL Editor, ha NaturaSoftban kimaradtak terméksorok.

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
  );
