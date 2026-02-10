-- Seed Data for RemontCo Platform
-- Initial data for development and testing

-- =====================================================
-- SERVICE CATEGORIES
-- =====================================================

-- Root categories
INSERT INTO service_categories (id, parent_id, name_bg, name_en, slug, icon, order_index) VALUES
  ('11111111-1111-1111-1111-111111111111', NULL, 'Вътрешни Ремонти', 'Interior Renovation', 'interior-renovation', 'bi-house-door', 1),
  ('22222222-2222-2222-2222-222222222222', NULL, 'ВиК', 'Plumbing', 'plumbing', 'bi-droplet', 2),
  ('33333333-3333-3333-3333-333333333333', NULL, 'Ел. Инсталации', 'Electrical Services', 'electrical', 'bi-lightning', 3),
  ('44444444-4444-4444-4444-444444444444', NULL, 'Ключарски Услуги', 'Locksmith Services', 'locksmith', 'bi-key', 4),
  ('55555555-5555-5555-5555-555555555555', NULL, 'Бояджийство', 'Painting & Finishing', 'painting', 'bi-paint-bucket', 5),
  ('66666666-6666-6666-6666-666666666666', NULL, 'Покриви и Улуци', 'Roofing & Drainage', 'roofing', 'bi-house', 6),
  ('77777777-7777-7777-7777-777777777777', NULL, 'Строителство', 'Construction', 'construction', 'bi-building', 7),
  ('88888888-8888-8888-8888-888888888888', NULL, 'Преместване', 'Moving Services', 'moving', 'bi-truck', 8),
  ('99999999-9999-9999-9999-999999999999', NULL, 'Интериорен Дизайн', 'Interior Design', 'interior-design', 'bi-palette', 9),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NULL, 'Екстериорен Дизайн', 'Exterior Design', 'exterior-design', 'bi-brush', 10),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NULL, 'Градинарство', 'Landscaping & Gardening', 'landscaping', 'bi-tree', 11),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', NULL, 'Мебели', 'Furniture & Custom Interiors', 'furniture', 'bi-box', 12),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', NULL, 'Обслужване на Сгради', 'Building Maintenance', 'maintenance', 'bi-tools', 13),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', NULL, 'Почистване', 'Cleaning Services', 'cleaning', 'bi-trash', 14),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', NULL, 'Умен Дом', 'Smart Home & Security', 'smart-home', 'bi-shield-check', 15),
  ('10101010-1010-1010-1010-101010101010', NULL, 'Специализирани Услуги', 'Specialized Construction', 'specialized', 'bi-gear', 16);

-- Subcategories for Interior Renovation
INSERT INTO service_categories (parent_id, name_bg, name_en, slug, order_index) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Окачени Тавани', 'Suspended Ceilings', 'suspended-ceilings', 1),
  ('11111111-1111-1111-1111-111111111111', 'Сухо Строителство', 'Drywall', 'drywall', 2),
  ('11111111-1111-1111-1111-111111111111', 'Подови Настилки', 'Flooring', 'flooring', 3),
  ('11111111-1111-1111-1111-111111111111', 'Облицовки', 'Tiling', 'tiling', 4);

-- Subcategories for Plumbing
INSERT INTO service_categories (parent_id, name_bg, name_en, slug, order_index) VALUES
  ('22222222-2222-2222-2222-222222222222', 'Отпушване', 'Drain Cleaning', 'drain-cleaning', 1),
  ('22222222-2222-2222-2222-222222222222', 'Монтаж Санитария', 'Sanitary Installation', 'sanitary-install', 2),
  ('22222222-2222-2222-2222-222222222222', 'Ремонт Течове', 'Leak Repair', 'leak-repair', 3),
  ('22222222-2222-2222-2222-222222222222', 'Канализация', 'Sewage Systems', 'sewage', 4);

-- Subcategories for Electrical
INSERT INTO service_categories (parent_id, name_bg, name_en, slug, order_index) VALUES
  ('33333333-3333-3333-3333-333333333333', 'Ел. Инсталации', 'Electrical Installations', 'electrical-install', 1),
  ('33333333-3333-3333-3333-333333333333', 'LED Осветление', 'LED Lighting', 'led-lighting', 2),
  ('33333333-3333-3333-3333-333333333333', 'Табла и Разпределение', 'Electrical Panels', 'panels', 3),
  ('33333333-3333-3333-3333-333333333333', 'Ремонт Уреди', 'Appliance Repair', 'appliance-repair', 4);

-- Subcategories for Roofing
INSERT INTO service_categories (parent_id, name_bg, name_en, slug, order_index) VALUES
  ('66666666-6666-6666-6666-666666666666', 'Монтаж Покриви', 'Roof Installation', 'roof-install', 1),
  ('66666666-6666-6666-6666-666666666666', 'Ремонт Покриви', 'Roof Repair', 'roof-repair', 2),
  ('66666666-6666-6666-6666-666666666666', 'Улуци', 'Gutters', 'gutters', 3),
  ('66666666-6666-6666-6666-666666666666', 'Хидроизолация', 'Waterproofing', 'waterproofing', 4);

-- Subcategories for Construction
INSERT INTO service_categories (parent_id, name_bg, name_en, slug, order_index) VALUES
  ('77777777-7777-7777-7777-777777777777', 'Жилищно Строителство', 'Residential Construction', 'residential', 1),
  ('77777777-7777-7777-7777-777777777777', 'Търговско Строителство', 'Commercial Construction', 'commercial', 2),
  ('77777777-7777-7777-7777-777777777777', 'Реконструкции', 'Renovations', 'renovations', 3),
  ('77777777-7777-7777-7777-777777777777', 'Бетонни Работи', 'Concrete Work', 'concrete', 4);

-- Subcategories for Cleaning
INSERT INTO service_categories (parent_id, name_bg, name_en, slug, order_index) VALUES
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Почистване След Ремонт', 'Post-Renovation Cleaning', 'post-renovation', 1),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Дълбоко Почистване', 'Deep Cleaning', 'deep-cleaning', 2),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Почистване Офиси', 'Office Cleaning', 'office-cleaning', 3),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Машинно Почистване', 'Machine Cleaning', 'machine-cleaning', 4);

-- Subcategories for Smart Home
INSERT INTO service_categories (parent_id, name_bg, name_en, slug, order_index) VALUES
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Видеонаблюдение', 'CCTV Systems', 'cctv', 1),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Контрол Достъп', 'Access Control', 'access-control', 2),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Домашна Автоматизация', 'Home Automation', 'automation', 3),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Пожароизвестяване', 'Fire Alarm Systems', 'fire-alarm', 4);

-- =====================================================
-- DEMO ADMIN USER
-- =====================================================
-- Note: This should be created via Supabase Auth UI or API
-- Email: teodor.chupetlov@abv.bg
-- Password: admin123
-- After creating in Supabase Auth, update the profile:
-- UPDATE profiles SET role = 'admin', username = 'admin' WHERE email = 'teodor.chupetlov@abv.bg';

-- =====================================================
-- END OF SEED DATA
-- =====================================================
