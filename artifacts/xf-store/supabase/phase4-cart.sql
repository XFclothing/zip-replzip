-- ============================================================
-- XF STORE — PHASE 4: Persistent Cart
-- Run this in Supabase → SQL Editor
-- ============================================================

drop table if exists cart_items cascade;

create table cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  product_id text not null,
  name text not null,
  price numeric not null,
  size text not null,
  image text,
  quantity integer not null default 1,
  created_at timestamp default now()
);

create unique index cart_items_user_product_size
  on cart_items(user_id, product_id, size);

alter table cart_items enable row level security;

create policy "Users read own cart"
  on cart_items for select using (auth.uid() = user_id);

create policy "Users insert own cart"
  on cart_items for insert with check (auth.uid() = user_id);

create policy "Users update own cart"
  on cart_items for update using (auth.uid() = user_id);

create policy "Users delete own cart"
  on cart_items for delete using (auth.uid() = user_id);
