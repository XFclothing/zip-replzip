import { Router } from "express";
import { Resend } from "resend";

const router = Router();
const resend = new Resend(process.env.RESEND_API_KEY);

const STAFF_EMAILS = ["xfclothing@gmx.de", "xaviermalucha@gmail.com"];
const FROM = "XF Store <onboarding@resend.dev>";

const otpStore = new Map<string, { code: string; expires: number }>();

function generateOtp(): string {
  return String(Math.floor(10000000 + Math.random() * 90000000));
}

router.post("/email/send-otp", async (req, res) => {
  const { email } = req.body;
  if (!email || typeof email !== "string") {
    res.status(400).json({ ok: false, error: "Email required" });
    return;
  }
  const code = generateOtp();
  otpStore.set(email.toLowerCase(), { code, expires: Date.now() + 5 * 60 * 1000 });

  try {
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: "XF — Verification Code",
      html: `<div style="background:#000;color:#fff;font-family:sans-serif;padding:48px 32px;max-width:480px;margin:0 auto;">
  <h2 style="font-size:11px;letter-spacing:6px;text-transform:uppercase;color:rgba(255,255,255,0.4);margin:0 0 32px;">XF — Email Verification</h2>
  <p style="font-size:13px;color:rgba(255,255,255,0.6);margin:0 0 24px;line-height:1.6;">Enter the code below to verify your account.</p>
  <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);padding:24px;text-align:center;margin:0 0 32px;">
    <span style="font-size:40px;font-weight:700;letter-spacing:16px;color:#fff;">${code}</span>
  </div>
  <p style="font-size:11px;color:rgba(255,255,255,0.25);letter-spacing:2px;text-transform:uppercase;margin:0;">This code expires in 5 minutes · Do not share it</p>
</div>`,
    });
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.post("/email/verify-otp", async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    res.status(400).json({ ok: false, error: "Email and code required" });
    return;
  }
  const key = email.toLowerCase();
  const entry = otpStore.get(key);
  if (!entry) {
    res.status(400).json({ ok: false, error: "No code found. Request a new one." });
    return;
  }
  if (Date.now() > entry.expires) {
    otpStore.delete(key);
    res.status(400).json({ ok: false, error: "Code expired. Request a new one." });
    return;
  }
  if (entry.code !== String(code)) {
    res.status(400).json({ ok: false, error: "Wrong code." });
    return;
  }
  otpStore.delete(key);
  res.json({ ok: true });
});

router.post("/email/order", async (req, res) => {
  const { customerEmail, customerName, orderId, total, shippingAddress, items, workerEmails } = req.body;

  const itemsList = (items || [])
    .map((i: any) => `${i.name} (${i.size}) x${i.quantity} — €${(i.price * i.quantity).toFixed(2)}`)
    .join("\n");

  const allStaff = [...new Set([...STAFF_EMAILS, ...(workerEmails || [])])];

  try {
    await Promise.all([
      resend.emails.send({
        from: FROM,
        to: customerEmail,
        subject: "Order Confirmed — XF Store",
        text: `Hey ${customerName},\n\nyour order has been received!\n\nOrder #${orderId}\nTotal: €${Number(total).toFixed(2)}\nShipping address: ${shippingAddress}\n\nItems:\n${itemsList}\n\nThank you for your purchase!\n— XF Store`,
      }),
      ...allStaff.map((email) =>
        resend.emails.send({
          from: FROM,
          to: email,
          subject: `New Order — ${customerName}`,
          text: `A new order has been placed!\n\nCustomer: ${customerName} (${customerEmail})\nOrder #${orderId}\nTotal: €${Number(total).toFixed(2)}\nShipping address: ${shippingAddress}\n\nItems:\n${itemsList}`,
        })
      ),
    ]);
    res.json({ ok: true });
  } catch (err: any) {
    console.error("Email error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.post("/email/ticket", async (req, res) => {
  const { customerEmail, customerName, subject, message, workerEmails } = req.body;

  const allStaff = [...new Set([...STAFF_EMAILS, ...(workerEmails || [])])];

  try {
    await Promise.all(
      allStaff.map((email) =>
        resend.emails.send({
          from: FROM,
          to: email,
          subject: `New Support Ticket — ${subject}`,
          text: `A new support ticket has been opened!\n\nFrom: ${customerName} (${customerEmail})\nSubject: ${subject}\n\nMessage:\n${message}`,
        })
      )
    );
    res.json({ ok: true });
  } catch (err: any) {
    console.error("Email error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
