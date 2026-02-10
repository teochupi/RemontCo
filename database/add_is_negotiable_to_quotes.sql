-- Add is_negotiable field to quotes table
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS is_negotiable BOOLEAN DEFAULT false;

-- Allow null prices for negotiable offers
ALTER TABLE quotes ALTER COLUMN price DROP NOT NULL;
