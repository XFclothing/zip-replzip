import { Router } from "express";
import { db, ordersTable } from "@workspace/db";

const router = Router();

function getPayPalBaseUrl() {
  const mode = process.env.PAYPAL_MODE || "sandbox";
  return mode === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET are required");
  }

  const base = getPayPalBaseUrl();
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = await res.json() as any;
  if (!data.access_token) {
    throw new Error("Failed to get PayPal access token");
  }
  return data.access_token;
}

// POST /api/paypal/create-order
router.post("/paypal/create-order", async (req, res): Promise<void> => {
  try {
    const { items, shippingAddress, email, customerName, userId } = req.body;

    if (!items || items.length === 0) {
      res.status(400).json({ error: "Cart is empty" });
      return;
    }

    const totalAmount = items
      .reduce((sum: number, item: any) => sum + item.price * item.quantity, 0)
      .toFixed(2);

    const accessToken = await getPayPalAccessToken();
    const base = getPayPalBaseUrl();

    const response = await fetch(`${base}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: "EUR",
              value: totalAmount,
              breakdown: {
                item_total: { currency_code: "EUR", value: totalAmount },
              },
            },
            items: items.map((item: any) => ({
              name: item.name,
              unit_amount: {
                currency_code: "EUR",
                value: item.price.toFixed(2),
              },
              quantity: String(item.quantity),
              description: item.size ? `Size: ${item.size}` : undefined,
            })),
            custom_id: JSON.stringify({
              userId: userId || "",
              customerName: customerName || "",
              shippingAddress: shippingAddress || "",
              email: email || "",
              itemsJson: JSON.stringify(
                items.map((i: any) => ({
                  name: i.name,
                  price: i.price,
                  quantity: i.quantity,
                  size: i.size,
                }))
              ),
            }),
          },
        ],
      }),
    });

    const order = await response.json() as any;
    res.json({ id: order.id });
  } catch (err: any) {
    console.error("PayPal create-order error:", err);
    res.status(500).json({ error: err.message || "Failed to create PayPal order" });
  }
});

// POST /api/paypal/capture-order
router.post("/paypal/capture-order", async (req, res): Promise<void> => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      res.status(400).json({ error: "Missing orderId" });
      return;
    }

    const accessToken = await getPayPalAccessToken();
    const base = getPayPalBaseUrl();

    const response = await fetch(`${base}/v2/checkout/orders/${orderId}/capture`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const capture = await response.json() as any;

    if (capture.status !== "COMPLETED") {
      res.status(402).json({ error: "PayPal payment not completed" });
      return;
    }

    const unit = capture.purchase_units?.[0];
    const customId = unit?.custom_id || "{}";
    let meta: any = {};
    try {
      meta = JSON.parse(customId);
    } catch {}

    let items: any[] = [];
    try {
      items = JSON.parse(meta.itemsJson || "[]");
    } catch {}

    const amount = parseFloat(unit?.payments?.captures?.[0]?.amount?.value || "0");

    const [order] = await db
      .insert(ordersTable)
      .values({
        userId: meta.userId || null,
        customerName: meta.customerName || "",
        email: meta.email || "",
        shippingAddress: meta.shippingAddress || "",
        items,
        totalPrice: amount,
        status: "paid",
      })
      .returning();

    res.json({ order: { ...order, createdAt: order.createdAt.toISOString() } });
  } catch (err: any) {
    console.error("PayPal capture-order error:", err);
    res.status(500).json({ error: err.message || "Failed to capture PayPal order" });
  }
});

export default router;
