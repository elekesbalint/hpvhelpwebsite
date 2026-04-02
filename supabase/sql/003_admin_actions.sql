-- Admin audit log table for critical operations
-- Run after 001_schema.sql

create table if not exists public.admin_actions (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references public.profiles (id) on delete restrict,
  action_type text not null,
  entity_type text not null,
  entity_id text not null,
  meta jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_actions_created_at on public.admin_actions (created_at desc);
create index if not exists idx_admin_actions_admin_user_id on public.admin_actions (admin_user_id);
create index if not exists idx_admin_actions_entity on public.admin_actions (entity_type, entity_id);

alter table public.admin_actions enable row level security;

drop policy if exists "admin_actions_admin_read" on public.admin_actions;
create policy "admin_actions_admin_read"
on public.admin_actions
for select
to authenticated
using (public.is_admin());

drop policy if exists "admin_actions_admin_insert" on public.admin_actions;
create policy "admin_actions_admin_insert"
on public.admin_actions
for insert
to authenticated
with check (public.is_admin());
