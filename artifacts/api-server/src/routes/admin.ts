import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, ordersTable } from "@workspace/db";
import { AdminUpdateOrderStatusBody, AdminUpdateOrderStatusParams } from "@workspace/api-zod";

const router = Router();

function requireAdmin(req: any, res: any, next: any) {
  if (!req.session.userId || req.session.userRole !== "admin") {
    res.status(req.session.userId ? 403 : 401).json({ error: req.session.userId ? "Forbidden" : "Not authenticated" });
    return;
  }
  next();
}

router.get("/admin/orders", requireAdmin, async (req, res): Promise<void> => {
  const orders = await db
    .select()
    .from(ordersTable)
    .orderBy(ordersTable.createdAt);

  res.json(
    orders.map((o) => ({
      ...o,
      createdAt: o.createdAt.toISOString(),
    })),
  );
});

router.patch("/admin/orders/:id/status", requireAdmin, async (req, res): Promise<void> => {
  const params = AdminUpdateOrderStatusParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = AdminUpdateOrderStatusBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const validStatuses = ["pending", "processing", "shipped", "completed"];
  if (!validStatuses.includes(body.data.status)) {
    res.status(400).json({ error: "Invalid status. Must be one of: " + validStatuses.join(", ") });
    return;
  }

  const [order] = await db
    .update(ordersTable)
    .set({ status: body.data.status })
    .where(eq(ordersTable.id, params.data.id))
    .returning();

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  res.json({
    ...order,
    createdAt: order.createdAt.toISOString(),
  });
});

export default router;
