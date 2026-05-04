import { pgTable, text, serial, timestamp, real, boolean, integer } from "drizzle-orm/pg-core";

export const couponsTable = pgTable("coupons", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  discountPercent: real("discount_percent").notNull(),
  active: boolean("active").notNull().default(true),
  usageLimit: integer("usage_limit"),
  usageCount: integer("usage_count").notNull().default(0),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Coupon = typeof couponsTable.$inferSelect;
