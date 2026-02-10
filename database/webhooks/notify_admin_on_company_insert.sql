-- Webhook to notify admin when a new company is registered
-- This webhook calls the notify-admin Edge Function

-- First, create the extension if not exists
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create function to call the Edge Function
CREATE OR REPLACE FUNCTION notify_admin_new_company()
RETURNS TRIGGER AS $$
DECLARE
  edge_function_url TEXT := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/notify-admin';
  service_role_key TEXT := 'YOUR_SERVICE_ROLE_KEY';
BEGIN
  -- Call the Edge Function asynchronously
  PERFORM net.http_post(
    url := edge_function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key
    ),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'companies',
      'record', jsonb_build_object(
        'id', NEW.id,
        'name', NEW.name,
        'email', NEW.email,
        'eik', NEW.eik,
        'city', NEW.city,
        'verification_status', NEW.verification_status,
        'created_at', NEW.created_at
      )
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_company_inserted ON companies;
CREATE TRIGGER on_company_inserted
  AFTER INSERT ON companies
  FOR EACH ROW
  EXECUTE FUNCTION notify_admin_new_company();

-- ВАЖНО: Заместете 'YOUR_PROJECT_REF' с вашия Supabase project reference
-- и 'YOUR_SERVICE_ROLE_KEY' с вашия service role key от Settings -> API
