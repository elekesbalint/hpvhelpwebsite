-- SAM öntesztek: 27% ÁFA (korábban 0% TAM lehetett a kategórián)
-- Futtatás: Supabase SQL Editor. Az adminban is ellenőrizhető: Kategóriák → SAM → ÁFA.

update public.categories
set vat_rate = 27
where slug in ('sam-noi-ontesztek', 'sam1-sexual-activity-monitoring-intimselfcare')
   or parent_id in (
     select id from public.categories
     where slug in ('sam-noi-ontesztek', 'sam1-sexual-activity-monitoring-intimselfcare')
   );
