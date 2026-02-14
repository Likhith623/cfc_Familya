-- Add a dedicated 'role' column to profiles table for easier Browse by Role queries
-- This stores the user's primary offering role directly on the profile

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role character varying;

-- Create an index on the role column for fast Browse by Role queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles (role);

-- Backfill existing role data from matching_preferences JSONB
UPDATE public.profiles
SET role = (matching_preferences->>'offering_role')
WHERE matching_preferences->>'offering_role' IS NOT NULL
  AND role IS NULL;

-- Also add a 'seeking_role' column for what users are looking for
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS seeking_role character varying;

-- Backfill seeking_role from matching_preferences
UPDATE public.profiles
SET seeking_role = (matching_preferences->>'seeking_role')
WHERE matching_preferences->>'seeking_role' IS NOT NULL
  AND seeking_role IS NULL;

-- Create index for seeking_role
CREATE INDEX IF NOT EXISTS idx_profiles_seeking_role ON public.profiles (seeking_role);
