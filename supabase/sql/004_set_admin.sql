-- Admin jogosultság beállítása email alapján
-- Cseréld ki az emailt a saját admin email cíedre, majd futtasd le

UPDATE public.profiles
SET role = 'admin'
WHERE id = (
  SELECT id FROM auth.users
  WHERE email = 'balint.elekes@gmail.com'
  LIMIT 1
);

-- Ellenőrzés: megjeleníti az admin usereket
SELECT p.id, u.email, p.role
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.role = 'admin';
