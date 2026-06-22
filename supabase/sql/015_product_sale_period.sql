-- Termék leárazás / kedvezmény időszaka (mettől–meddig)

alter table public.products
  add column if not exists sale_starts_at timestamptz,
  add column if not exists sale_ends_at timestamptz;
