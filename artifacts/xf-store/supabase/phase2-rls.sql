-- ============================================================
-- XF STORE — PHASE 2: Enable Row Level Security
-- Run this AFTER phase1-setup.sql when ready to go production
-- ============================================================

-- ----------------------------------------------------------
-- Helper functions (run as superuser / service role)
-- ----------------------------------------------------------

create or replace function is_founder()
returns boolean as $$
  select auth.email() in ('xfclothing@gmail.com', 'xaviermalucha@gmail.com')
$$ language sql stable security definer;

create or replace function is_worker()
returns boolean as $$
  select exists(
    select 1 from admins where lower(email) = lower(auth.email())
  )
$$ language sql stable security definer;

create or replace function is_staff()
returns boolean as $$
  select is_founder() or is_worker()
$$ language sql stable security definer;

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
-- ENABLE RLS
-- ----------------------------------------------------------
alter table profiles enable row level security;
alter table admins enable row level security;
alter table products enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table tickets enable row level security;
alter table ticket_messages enable row level security;
alter table shipping_addresses enable row level security;

-- ----------------------------------------------------------
-- PROFILES policies
-- ----------------------------------------------------------
create policy "Users read own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users update own profile"
  on profiles for update using (auth.uid() = id);

create policy "Users insert own profile"
  on profiles for insert with check (auth.uid() = id);

create policy "Staff read all profiles"
  on profiles for select using (is_staff());

-- ----------------------------------------------------------
-- ADMINS policies
-- ----------------------------------------------------------
create policy "Founders manage admins"
  on admins for all using (is_founder());

create policy "Workers read own admin record"
  on admins for select using (lower(email) = lower(auth.email()));

-- ----------------------------------------------------------
-- PRODUCTS policies (public read, founder write)
-- ----------------------------------------------------------
create policy "Anyone reads products"
  on products for select using (true);

create policy "Founders manage products"
  on products for all using (is_founder());

-- ----------------------------------------------------------
-- ORDERS policies
-- ----------------------------------------------------------
create policy "Users read own orders"
  on orders for select using (auth.uid() = user_id);

create policy "Users insert own orders"
  on orders for insert with check (auth.uid() = user_id);

create policy "Staff read all orders"
  on orders for select using (is_staff());

create policy "Staff update order status"
  on orders for update using (is_staff());

-- ----------------------------------------------------------
-- ORDER ITEMS policies
-- ----------------------------------------------------------
create policy "Users read own order items"
  on order_items for select using (
    exists (select 1 from orders where orders.id = order_items.order_id and orders.user_id = auth.uid())
  );

create policy "Users insert own order items"
  on order_items for insert with check (
    exists (select 1 from orders where orders.id = order_items.order_id and orders.user_id = auth.uid())
  );

create policy "Staff read all order items"
  on order_items for select using (is_staff());

-- ----------------------------------------------------------
-- TICKETS policies
-- ----------------------------------------------------------
create policy "Users read own tickets"
  on tickets for select using (auth.uid() = user_id);

create policy "Users insert own tickets"
  on tickets for insert with check (auth.uid() = user_id);

create policy "Users update own tickets"
  on tickets for update using (auth.uid() = user_id);

create policy "Staff read all tickets"
  on tickets for select using (is_staff());

create policy "Staff update all tickets"
  on tickets for update using (is_staff());

-- ----------------------------------------------------------
-- TICKET MESSAGES policies
-- ----------------------------------------------------------
create policy "Users read own ticket messages"
  on ticket_messages for select using (
    exists (select 1 from tickets where tickets.id = ticket_messages.ticket_id and tickets.user_id = auth.uid())
  );

create policy "Users insert own ticket messages"
  on ticket_messages for insert with check (
    exists (select 1 from tickets where tickets.id = ticket_messages.ticket_id and tickets.user_id = auth.uid())
  );

create policy "Staff read all ticket messages"
  on ticket_messages for select using (is_staff());

create policy "Staff insert ticket messages"
  on ticket_messages for insert with check (is_staff());

-- ----------------------------------------------------------
-- SHIPPING ADDRESSES policies
-- ----------------------------------------------------------
create policy "Users read own shipping addresses"
  on shipping_addresses for select using (auth.uid() = user_id);

create policy "Users insert own shipping addresses"
  on shipping_addresses for insert with check (auth.uid() = user_id);

create policy "Users update own shipping addresses"
  on shipping_addresses for update using (auth.uid() = user_id);

create policy "Users delete own shipping addresses"
  on shipping_addresses for delete using (auth.uid() = user_id);
