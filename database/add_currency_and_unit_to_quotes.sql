-- Add currency and unit columns to quotes table
-- This migration adds support for storing currency (EUR, BGN, etc.) and unit of measurement (кв.м., л.м., etc.)

-- Add currency column with default value 'EUR'
ALTER TABLE quotes 
ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'EUR';

-- Add unit column for measurement units (кв.м., л.м., кг., тон, час, or NULL for "Общо")
ALTER TABLE quotes 
ADD COLUMN IF NOT EXISTS unit VARCHAR(20);

-- Add comment to explain the columns
COMMENT ON COLUMN quotes.currency IS 'Currency code (EUR, BGN, USD, etc.)';
COMMENT ON COLUMN quotes.unit IS 'Unit of measurement: кв.м., л.м., кг., тон, час, or NULL for total price';

-- Update existing rows to have EUR as currency (for backwards compatibility)
UPDATE quotes 
SET currency = 'EUR' 
WHERE currency IS NULL;
