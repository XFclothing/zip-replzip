import { Router } from "express";
import nodemailer from "nodemailer";

const router = Router();

const GMX_EMAIL = process.env.GMX_EMAIL || "xfclothing@gmx.de";
const GMX_PASSWORD = process.env.GMX_PASSWORD || "";

const STAFF_EMAILS = ["xfclothing@gmx.de", "xaviermalucha@gmail.com"];
const FROM = `XF Clothing <${GMX_EMAIL}>`;

function createTransport() {
  return nodemailer.createTransport({
    host: "mail.gmx.net",
    port: 465,
    secure: true,
    auth: { user: GMX_EMAIL, pass: GMX_PASSWORD },
  });
}

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
    await createTransport().sendMail({
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
  const transport = createTransport();

  try {
    const itemsHtml = (items || [])
      .map(
        (i: any) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);color:rgba(255,255,255,0.75);font-size:13px;">${i.name}</td>
          <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);color:rgba(255,255,255,0.4);font-size:12px;text-align:center;">${i.size}</td>
          <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);color:rgba(255,255,255,0.4);font-size:12px;text-align:center;">×${i.quantity}</td>
          <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);color:#fff;font-size:13px;text-align:right;">€${(i.price * i.quantity).toFixed(2)}</td>
        </tr>`
      )
      .join("");

    const customerHtml = `
<div style="background:#000;color:#fff;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;padding:0;margin:0;">
  <div style="max-width:520px;margin:0 auto;padding:56px 40px;">
    <p style="font-size:10px;letter-spacing:6px;text-transform:uppercase;color:rgba(255,255,255,0.25);margin:0 0 48px;">XF — Order Confirmed</p>

    <h1 style="font-size:28px;font-weight:700;letter-spacing:4px;text-transform:uppercase;color:#fff;margin:0 0 8px;">Thank You${customerName ? ", " + customerName : ""}.</h1>
    <p style="font-size:13px;color:rgba(255,255,255,0.45);margin:0 0 40px;line-height:1.7;">Your order has been received. We'll be in touch to confirm shipment.</p>

    <div style="border:1px solid rgba(255,255,255,0.08);padding:24px;margin-bottom:24px;">
      <p style="font-size:10px;letter-spacing:4px;text-transform:uppercase;color:rgba(255,255,255,0.25);margin:0 0 16px;">Order Details</p>
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr>
            <th style="font-size:9px;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.2);text-align:left;padding-bottom:10px;border-bottom:1px solid rgba(255,255,255,0.08);">Item</th>
            <th style="font-size:9px;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.2);text-align:center;padding-bottom:10px;border-bottom:1px solid rgba(255,255,255,0.08);">Size</th>
            <th style="font-size:9px;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.2);text-align:center;padding-bottom:10px;border-bottom:1px solid rgba(255,255,255,0.08);">Qty</th>
            <th style="font-size:9px;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.2);text-align:right;padding-bottom:10px;border-bottom:1px solid rgba(255,255,255,0.08);">Price</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      <div style="display:flex;justify-content:space-between;margin-top:16px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.08);">
        <span style="font-size:10px;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.3);">Total</span>
        <span style="font-size:18px;font-weight:700;color:#fff;">€${Number(total).toFixed(2)}</span>
      </div>
    </div>

    <div style="border:1px solid rgba(255,255,255,0.08);padding:24px;margin-bottom:40px;">
      <p style="font-size:10px;letter-spacing:4px;text-transform:uppercase;color:rgba(255,255,255,0.25);margin:0 0 8px;">Shipping To</p>
      <p style="font-size:13px;color:rgba(255,255,255,0.6);margin:0;line-height:1.6;">${shippingAddress}</p>
    </div>

    <p style="font-size:10px;letter-spacing:4px;text-transform:uppercase;color:rgba(255,255,255,0.15);margin:0 0 4px;">Order Reference</p>
    <p style="font-size:11px;color:rgba(255,255,255,0.25);margin:0 0 48px;font-family:monospace;">#${String(orderId).slice(0, 8).toUpperCase()}</p>

    <p style="font-size:10px;letter-spacing:4px;text-transform:uppercase;color:rgba(255,255,255,0.15);margin:0;">XF by Xavier &amp; Fynn</p>
  </div>
</div>`;

    const staffHtml = `
<div style="background:#0a0a0a;color:#fff;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;padding:0;margin:0;">
  <div style="max-width:520px;margin:0 auto;padding:48px 40px;">
    <p style="font-size:10px;letter-spacing:6px;text-transform:uppercase;color:rgba(255,255,255,0.2);margin:0 0 32px;">XF — New Order</p>

    <h1 style="font-size:22px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#fff;margin:0 0 6px;">New Order Received</h1>
    <p style="font-size:13px;color:rgba(255,255,255,0.4);margin:0 0 32px;line-height:1.6;">A customer has placed a new order.</p>

    <div style="border:1px solid rgba(255,255,255,0.08);padding:20px 24px;margin-bottom:16px;">
      <p style="font-size:9px;letter-spacing:4px;text-transform:uppercase;color:rgba(255,255,255,0.2);margin:0 0 12px;">Customer</p>
      <p style="font-size:14px;color:#fff;margin:0 0 4px;font-weight:600;">${customerName}</p>
      <p style="font-size:12px;color:rgba(255,255,255,0.45);margin:0;">${customerEmail}</p>
    </div>

    <div style="border:1px solid rgba(255,255,255,0.08);padding:20px 24px;margin-bottom:16px;">
      <p style="font-size:9px;letter-spacing:4px;text-transform:uppercase;color:rgba(255,255,255,0.2);margin:0 0 14px;">Items</p>
      <table style="width:100%;border-collapse:collapse;">
        ${(items || []).map((i: any) => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);color:rgba(255,255,255,0.75);font-size:13px;">${i.name}</td>
          <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);color:rgba(255,255,255,0.35);font-size:12px;text-align:center;">${i.size}</td>
          <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);color:rgba(255,255,255,0.35);font-size:12px;text-align:center;">×${i.quantity}</td>
          <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);color:#fff;font-size:13px;text-align:right;">€${(i.price * i.quantity).toFixed(2)}</td>
        </tr>`).join("")}
      </table>
      <div style="margin-top:14px;padding-top:14px;border-top:1px solid rgba(255,255,255,0.08);display:flex;justify-content:space-between;">
        <span style="font-size:9px;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.3);">Total</span>
        <span style="font-size:16px;font-weight:700;color:#fff;">€${Number(total).toFixed(2)}</span>
      </div>
    </div>

    <div style="border:1px solid rgba(255,255,255,0.08);padding:20px 24px;margin-bottom:32px;">
      <p style="font-size:9px;letter-spacing:4px;text-transform:uppercase;color:rgba(255,255,255,0.2);margin:0 0 8px;">Ship To</p>
      <p style="font-size:13px;color:rgba(255,255,255,0.55);margin:0;line-height:1.6;">${shippingAddress}</p>
    </div>

    <p style="font-size:9px;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.15);margin:0 0 3px;">Order Ref</p>
    <p style="font-size:11px;color:rgba(255,255,255,0.2);margin:0 0 40px;font-family:monospace;">#${String(orderId).slice(0, 8).toUpperCase()}</p>

    <p style="font-size:9px;letter-spacing:4px;text-transform:uppercase;color:rgba(255,255,255,0.12);margin:0;">XF by Xavier &amp; Fynn</p>
  </div>
</div>`;

    await Promise.all([
      transport.sendMail({
        from: FROM,
        to: customerEmail,
        subject: "Order Confirmed — XF Clothing",
        html: customerHtml,
      }),
      ...allStaff.map((email) =>
        transport.sendMail({
          from: FROM,
          to: email,
          subject: `New Order — ${customerName}`,
          html: staffHtml,
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
  const transport = createTransport();

  try {
    await Promise.all(
      allStaff.map((email) =>
        transport.sendMail({
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

router.post("/email/newsletter-confirm", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ ok: false, error: "Email required" });
    return;
  }
  try {
    await createTransport().sendMail({
      from: FROM,
      to: email,
      subject: "XF — You're on the list",
      html: `<div style="background:#000;color:#fff;font-family:sans-serif;padding:48px 32px;max-width:480px;margin:0 auto;">
  <h2 style="font-size:11px;letter-spacing:6px;text-transform:uppercase;color:rgba(255,255,255,0.4);margin:0 0 32px;">XF — Unseen Collection</h2>
  <p style="font-size:15px;font-weight:700;color:#fff;margin:0 0 16px;letter-spacing:2px;text-transform:uppercase;">You're on the list.</p>
  <p style="font-size:13px;color:rgba(255,255,255,0.6);margin:0 0 32px;line-height:1.8;">You'll be the first to know when the XF Unseen Collection drops.<br><br>Stay close.</p>
  <p style="font-size:11px;color:rgba(255,255,255,0.2);letter-spacing:2px;text-transform:uppercase;margin:0;">XF by Xavier &amp; Fynn</p>
</div>`,
    });
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.post("/email/notify-subscribers", async (req, res) => {
  const { subject, message } = req.body;
  if (!subject || !message) {
    res.status(400).json({ ok: false, error: "Subject and message required" });
    return;
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    res.status(500).json({ ok: false, error: "Supabase config missing" });
    return;
  }

  try {
    const dbRes = await fetch(`${supabaseUrl}/rest/v1/notify_emails?select=email`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    });
    const rows: { email: string }[] = await dbRes.json();

    if (!rows || rows.length === 0) {
      res.json({ ok: true, sent: 0 });
      return;
    }

    const emails = rows.map((r) => r.email);
    const htmlBody = `<div style="background:#000;color:#fff;font-family:sans-serif;padding:48px 32px;max-width:480px;margin:0 auto;">
  <h2 style="font-size:11px;letter-spacing:6px;text-transform:uppercase;color:rgba(255,255,255,0.4);margin:0 0 32px;">XF — Notification</h2>
  <p style="font-size:15px;font-weight:700;color:#fff;margin:0 0 16px;letter-spacing:2px;text-transform:uppercase;">${subject}</p>
  <p style="font-size:13px;color:rgba(255,255,255,0.6);margin:0 0 32px;line-height:1.8;white-space:pre-line;">${message}</p>
  <p style="font-size:11px;color:rgba(255,255,255,0.2);letter-spacing:2px;text-transform:uppercase;margin:0;">XF by Xavier &amp; Fynn</p>
</div>`;

    const transport = createTransport();
    await Promise.all(
      emails.map((to) =>
        transport.sendMail({ from: FROM, to, subject: `XF — ${subject}`, html: htmlBody })
      )
    );

    await fetch(`${supabaseUrl}/rest/v1/notify_emails?id=gte.0`, {
      method: "DELETE",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    });

    res.json({ ok: true, sent: emails.length });
  } catch (err: any) {
    console.error("Notify subscribers error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
