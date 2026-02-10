-- Webhook trigger for notifying company when verification status changes
-- Run this in Supabase SQL Editor after deploying the edge function

-- First, enable the http extension if not already enabled
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- Create webhook function for company verification notification
CREATE OR REPLACE FUNCTION public.notify_company_on_verification()
RETURNS trigger AS $$
DECLARE
  webhook_url text := 'https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/notify-company-verification';
  service_role_key text := '<YOUR_SERVICE_ROLE_KEY>';
BEGIN
  -- Only trigger if is_verified changed
  IF OLD.is_verified IS DISTINCT FROM NEW.is_verified THEN
    PERFORM
      net.http_post(
        url := webhook_url,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || service_role_key
        ),
        body := jsonb_build_object(
          'type', 'UPDATE',
          'table', 'companies',
          'record', row_to_json(NEW),
          'old_record', row_to_json(OLD)
        )
      );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on companies table
DROP TRIGGER IF EXISTS on_company_verification_change ON public.companies;
CREATE TRIGGER on_company_verification_change
  AFTER UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_company_on_verification();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.notify_company_on_verification() TO service_role;
