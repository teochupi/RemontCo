-- Trigger to automatically create a company record when a user registers as a company
-- Run this in Supabase SQL Editor

-- Function that creates company from user metadata
CREATE OR REPLACE FUNCTION create_company_on_register()
RETURNS TRIGGER AS $$
DECLARE
  user_meta JSONB;
  company_name TEXT;
  company_eik TEXT;
  company_city TEXT;
  company_phone TEXT;
  company_address TEXT;
  company_description TEXT;
  company_website TEXT;
BEGIN
  -- Get user metadata from auth.users
  SELECT raw_user_meta_data INTO user_meta
  FROM auth.users
  WHERE id = NEW.id;

  -- Only proceed if user has role 'company'
  IF NEW.role = 'company' THEN
    -- Extract company data from metadata (stored during registration)
    company_name := user_meta->>'company_name';
    company_eik := user_meta->>'company_eik';
    company_city := user_meta->>'company_city';
    company_phone := user_meta->>'company_phone';
    company_address := user_meta->>'company_address';
    company_description := user_meta->>'company_description';
    company_website := user_meta->>'company_website';

    -- Only create if we have at least the company name
    IF company_name IS NOT NULL AND company_name != '' THEN
      INSERT INTO public.companies (
        owner_id,
        name,
        eik,
        city,
        phone,
        address,
        description,
        website,
        email,
        is_verified,
        status
      ) VALUES (
        NEW.id,
        company_name,
        COALESCE(company_eik, ''),
        company_city,
        company_phone,
        company_address,
        company_description,
        company_website,
        NEW.email,
        FALSE,
        'pending'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_profile_created_company ON public.profiles;

-- Create trigger
CREATE TRIGGER on_profile_created_company
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_company_on_register();
