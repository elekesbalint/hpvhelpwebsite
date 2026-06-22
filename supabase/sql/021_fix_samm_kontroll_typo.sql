-- SAMM kategória: Kotroll → Kontroll (név + slug)

update public.categories
set
  name = 'SAMM - Kezelések és Kontroll',
  slug = 'samm-kezelesek-es-kontroll'
where slug = 'samm-kezelesek-es-kotroll'
   or name ilike '%kotroll%';
