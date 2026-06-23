-- Nyitólap első sora: Full HPV → STI → Microbiom, majd kombinált tesztek
-- Futtatás: Supabase SQL Editor (024 után, vagy önállóan is)

update public.products
set sort_order = coalesce(sort_order, 0) + 10000;

-- 1. Full HPV, 2. STI, 3. Microbiom
update public.products set sort_order = 10 where slug = 'hpv-humann-papillomavirus-sam1-onmintavetelezes';
update public.products set sort_order = 20 where slug = 'sti-szexualisan-terjedo-infekciok-sam2-onmintavetelezes';
update public.products set sort_order = 30 where slug = 'microbiom-sam3-onmintavetelezes';

update public.products set sort_order = 10 where name ilike 'Full HPV teszt%' or name ilike 'Full HPV%';
update public.products set sort_order = 20 where name ilike 'STI teszt%';
update public.products set sort_order = 30 where name ilike 'Microbiom teszt%';

update public.products set sort_order = 10
where sort_order > 1000 and name ilike 'HPV (%' and name not ilike '%kombin%';

update public.products set sort_order = 20
where sort_order > 1000 and name ilike 'STI (%' and name not ilike '%kombin%';

update public.products set sort_order = 30
where sort_order > 1000 and name ilike 'Microbiom - SAM3%';

-- Kombinált tesztek utána
update public.products set sort_order = 40 where slug = 'hpv-sti-microbiom-kombinacios-onmintavetelezes';
update public.products set sort_order = 50 where slug = 'sti-microbiom-kombinacios-onmintavetelezes';
update public.products set sort_order = 60 where slug = 'hpv-microbiom-kombinacios-onmintavetelezes';
update public.products set sort_order = 70 where slug = 'hpv-sti-kombinacios-onmintavetelezes';

update public.products set sort_order = 40 where name ilike 'Allin1 teszt%' or name ilike '%Allin1%';
update public.products set sort_order = 50 where name ilike 'Combo3 teszt%' or name ilike '%Combo3%';
update public.products set sort_order = 60 where name ilike 'Combo2 teszt%' or name ilike '%Combo2%';
update public.products set sort_order = 70 where name ilike 'Combo1 teszt%' or name ilike '%Combo1%';

update public.products set sort_order = 40
where sort_order > 1000 and (name ilike '%HPV, STI és Microbiom%' or name ilike '%HPV, STI es Microbiom%');

update public.products set sort_order = 50
where sort_order > 1000 and name ilike '%STI és Microbiom kombin%';

update public.products set sort_order = 60
where sort_order > 1000 and name ilike '%HPV és Microbiom kombin%';

update public.products set sort_order = 70
where sort_order > 1000 and name ilike '%HPV és STI kombin%';

-- Maradék termékek
with ranked as (
  select
    id,
    80 + row_number() over (order by created_at asc, name asc) * 10 as new_order
  from public.products
  where sort_order > 70
)
update public.products p
set sort_order = ranked.new_order
from ranked
where p.id = ranked.id;
