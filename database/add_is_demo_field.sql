-- Add is_demo field to companies table
ALTER TABLE companies ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false;

-- Mark all existing demo companies as is_demo = true
UPDATE companies SET is_demo = true WHERE name IN (
  'СофтУни Инженеринг',
  'СтройТех Инженеринг',
  'ЕкоРемонт Про',
  'АрхДизайн Студио',
  'Професионални ВиК услуги',
  'ИнтериорПро Дизайн'
);

-- Mark Encorp (and any other real registered companies) as is_demo = false
UPDATE companies SET is_demo = false WHERE name = 'Encorp';

-- Verify the changes
SELECT id, name, is_demo, is_verified, status FROM companies ORDER BY created_at DESC;
