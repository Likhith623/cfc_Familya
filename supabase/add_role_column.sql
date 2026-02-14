-- ============================================================
-- ADD ROLE COLUMN TO PROFILES TABLE
-- Run this in Supabase SQL Editor
-- ============================================================

-- Add the offering_role column to profiles (what role the user wants to BE)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS offering_role VARCHAR(30) DEFAULT NULL;

-- Add the seeking_role column to profiles (what role they're looking for)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS seeking_role VARCHAR(30) DEFAULT NULL;

-- Create an index for fast role-based searches
CREATE INDEX IF NOT EXISTS idx_profiles_offering_role ON profiles(offering_role);
CREATE INDEX IF NOT EXISTS idx_profiles_seeking_role ON profiles(seeking_role);

-- Update existing users based on their matching_preferences if available
UPDATE profiles 
SET offering_role = matching_preferences->>'offering_role'
WHERE matching_preferences->>'offering_role' IS NOT NULL 
  AND offering_role IS NULL;

-- Verify the changes
SELECT id, display_name, offering_role, seeking_role 
FROM profiles 
WHERE offering_role IS NOT NULL
LIMIT 10;
