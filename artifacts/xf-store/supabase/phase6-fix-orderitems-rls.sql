-- ============================================================
-- XF STORE — PHASE 6: Fix order_items RLS policy
-- Run this in Supabase → SQL Editor
-- ============================================================

-- The old policy does a subquery on orders which itself has RLS,
-- causing it to fail. We use a security definer function to bypass this.

create or replace function public.user_owns_order(order_uuid uuid)
returns boolean as $$
  select exists(
    select 1 from orders where id = order_uuid and user_id = auth.uid()
  )
$$ language sql security definer stable;

drop policy if exists "Users insert own order items" on order_items;

create policy "Users insert own order items"
  on order_items for insert with check (
    public.user_owns_order(order_id)
  );
