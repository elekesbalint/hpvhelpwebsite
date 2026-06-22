-- Admin login security audit + rate-limit support

create table if not exists public.admin_login_attempts (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  ip text,
  user_agent text,
  success boolean not null default false,
  reason text,
  alert_sent boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_login_attempts_created_at
  on public.admin_login_attempts (created_at desc);
create index if not exists idx_admin_login_attempts_email_created_at
  on public.admin_login_attempts (email, created_at desc);
create index if not exists idx_admin_login_attempts_ip_created_at
  on public.admin_login_attempts (ip, created_at desc);

alter table public.admin_login_attempts enable row level security;

drop policy if exists "admin_login_attempts_admin_read" on public.admin_login_attempts;
create policy "admin_login_attempts_admin_read"
on public.admin_login_attempts
for select
to authenticated
using (public.is_admin());

