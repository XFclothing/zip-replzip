# XF Store – Workspace

## Overview

pnpm workspace monorepo using TypeScript. XF streetwear e-commerce site connected to Supabase.
Full role system: USER / WORKER / FOUNDER. Support ticket system included.

## Stack

- **Monorepo**: pnpm workspaces
- **Frontend**: React + Vite + Wouter (artifacts/xf-store)
- **Backend/Auth/DB**: Supabase JS client (direct from frontend, no separate backend needed)
- **Styling**: Tailwind CSS + shadcn/ui
- **Animations**: Framer Motion

## Environment Variables

- `VITE_SUPABASE_URL` — https://rkcnbiqyhqnmwysqydxc.supabase.co
- `VITE_SUPABASE_ANON_KEY` — Supabase anon/public key

## Role System

| Role | Detection | Access |
|------|-----------|--------|
| FOUNDER | Email matches xfclothing@gmail.com or xaviermalucha@gmail.com | /founder — full panel |
| WORKER | Email exists in `admins` table | /worker — orders + tickets |
| USER | Everyone else | /account, /support |

Nav dynamically shows "Founder" or "Staff" link based on role.

## Supabase Tables (run supabase-update.sql to create)

- `profiles` — user profile info (linked to auth.users)
- `products` — product catalog
- `orders` — customer orders
- `order_items` — line items per order
- `admins` — worker table with permissions JSONB
- `tickets` — support tickets
- `ticket_messages` — thread messages per ticket

RLS is disabled on all tables.

## Pages

- `/` — Homepage (countdown + email signup)
- `/shop` — Product catalog (hoodies, t-shirts, joggers)
- `/shop/:id` — Product detail + size selector
- `/about` — Brand story
- `/contact` — Contact form
- `/login` — Sign In / Sign Up (tabbed)
- `/account` — User profile + order history (auth required)
- `/checkout` — Order placement (auth required)
- `/support` — User support tickets: create, view, reply (auth required)
- `/worker` (also `/admin`) — Worker panel: orders + tickets + status management (worker/founder)
- `/founder` — Founder panel: manage workers, permissions, orders, tickets (founder only)

## Founder Panel Features

- Workers tab: list workers, add worker (name + email), remove worker, set permissions per worker
  - Permissions: view_orders / manage_orders / manage_tickets (checkboxes)
- Orders tab: all orders with status updates
- Tickets tab: all support tickets with reply capability

## Worker Panel Features

- Orders tab: all orders with status filter + status update dropdown
- Tickets tab: all tickets, open thread, reply as staff, update ticket status

## Support (User) Features

- Create new ticket (subject + message)
- View all own tickets with status
- Click ticket to view full thread + send follow-up
- Ticket status: open / answered / closed

## Key Files

- `artifacts/xf-store/src/lib/supabase.ts` — Supabase client + all types
- `artifacts/xf-store/src/context/AuthContext.tsx` — Auth + role detection
- `artifacts/xf-store/src/context/CartContext.tsx` — Full cart state
- `artifacts/xf-store/src/components/Cart.tsx` — Sliding cart sidebar
- `artifacts/xf-store/src/pages/Founder.tsx` — Founder panel
- `artifacts/xf-store/src/pages/Worker.tsx` — Worker panel
- `artifacts/xf-store/src/pages/Support.tsx` — User support tickets
- `supabase-update.sql` — Full database migration (run once in Supabase SQL Editor)

## Admin Setup

Founders are hardcoded by email — no DB entry needed.
To add a worker via Founder Panel → Workers tab → Add Worker.
Or manually via SQL:
```sql
INSERT INTO admins (name, email, role, permissions)
VALUES ('Name', 'worker@email.com', 'worker',
  '{"view_orders":true,"manage_orders":true,"manage_tickets":true}');
```
