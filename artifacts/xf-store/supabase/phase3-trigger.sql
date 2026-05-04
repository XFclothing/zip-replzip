-- ============================================================
-- XF STORE — PHASE 3: Auto-create profile on signup
-- Run this in Supabase → SQL Editor
-- ============================================================

-- Trigger function: auto-creates a profile row whenever
-- a new user signs up (including OTP / magic link)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, shipping_address)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1), ''),
    new.email,
    null
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Drop existing trigger if it exists, then recreate
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
