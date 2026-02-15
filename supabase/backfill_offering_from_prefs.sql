-- Backfill `offering_role` and `seeking_role` from `matching_preferences` JSONB
-- Sets top-level columns when they are NULL using values from matching_preferences.

-- Backfill offering_role from matching_preferences.offering_role or preferred_roles[0]
UPDATE public.profiles
SET offering_role = lower(trim(COALESCE(
  matching_preferences->> 'offering_role',
  (CASE WHEN jsonb_typeof(matching_preferences->'preferred_roles') = 'array' THEN (matching_preferences->'preferred_roles'->>0) ELSE NULL END)
)))
WHERE offering_role IS NULL
  AND (
    matching_preferences->> 'offering_role' IS NOT NULL
    OR (jsonb_typeof(matching_preferences->'preferred_roles') = 'array' AND jsonb_array_length(matching_preferences->'preferred_roles') > 0)
  );

-- Backfill seeking_role from matching_preferences
UPDATE public.profiles
SET seeking_role = lower(trim(matching_preferences->> 'seeking_role'))
WHERE seeking_role IS NULL
  AND matching_preferences->> 'seeking_role' IS NOT NULL;

-- Optionally also keep `role` column in sync (if you use it)
UPDATE public.profiles
SET role = offering_role
WHERE role IS NULL AND offering_role IS NOT NULL;

-- Verify results (run these SELECTs manually to inspect before/after)
-- SELECT id, offering_role, seeking_role, matching_preferences FROM public.profiles ORDER BY created_at DESC LIMIT 50;
