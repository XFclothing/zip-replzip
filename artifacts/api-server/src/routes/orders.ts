import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, ordersTable } from "@workspace/db";
import { CreateOrderBody } from "@workspace/api-zod";

const router = Router();

router.get("/orders", async (req, res): Promise<void> => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const orders = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.userId, req.session.userId))
    .orderBy(ordersTable.createdAt);

  res.json(
    orders.map((o) => ({
      ...o,
      createdAt: o.createdAt.toISOString(),
    })),
  );
});

router.post("/orders", async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { customerName, email, shippingAddress, items } = parsed.data;

  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const [order] = await db
    .insert(ordersTable)
    .values({
      userId: req.session.userId ?? null,
      customerName,
      email,
      shippingAddress,
      items,
      totalPrice,
      status: "pending",
    })
    .returning();

  res.status(201).json({
    ...order,
    createdAt: order.createdAt.toISOString(),
  });
});

export default router;
