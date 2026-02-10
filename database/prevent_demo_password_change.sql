-- =====================================================
-- PREVENT DEMO ACCOUNT PASSWORD CHANGES
-- =====================================================
-- This script prevents password changes for demo accounts
-- by creating a database trigger that blocks auth.users updates

-- Step 1: Create function to check if email is a demo account
CREATE OR REPLACE FUNCTION is_demo_account(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN LOWER(user_email) IN ('demo@remont.co', 'company-demo@remont.co');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Create trigger function to prevent password changes
CREATE OR REPLACE FUNCTION prevent_demo_password_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this is a demo account
  IF is_demo_account(NEW.email) THEN
    -- Check if password is being changed (encrypted_password field)
    IF NEW.encrypted_password IS DISTINCT FROM OLD.encrypted_password THEN
      RAISE EXCEPTION 'Password changes are not allowed for demo accounts: %', NEW.email
        USING HINT = 'Demo accounts have fixed passwords for security reasons';
    END IF;
    
    -- Also prevent email changes for demo accounts
    IF NEW.email IS DISTINCT FROM OLD.email THEN
      RAISE EXCEPTION 'Email changes are not allowed for demo accounts: %', OLD.email
        USING HINT = 'Demo account emails cannot be modified';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Drop existing trigger if it exists
DROP TRIGGER IF EXISTS prevent_demo_password_change_trigger ON auth.users;

-- Step 4: Create trigger on auth.users table
CREATE TRIGGER prevent_demo_password_change_trigger
  BEFORE UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION prevent_demo_password_change();

-- Step 5: Test the protection (optional - comment out in production)
-- This will fail with an error message:
-- UPDATE auth.users SET encrypted_password = 'test' WHERE email = 'demo@remont.co';

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Check if trigger is active
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'prevent_demo_password_change_trigger';

-- =====================================================
-- NOTES
-- =====================================================
-- 1. This trigger runs BEFORE any password update on auth.users
-- 2. It checks if the email is a demo account
-- 3. If yes, it blocks the password change and raises an exception
-- 4. The exception will be shown to the user in the UI
-- 5. This works for both direct database updates and Supabase Auth API calls
