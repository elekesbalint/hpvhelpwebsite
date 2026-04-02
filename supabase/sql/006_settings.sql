-- App settings tábla karbantartás módhoz és egyéb beállításokhoz
CREATE TABLE IF NOT EXISTS public.app_settings (
  key   TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT 'null'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alapértelmezett karbantartás mód: kikapcsolt
INSERT INTO public.app_settings (key, value)
VALUES ('maintenance_mode', 'false'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- RLS: csak admin olvashatja/írhatja
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read app_settings" ON public.app_settings;
DROP POLICY IF EXISTS "Admin write app_settings" ON public.app_settings;

CREATE POLICY "Public read app_settings"
  ON public.app_settings FOR SELECT
  USING (true);

CREATE POLICY "Admin write app_settings"
  ON public.app_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
