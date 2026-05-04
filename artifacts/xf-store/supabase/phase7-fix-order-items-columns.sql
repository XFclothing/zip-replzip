-- Add missing columns to order_items table
alter table order_items
  add column if not exists name text,
  add column if not exists size text,
  add column if not exists quantity integer not null default 1;

-- Refresh schema cache
notify pgrst, 'reload schema';
