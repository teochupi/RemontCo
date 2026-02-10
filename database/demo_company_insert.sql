-- Insert 1 more demo company to make 6 total (3+3 symmetric grid)
-- Run this in Supabase SQL Editor

-- First, you need a demo user. If you don't have one, create a profile first:
-- INSERT INTO profiles (id, username, email, role) 
-- VALUES ('00000000-0000-0000-0000-000000000001', 'demo_company_owner', 'demo@remontco.bg', 'company_admin')
-- ON CONFLICT (id) DO NOTHING;

-- Insert the new demo company
INSERT INTO companies (
  id,
  owner_id,
  name,
  eik,
  description,
  address,
  city,
  phone,
  email,
  website,
  logo_url,
  is_verified,
  status,
  created_at
) VALUES (
  uuid_generate_v4(),
  (SELECT id FROM profiles WHERE role = 'company_admin' LIMIT 1), -- Use existing company owner
  'ИнтериорПро Дизайн',
  '445566778',
  'Професионален интериорен дизайн и обзавеждане. Модерни решения за дома и офиса с внимание към всеки детайл.',
  'бул. Витоша 85',
  'София',
  '0899 445 566',
  'info@interiorpro.bg',
  'www.interiorpro.bg',
  NULL,
  true,
  'approved',
  NOW()
);

-- Get the company ID and add a service category
-- You may need to adjust the category_id based on your service_categories table
INSERT INTO company_services (company_id, category_id)
SELECT 
  c.id,
  (SELECT id FROM service_categories WHERE slug LIKE '%interior%' OR slug LIKE '%design%' OR name_bg LIKE '%интериор%' LIMIT 1)
FROM companies c
WHERE c.name = 'ИнтериорПро Дизайн'
AND EXISTS (SELECT 1 FROM service_categories LIMIT 1);
