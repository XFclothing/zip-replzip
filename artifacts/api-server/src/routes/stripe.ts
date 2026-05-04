import { Router } from "express";
import Stripe from "stripe";
import { db, ordersTable } from "@workspace/db";

const router = Router();

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key, { apiVersion: "2025-04-30.basil" });
}

function getBaseUrl() {
  const domains = process.env.REPLIT_DOMAINS;
  if (domains) return `https://${domains.split(",")[0]}`;
  return "http://localhost:3000";
}

// POST /api/stripe/checkout — create a Stripe Checkout session
router.post("/stripe/checkout", async (req, res): Promise<void> => {
  try {
    const stripe = getStripe();
    const { items, shippingAddress, email, customerName } = req.body;

    if (!items || items.length === 0) {
      res.status(400).json({ error: "Cart is empty" });
      return;
    }

    const base = getBaseUrl();

    const lineItems = items.map((item: any) => ({
      price_data: {
        currency: "eur",
        product_data: {
          name: item.name,
          ...(item.image ? { images: [] } : {}),
          metadata: { size: item.size },
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card", "klarna", "paypal"],
      line_items: lineItems,
      mode: "payment",
      customer_email: email || undefined,
      billing_address_collection: "auto",
      success_url: `${base}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/checkout`,
      metadata: {
        shippingAddress: shippingAddress || "",
        customerName: customerName || "",
        userId: req.session?.userId || "",
      },
    });

    res.json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe checkout error:", err);
    res.status(500).json({ error: err.message || "Failed to create checkout session" });
  }
});

// POST /api/stripe/verify — verify completed session and save order
router.post("/stripe/verify", async (req, res): Promise<void> => {
  try {
    const stripe = getStripe();
    const { sessionId } = req.body;

    if (!sessionId) {
      res.status(400).json({ error: "Missing sessionId" });
      return;
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items"],
    });

    if (session.payment_status !== "paid") {
      res.status(402).json({ error: "Payment not completed" });
      return;
    }

    const items = session.line_items?.data.map((li) => ({
      name: li.description || "",
      price: (li.amount_total || 0) / 100 / (li.quantity || 1),
      quantity: li.quantity || 1,
      size: "",
    })) || [];

    const [order] = await db.insert(ordersTable).values({
      userId: session.metadata?.userId || null,
      customerName: session.metadata?.customerName || session.customer_details?.name || "",
      email: session.customer_email || "",
      shippingAddress: session.metadata?.shippingAddress || "",
      items,
      totalPrice: (session.amount_total || 0) / 100,
      status: "paid",
    }).returning();

    res.json({ order: { ...order, createdAt: order.createdAt.toISOString() } });
  } catch (err: any) {
    console.error("Stripe verify error:", err);
    res.status(500).json({ error: err.message || "Failed to verify session" });
  }
});

export default router;
