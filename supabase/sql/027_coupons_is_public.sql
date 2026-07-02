-- Publikus kuponok listázása a fiókban; rejtett kuponok csak kézi kódbevitelrel használhatók (pl. HPVC).

alter table public.coupons
  add column if not exists is_public boolean not null default true;

comment on column public.coupons.is_public is
  'Ha false: nem jelenik meg a fiók „Elérhető kuponok” listájában, de checkoutnál beírható a kód.';

update public.coupons
set is_public = false
where upper(code) = 'HPVC';
