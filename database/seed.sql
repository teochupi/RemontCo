-- RemontCo Seed Data
-- Paste this into your Supabase SQL Editor to populate the database

-- 1. Create Service Categories
INSERT INTO public.service_categories (name_bg, name_en, slug, icon) VALUES
('Покриви и хидроизолация', 'Roofing & Waterproofing', 'roofing', 'bi-house-up'),
('Електро услуги', 'Electrical Services', 'electrical', 'bi-lightning-charge'),
('ВиК услуги', 'Plumbing', 'plumbing', 'bi-droplet'),
('Външна топлоизолация', 'External Insulation', 'insulation', 'bi-snow'),
('Гипсокартон и боядисване', 'Drywall & Painting', 'painting', 'bi-palette'),
('Подови настилки', 'Flooring', 'flooring', 'bi-grid-3x3'),
('Климатизация и отопление', 'HVAC', 'hvac', 'bi-thermometer-half'),
('Кърти, чисти, извозва', 'Demolition & Cleaning', 'demolition', 'bi-trash3')
ON CONFLICT (slug) DO NOTHING;

-- 2. Create some Verified Companies (Dummy Data)
-- Note: Replace owner_id with a real UUID from auth.users if you want them linked to real users
-- For demo purposes, we can insert them with a placeholder or just without owner_id if we modify the schema (but schema requires owner_id)
-- I'll assume you will create one user and use their ID, or I'll just provide the template.

-- 3. Random Jobs for the Demo User to see
-- Since jobs require consumer_id (profiles.id), we need at least one profile.

-- INSTRUCTIONS FOR USERS:
/*
  Здравейте! За да настроите администраторския и демо акаунтите:
  
  1. Отидете в Supabase Dashboard -> Authentication.
  2. Създайте ръчно (Add user) двата акаунта:
     - Admin: teoch@remont.co (или друг имейл) с парола 0898208867
     - Demo: demo@remont.co с парола demo123 (или просто demo/demo123 ако ползвате username, но Supabase предпочита имейли)
  3. След като ги създадете, изпълнете следния SQL, за да им дадете правилните роли:

  UPDATE public.profiles 
  SET role = 'admin', first_name = 'Teodor', last_name = 'Chupetlov'
  WHERE email = 'teoch@remont.co';

  UPDATE public.profiles 
  SET role = 'demo'
  WHERE email = 'demo@remont.co';
*/

-- 4. Sample Companies for the Demo
-- Use a subquery to get a valid profile ID if any exists
DO $$
DECLARE
    v_admin_id UUID;
BEGIN
    SELECT id INTO v_admin_id FROM public.profiles LIMIT 1;
    
    IF v_admin_id IS NOT NULL THEN
        INSERT INTO public.companies (owner_id, name, eik, description, city, phone, email, is_verified, status)
        VALUES 
        (v_admin_id, 'Строител Плюс ЕООД', '123456789', 'Професионално строителство и ремонти.', 'София', '0888111222', 'office@stroitelplus.bg', true, 'approved'),
        (v_admin_id, 'Електро Мастер ООД', '987654321', 'Всичко за вашата ел. инсталация.', 'Пловдив', '0888333444', 'contact@electromaster.bg', true, 'approved'),
        (v_admin_id, 'ВиК Експерт', '112233445', 'Бързи и качествени ВиК услуги.', 'Варна', '0888555666', 'service@plumbexpert.bg', true, 'approved'),
        (v_admin_id, 'Лукс Ремонт', '556677889', 'Модерни решения за вашия дом.', 'Бургас', '0888777888', 'info@luxremont.bg', true, 'approved'),
        (v_admin_id, 'Изо Терм Груп', '998877665', 'Качествена изолация за вашия блок.', 'Стара Загора', '0888999000', 'sales@izoterm.bg', true, 'approved')
        ON CONFLICT (eik) DO NOTHING;

        -- 5. Sample Jobs for the Demo
        INSERT INTO public.jobs (consumer_id, category_id, title, description, city, budget_max, status)
        SELECT 
            v_admin_id, 
            id, 
            'Ремонт на баня', 
            'Търся фирма за цялостен ремонт на баня 5кв.м. Лепене на плочки и смяна на тръби.', 
            'София', 
            3500, 
            'approved'
        FROM public.service_categories WHERE slug = 'plumbing' LIMIT 1;

        INSERT INTO public.jobs (consumer_id, category_id, title, description, city, budget_max, status)
        SELECT 
            v_admin_id, 
            id, 
            'Пренареждане на керемиди', 
            'Покривът тече на две места. Нужен е оглед и ремонт.', 
            'Пловдив', 
            1200, 
            'approved'
        FROM public.service_categories WHERE slug = 'roofing' LIMIT 1;

        INSERT INTO public.jobs (consumer_id, category_id, title, description, city, budget_max, status)
        SELECT 
            v_admin_id, 
            id, 
            'Боядисване на апартамент', 
            'Двустаен апартамент в кв. Младост. Боядисване с бял латекс.', 
            'София', 
            800, 
            'approved'
        FROM public.service_categories WHERE slug = 'painting' LIMIT 1;
    END IF;
END $$;
