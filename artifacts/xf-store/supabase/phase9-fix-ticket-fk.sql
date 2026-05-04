-- ============================================================
-- XF STORE — PHASE 9: Fix missing profiles for existing users
-- Run this in Supabase → SQL Editor
-- ============================================================

-- Backfill any auth.users who don't yet have a profiles row
insert into public.profiles (id, name, email, shipping_address)
select
  u.id,
  coalesce(u.raw_user_meta_data->>'name', split_part(u.email, '@', 1), ''),
  u.email,
  null
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;
