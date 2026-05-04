import { Router } from "express";
import { db, couponsTable, ordersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router = Router();

// POST /api/coupons/validate
router.post("/coupons/validate", async (req, res): Promise<void> => {
  try {
    const { code } = req.body;

    if (!code) {
      res.status(400).json({ error: "Coupon code is required" });
      return;
    }

    const [coupon] = await db
      .select()
      .from(couponsTable)
      .where(eq(couponsTable.code, code.toUpperCase().trim()));

    if (!coupon) {
      res.status(404).json({ error: "Invalid coupon code" });
      return;
    }

    if (!coupon.active) {
      res.status(400).json({ error: "This coupon is no longer active" });
      return;
    }

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      res.status(400).json({ error: "This coupon has expired" });
      return;
    }

    if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
      res.status(400).json({ error: "This coupon has reached its usage limit" });
      return;
    }

    res.json({
      valid: true,
      code: coupon.code,
      discountPercent: coupon.discountPercent,
    });
  } catch (err: any) {
    console.error("Coupon validate error:", err);
    res.status(500).json({ error: "Failed to validate coupon" });
  }
});

// POST /api/orders/place — place order without payment
router.post("/orders/place", async (req, res): Promise<void> => {
  try {
    const { items, shippingAddress, email, customerName, userId, couponCode, totalPrice } = req.body;

    if (!items || items.length === 0) {
      res.status(400).json({ error: "Cart is empty" });
      return;
    }

    if (!shippingAddress) {
      res.status(400).json({ error: "Shipping address is required" });
      return;
    }

    // Increment coupon usage if a coupon was applied
    if (couponCode) {
      await db
        .update(couponsTable)
        .set({ usageCount: sql`${couponsTable.usageCount} + 1` })
        .where(eq(couponsTable.code, couponCode.toUpperCase().trim()));
    }

    const [order] = await db
      .insert(ordersTable)
      .values({
        userId: userId || null,
        customerName: customerName || "",
        email: email || "",
        shippingAddress,
        items,
        totalPrice,
        status: "pending",
      })
      .returning();

    res.json({ order: { ...order, createdAt: order.createdAt.toISOString() } });
  } catch (err: any) {
    console.error("Place order error:", err);
    res.status(500).json({ error: err.message || "Failed to place order" });
  }
});

export default router;
