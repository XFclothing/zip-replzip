import { pgTable, text, serial, timestamp, real, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  size: string;
  quantity: number;
}

export interface ShippingAddress {
  street: string;
  city: string;
  zip: string;
  country: string;
}

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: text("user_id"),
  customerName: text("customer_name").notNull(),
  email: text("email").notNull(),
  shippingAddress: json("shipping_address").$type<ShippingAddress>().notNull(),
  items: json("items").$type<OrderItem[]>().notNull(),
  totalPrice: real("total_price").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({ id: true, createdAt: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;
