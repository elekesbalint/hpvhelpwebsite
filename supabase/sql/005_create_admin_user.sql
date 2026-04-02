-- Admin user létrehozása SQL-ből (email + jelszó), majd admin role beállítás.
-- FUTTATÁS ELŐTT: cseréld ki a lenti értékeket a saját adataidra.
--
-- default értékek:
--   email:     balint.elekes@gmail.com
--   full_name: Elekes Bálint
--   password:  ABCdef123
--
-- Javaslat: első belépés után változtasd meg a jelszót.

do $$
declare
  v_email text := 'balint.elekes@gmail.com';
  v_full_name text := 'Elekes Bálint';
  v_password text := 'ABCdef123';
  v_user_id uuid;
  v_instance_id uuid;
begin
  -- auth instance id
  select id into v_instance_id from auth.instances limit 1;

  -- ha már létezik a user, annak az id-ját használjuk
  select id into v_user_id
  from auth.users
  where email = v_email
  limit 1;

  -- ha nem létezik, létrehozzuk
  if v_user_id is null then
    v_user_id := gen_random_uuid();

    insert into auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      confirmation_sent_at,
      recovery_sent_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    )
    values (
      v_instance_id,
      v_user_id,
      'authenticated',
      'authenticated',
      v_email,
      crypt(v_password, gen_salt('bf')),
      now(),
      now(),
      null,
      jsonb_build_object('provider', 'email', 'providers', array['email']),
      jsonb_build_object('full_name', v_full_name),
      now(),
      now()
    );
  else
    -- ha létező user, frissítjük a nevet + megerősítjük az emailt + új jelszót állítunk
    update auth.users
    set
      aud = 'authenticated',
      role = 'authenticated',
      encrypted_password = crypt(v_password, gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('provider', 'email', 'providers', array['email']),
      raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('full_name', v_full_name),
      updated_at = now()
    where id = v_user_id;
  end if;

  -- auth.identities rekord is kell a password loginhoz
  insert into auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    created_at,
    updated_at,
    last_sign_in_at
  )
  values (
    v_user_id,
    v_user_id,
    jsonb_build_object('sub', v_user_id::text, 'email', v_email),
    'email',
    v_email,
    now(),
    now(),
    now()
  )
  on conflict (provider, provider_id) do update
  set
    user_id = excluded.user_id,
    identity_data = excluded.identity_data,
    updated_at = now();

  -- profile sor (ha trigger nem futna valamiért, így is biztosan meglesz)
  insert into public.profiles (id, email, full_name, role)
  values (v_user_id, v_email, v_full_name, 'admin')
  on conflict (id) do update
    set
      email = excluded.email,
      full_name = excluded.full_name,
      role = 'admin',
      updated_at = now();
end $$;

-- ellenőrzés
select p.id, u.email, p.full_name, p.role
from public.profiles p
join auth.users u on u.id = p.id
where u.email = 'balint.elekes@gmail.com';

select user_id, provider, provider_id
from auth.identities
where user_id = (
  select id from auth.users where email = 'balint.elekes@gmail.com' limit 1
);

