import { Router } from "express";
import Stripe from "stripe";
import { db, ordersTable } from "@workspace/db";

const router = Router();

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key, { apiVersion: "2025-04-30.basil" });
}

// POST /api/stripe/payment-intent — create PaymentIntent for embedded payment
router.post("/stripe/payment-intent", async (req, res): Promise<void> => {
  try {
    const stripe = getStripe();
    const { items, shippingAddress, email, customerName, userId } = req.body;

    if (!items || items.length === 0) {
      res.status(400).json({ error: "Cart is empty" });
      return;
    }

    const totalAmount = items.reduce(
      (sum: number, item: any) => sum + Math.round(item.price * 100) * item.quantity,
      0
    );

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: "eur",
      automatic_payment_methods: { enabled: true },
      receipt_email: email || undefined,
      metadata: {
        shippingAddress: shippingAddress || "",
        customerName: customerName || "",
        userId: userId || "",
        itemsSummary: items.map((i: any) => `${i.name} x${i.quantity}`).join(", "),
      },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err: any) {
    console.error("Stripe payment-intent error:", err);
    res.status(500).json({ error: err.message || "Failed to create payment intent" });
  }
});

// POST /api/stripe/confirm-order — save order after successful payment
router.post("/stripe/confirm-order", async (req, res): Promise<void> => {
  try {
    const stripe = getStripe();
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      res.status(400).json({ error: "Missing paymentIntentId" });
      return;
    }

    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (intent.status !== "succeeded") {
      res.status(402).json({ error: "Payment not completed" });
      return;
    }

    const meta = intent.metadata || {};
    let items: any[] = [];
    try {
      items = JSON.parse(meta.items || "[]");
    } catch {
      items = [];
    }

    const [order] = await db.insert(ordersTable).values({
      userId: meta.userId || null,
      customerName: meta.customerName || "",
      email: typeof intent.receipt_email === "string" ? intent.receipt_email : "",
      shippingAddress: meta.shippingAddress || "",
      items,
      totalPrice: intent.amount / 100,
      status: "paid",
    }).returning();

    res.json({ order: { ...order, createdAt: order.createdAt.toISOString() } });
  } catch (err: any) {
    console.error("Stripe confirm-order error:", err);
    res.status(500).json({ error: err.message || "Failed to confirm order" });
  }
});

export default router;
