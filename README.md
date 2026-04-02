# Webshop Platform

Professional webshop project with Supabase-only backend services.

## Stack

- Frontend: Next.js, TypeScript, Tailwind CSS
- Backend Services: Supabase (PostgreSQL, Auth, Storage, RLS)

## Project Structure

- `frontend`: customer-facing Next.js app
- `TECHNOLOGIAI_ARAJANLAT.md`: project quote and scope

## Quick Start

### 1) Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Runs on `http://localhost:3000`.

### 2) Configure Supabase keys

Set these values in `frontend/.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

You can get both from your Supabase project settings.

## Current Status

- Supabase client initialized in `frontend/src/lib/supabase.ts`
- Frontend starter page updated for Supabase-only architecture
- Auth pages available: `/login`, `/register`
- Admin page available: `/admin` (requires admin role)
- Admin CRUD v1 implemented for categories and products

## Next Implementation Steps

1. Order and checkout flow implementation
2. Public product listing and product details pages
3. Image upload integration to Supabase Storage
4. Admin UX improvements (edit forms, filters, pagination)
