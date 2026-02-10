-- Add is_demo field to jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false;

-- Mark all existing demo jobs as is_demo = true (if any exist)
-- Demo jobs are created for testing purposes
UPDATE jobs SET is_demo = true WHERE consumer_id IN (
  SELECT id FROM profiles WHERE email LIKE '%demo%'
);

-- Mark real user jobs (like stevenak's jobs) as is_demo = false
UPDATE jobs SET is_demo = false WHERE consumer_id IN (
  SELECT id FROM profiles WHERE email NOT LIKE '%demo%'
);

-- Verify the changes
SELECT j.id, j.title, j.is_demo, p.email as consumer_email 
FROM jobs j 
LEFT JOIN profiles p ON j.consumer_id = p.id
ORDER BY j.created_at DESC;
