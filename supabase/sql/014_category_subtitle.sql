-- Kategória alcím (megjelenő leírás a név alatt, pl. IntimSelfCare oldalon)

alter table public.categories
  add column if not exists subtitle text;
