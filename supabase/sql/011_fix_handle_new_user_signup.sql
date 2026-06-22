-- Fix: prevent "Database error saving new user" on auth signup
-- Cause: profiles table has unique(email), but old trigger only handles on conflict(id).
-- If an orphan profile row with the same email exists (different id), an uncaught
-- unique_violation exception propagates and Supabase Auth returns 500.

-- Step 1: clean up orphan profiles that have no auth user AND no orders
DELETE FROM public.profiles p
WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p.id)
  AND NOT EXISTS (SELECT 1 FROM public.orders o WHERE o.user_id = p.id);

-- Step 2: replace the trigger function with a safe version
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  begin
    insert into public.profiles (id, email, full_name)
    values (
      new.id,
      new.email,
      coalesce(new.raw_user_meta_data->>'full_name', '')
    )
    on conflict (id) do update
      set email     = excluded.email,
          full_name = excluded.full_name,
          updated_at = now();
  exception
    when unique_violation then
      -- Email conflict: only remove the stale row if it has no orders attached.
      if not exists (
        select 1 from public.orders o
        where o.user_id = (
          select id from public.profiles
          where email = new.email and id <> new.id
          limit 1
        )
      ) then
        delete from public.profiles
        where email = new.email and id <> new.id;

        insert into public.profiles (id, email, full_name)
        values (
          new.id,
          new.email,
          coalesce(new.raw_user_meta_data->>'full_name', '')
        )
        on conflict (id) do update
          set email     = excluded.email,
              full_name = excluded.full_name,
              updated_at = now();
      end if;
  end;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
