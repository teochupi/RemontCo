-- Таблица с потребителски профили
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  role TEXT CHECK (role IN ('consumer', 'company_admin', 'admin')) DEFAULT 'consumer',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Таблица за фирми (Само за потребители с роля company_admin)
CREATE TABLE companies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  uic TEXT UNIQUE NOT NULL, -- ЕИК/БУЛСТАТ
  address TEXT,
  city TEXT,
  phone TEXT,
  email TEXT,
  is_verified BOOLEAN DEFAULT false, -- Верификация от администратор
  description TEXT,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Категории услуги
CREATE TABLE categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  parent_id UUID REFERENCES categories(id),
  name_bg TEXT NOT NULL,
  name_en TEXT NOT NULL,
  icon TEXT
);

-- Услуги, предлагани от фирмите
CREATE TABLE company_services (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  price_range TEXT,
  description TEXT
);

-- Политики за сигурност (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Всеки може да разглежда профили и фирми
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Public companies are viewable by everyone" ON companies FOR SELECT USING (true);

-- Само собственикът може да редактира своята фирма
CREATE POLICY "Users can edit own company" ON companies 
  FOR UPDATE USING (auth.uid() = owner_id);
