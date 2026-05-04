import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  name: string;
  email: string;
  shipping_address: string | null;
  created_at: string;
};

export type Product = {
  id: string;
  name: string;
  price: number;
  category: "hoodie" | "tshirt" | "jogger";
  description: string;
  image_url: string;
  stock: number;
};

export type Order = {
  id: string;
  user_id: string;
  total_price: number;
  status: "pending" | "processing" | "shipped" | "completed" | "cancelled";
  shipping_address: string;
  created_at: string;
  cancellation_reason?: string | null;
  order_items?: OrderItem[];
  profiles?: Profile;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  name: string;
  price: number;
  size: string;
  quantity: number;
};

export type Admin = {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  role: string;
  permissions: {
    view_orders: boolean;
    manage_orders: boolean;
    manage_tickets: boolean;
  };
};

export type Ticket = {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  status: "open" | "answered" | "closed";
  created_at: string;
  profiles?: Profile;
  ticket_messages?: TicketMessage[];
};

export type TicketMessage = {
  id: string;
  ticket_id: string;
  sender_role: "user" | "worker";
  message: string;
  created_at: string;
};
