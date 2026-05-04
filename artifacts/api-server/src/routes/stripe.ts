import { Router } from "express";
import Stripe from "stripe";
import { db, ordersTable } from "@workspace/db";

const router = Router();

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key, { apiVersion: "2025-04-30.basil" });
}

// POST /api/stripe/checkout — create Stripe Checkout Session
router.post("/stripe/checkout", async (req, res): Promise<void> => {
  try {
    const stripe = getStripe();
    const { items, shippingAddress, email, customerName, userId } = req.body;

    if (!items || items.length === 0) {
      res.status(400).json({ error: "Cart is empty" });
      return;
    }

    const origin = req.headers.origin || `${req.protocol}://${req.headers.host}`;

    const lineItems = items.map((item: any) => ({
      price_data: {
        currency: "eur",
        product_data: {
          name: item.name,
          images: item.image ? [item.image] : [],
          metadata: { size: item.size || "" },
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card", "paypal", "klarna"],
      line_items: lineItems,
      mode: "payment",
      customer_email: email || undefined,
      success_url: `${origin}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout`,
      metadata: {
        shippingAddress: shippingAddress || "",
        customerName: customerName || "",
        userId: userId || "",
        itemsSummary: items.map((i: any) => `${i.name} x${i.quantity}`).join(", "),
        itemsJson: JSON.stringify(
          items.map((i: any) => ({
            name: i.name,
            price: i.price,
            quantity: i.quantity,
            size: i.size,
          }))
        ),
      },
    });

    res.json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe checkout error:", err);
    res.status(500).json({ error: err.message || "Failed to create checkout session" });
  }
});

// POST /api/stripe/verify — verify session and save order
router.post("/stripe/verify", async (req, res): Promise<void> => {
  try {
    const stripe = getStripe();
    const { sessionId } = req.body;

    if (!sessionId) {
      res.status(400).json({ error: "Missing sessionId" });
      return;
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      res.status(402).json({ error: "Payment not completed" });
      return;
    }

    const meta = session.metadata || {};
    let items: any[] = [];
    try {
      items = JSON.parse(meta.itemsJson || "[]");
    } catch {
      items = [];
    }

    const [order] = await db
      .insert(ordersTable)
      .values({
        userId: meta.userId || null,
        customerName: meta.customerName || "",
        email: typeof session.customer_email === "string" ? session.customer_email : "",
        shippingAddress: meta.shippingAddress || "",
        items,
        totalPrice: (session.amount_total || 0) / 100,
        status: "paid",
      })
      .returning();

    res.json({ order: { ...order, createdAt: order.createdAt.toISOString() } });
  } catch (err: any) {
    console.error("Stripe verify error:", err);
    res.status(500).json({ error: err.message || "Failed to verify session" });
  }
});

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

    const [order] = await db
      .insert(ordersTable)
      .values({
        userId: meta.userId || null,
        customerName: meta.customerName || "",
        email: typeof intent.receipt_email === "string" ? intent.receipt_email : "",
        shippingAddress: meta.shippingAddress || "",
        items,
        totalPrice: intent.amount / 100,
        status: "paid",
      })
      .returning();

    res.json({ order: { ...order, createdAt: order.createdAt.toISOString() } });
  } catch (err: any) {
    console.error("Stripe confirm-order error:", err);
    res.status(500).json({ error: err.message || "Failed to confirm order" });
  }
});

export default router;
