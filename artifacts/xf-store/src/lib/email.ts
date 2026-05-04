const API_BASE = "/api";

async function post(path: string, body: object) {
  try {
    await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.error("Email send failed:", err);
  }
}

async function postJson(path: string, body: object): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return await res.json();
  } catch (err) {
    return { ok: false, error: "Network error" };
  }
}

export async function sendOtp(email: string): Promise<{ ok: boolean; error?: string }> {
  return postJson("/email/send-otp", { email });
}

export async function verifyOtp(email: string, code: string): Promise<{ ok: boolean; error?: string }> {
  return postJson("/email/verify-otp", { email, code });
}

export async function sendOrderConfirmation(params: {
  customerEmail: string;
  customerName: string;
  orderId: string;
  total: number;
  shippingAddress: string;
  items: { name: string; size: string; quantity: number; price: number }[];
  workerEmails?: string[];
}) {
  await post("/email/order", params);
}

export async function sendOrderNotificationToStaff(params: {
  customerEmail: string;
  customerName: string;
  orderId: string;
  total: number;
  shippingAddress: string;
  items: { name: string; size: string; quantity: number; price: number }[];
  workerEmails?: string[];
}) {
  await post("/email/order", params);
}

export async function sendTicketNotificationToStaff(params: {
  customerEmail: string;
  customerName: string;
  subject: string;
  message: string;
  workerEmails?: string[];
}) {
  await post("/email/ticket", params);
}
