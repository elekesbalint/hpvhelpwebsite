-- Alkategóriák: parent_id + IntimSelfCare ágrajz alapján előre feltöltött alkategóriák.

alter table public.categories
  add column if not exists parent_id uuid references public.categories (id) on delete set null;

create index if not exists categories_parent_id_idx on public.categories (parent_id);

comment on column public.categories.parent_id is 'Felső kategória (alkategória esetén). Max. 2 szint.';

-- SAM – öntesztek alkategóriák
insert into public.categories (name, slug, parent_id, vat_rate, is_active, sort_order)
select v.name, v.slug, p.id, p.vat_rate, true, v.sort_order
from (
  values
    ('Női – HPV', 'noi-hpv', 1),
    ('Női – STI', 'noi-sti', 2),
    ('Női – Microbiom', 'noi-microbiom', 3),
    ('Kombinált – HPV + STI', 'combo-hpv-sti', 4),
    ('Kombinált – STI + Microbiom', 'combo-sti-microbiom', 5),
    ('Kombinált – HPV + Microbiom', 'combo-hpv-microbiom', 6),
    ('Kombinált – All-in (HPV + STI + Microbiom)', 'combo-allin-hpv-sti-microbiom', 7),
    ('Férfi – HPV', 'ferfi-hpv', 8),
    ('Oral', 'oral', 9),
    ('Anus', 'anus', 10)
) as v(name, slug, sort_order)
cross join lateral (
  select id, vat_rate from public.categories where slug = 'sam-noi-ontesztek' limit 1
) p
where p.id is not null
on conflict (slug) do update set
  name = excluded.name,
  parent_id = excluded.parent_id,
  sort_order = excluded.sort_order,
  is_active = true;

-- SAMM alkategóriák
insert into public.categories (name, slug, parent_id, vat_rate, is_active, sort_order)
select v.name, v.slug, p.id, p.vat_rate, true, v.sort_order
from (
  values
    ('Hüvelyi készítmények', 'samm-huvelyi-keszitmenyek', 1),
    ('Kapszulák', 'samm-kapszulak', 2)
) as v(name, slug, sort_order)
cross join lateral (
  select id, vat_rate from public.categories where slug = 'samm-kezelesek-es-kontroll' limit 1
) p
where p.id is not null
on conflict (slug) do update set
  name = excluded.name,
  parent_id = excluded.parent_id,
  sort_order = excluded.sort_order,
  is_active = true;
