-- ============================================================
-- PHASE 8 — Order Cancellation Support
-- Run in Supabase → SQL Editor
-- ============================================================

alter table orders
  add column if not exists cancellation_reason text;
