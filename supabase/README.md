# Supabase Setup

This folder contains SQL scripts for the webshop database and security model.

## Files

- `sql/001_schema.sql` - tables, indexes, triggers, auth profile sync, RLS policies
- `sql/002_storage.sql` - storage bucket and object policies for product images
- `sql/003_admin_actions.sql` - audit log table and policies for admin actions

## Apply Order

1. Open Supabase project -> SQL Editor
2. Run `sql/001_schema.sql`
3. Run `sql/002_storage.sql`
4. Run `sql/003_admin_actions.sql`

## Notes

- First registered users are `customer` by default.
- To make an admin, run:

```sql
update public.profiles
set role = 'admin'
where email = 'your-admin-email@example.com';
```

- `public.is_admin()` is used by RLS and storage policies.
- Service role key bypasses RLS; use it only on server-side secure contexts.
