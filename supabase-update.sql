-- XF Store – Database Update (Run in Supabase SQL Editor)
-- https://supabase.com/dashboard/project/rkcnbiqyhqnmwysqydxc/sql/new

-- ============================================================
-- If running for the FIRST TIME, run supabase-setup.sql first
-- then run this file. If tables already exist, start here.
-- ============================================================

-- 1. Add permissions column to admins table
ALTER TABLE admins ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{"view_orders": true, "manage_orders": false, "manage_tickets": false}'::jsonb;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Support Tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'answered', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Ticket Messages table
CREATE TABLE IF NOT EXISTS ticket_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE NOT NULL,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('user', 'worker')),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disable RLS on new tables
ALTER TABLE tickets DISABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- FULL SETUP (run this if starting fresh — replaces both files)
-- ============================================================

-- profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  shipping_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- products
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('hoodie', 'tshirt', 'jogger')),
  description TEXT,
  image_url TEXT,
  stock INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- orders
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  total_price NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'completed')),
  shipping_address TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- order_items
CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_id TEXT NOT NULL,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  size TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- admins (workers)
CREATE TABLE IF NOT EXISTS admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'worker',
  permissions JSONB DEFAULT '{"view_orders": true, "manage_orders": false, "manage_tickets": false}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disable RLS on all tables
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE admins DISABLE ROW LEVEL SECURITY;
ALTER TABLE tickets DISABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- ROLE SYSTEM:
--   FOUNDER emails (hardcoded): xfclothing@gmail.com, xaviermalucha@gmail.com
--   WORKER: any email in the admins table
--   USER: everyone else
--
-- TO ADD A WORKER (via Founder Panel UI, or manually):
--   INSERT INTO admins (name, email, role, permissions)
--   VALUES ('Worker Name', 'worker@email.com', 'worker',
--     '{"view_orders":true,"manage_orders":true,"manage_tickets":true}');
-- ============================================================
