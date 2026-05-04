-- ============================================================
-- XF STORE — PHASE 10: Permanent fix for ticket FK constraint
-- Run this in Supabase → SQL Editor
-- This changes tickets.user_id to reference auth.users directly
-- so tickets work for any logged-in user regardless of profile.
-- ============================================================

-- 1. Backfill missing profiles for all existing users
INSERT INTO public.profiles (id, name, email, shipping_address)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'name', SPLIT_PART(u.email, '@', 1), ''),
  u.email,
  NULL
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 2. Drop the old FK on tickets (references profiles)
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_user_id_fkey;

-- 3. Re-add FK referencing auth.users directly (more robust)
ALTER TABLE tickets
  ADD CONSTRAINT tickets_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
