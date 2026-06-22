-- Alap webshop konfiguracio:
-- 1) Fizetesi modok: alapbol csak bankkartya aktiv
-- 2) Kategoriak: SAM1 (TAM 0%), SAM2 (27%)

insert into public.app_settings (key, value)
values ('enabled_payment_methods', '["card"]'::jsonb)
on conflict (key) do nothing;

insert into public.categories (name, slug, vat_rate, is_active)
values
  ('SAM1  SEXUAL ACTIVITY MONITORING (IntimSelfCare)', 'sam1-sexual-activity-monitoring-intimselfcare', 0, true),
  ('SAM2  SEXUAL ACTIVITY MEDICINE', 'sam2-sexual-activity-medicine', 27, true)
on conflict (slug) do update
set
  vat_rate = excluded.vat_rate,
  is_active = true;
