-- ============================================================
-- XF STORE — PHASE 1 SETUP (No RLS, development-ready)
-- Run this in Supabase → SQL Editor
-- ============================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------
-- PROFILES (extends Supabase Auth users)
-- ----------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text unique,
  shipping_address text,
  created_at timestamp default now()
);

-- ----------------------------------------------------------
-- ADMINS (workers managed by the founder)
-- ----------------------------------------------------------
create table if not exists admins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name text,
  email text unique,
  role text default 'worker',
  permissions jsonb default '{"view_orders":true,"manage_orders":false,"manage_tickets":false}'::jsonb,
  created_at timestamp default now()
);

-- ----------------------------------------------------------
-- PRODUCTS
-- ----------------------------------------------------------
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text,
  price numeric,
  category text,
  description text,
  image_url text,
  stock integer default 0
);

-- ----------------------------------------------------------
-- ORDERS
-- ----------------------------------------------------------
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete set null,
  total_price numeric,
  status text default 'pending',
  shipping_address text,
  created_at timestamp default now()
);

-- ----------------------------------------------------------
-- ORDER ITEMS (includes name + size for display in panels)
-- ----------------------------------------------------------
create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  name text,
  price numeric,
  size text,
  quantity integer
);

-- ----------------------------------------------------------
-- SUPPORT TICKETS
-- ----------------------------------------------------------
create table if not exists tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete set null,
  subject text,
  message text,
  status text default 'open',
  created_at timestamp default now()
);

-- ----------------------------------------------------------
-- TICKET MESSAGES
-- ----------------------------------------------------------
create table if not exists ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid references tickets(id) on delete cascade,
  sender_role text,
  message text,
  created_at timestamp default now()
);

-- ----------------------------------------------------------
-- SHIPPING ADDRESSES (multiple per user)
-- ----------------------------------------------------------
create table if not exists shipping_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  label text,
  address text not null,
  is_default boolean default false,
  created_at timestamp default now()
);

-- ----------------------------------------------------------
-- DISABLE RLS on all tables (Phase 1 — development)
-- ----------------------------------------------------------
alter table profiles disable row level security;
alter table admins disable row level security;
alter table products disable row level security;
alter table orders disable row level security;
alter table order_items disable row level security;
alter table tickets disable row level security;
alter table ticket_messages disable row level security;
