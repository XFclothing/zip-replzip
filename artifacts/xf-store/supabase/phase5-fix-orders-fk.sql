-- ============================================================
-- XF STORE — PHASE 5: Fix orders FK (auth.users statt profiles)
-- Run this in Supabase → SQL Editor
-- ============================================================

-- Drop the old FK that references profiles(id)
alter table orders drop constraint if exists orders_user_id_fkey;

-- Re-add FK referencing auth.users directly (always exists when logged in)
alter table orders
  add constraint orders_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete set null;
