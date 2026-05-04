import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { CheckCircle, Loader2 } from "lucide-react";
import { useCart } from "@/context/CartContext";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function CheckoutSuccess() {
  const [, navigate] = useLocation();
  const { clearCart } = useCart();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const method = params.get("method");

    // Pending / PayPal — order already confirmed before redirect
    if (method === "paypal" || method === "pending") {
      clearCart();
      setStatus("success");
      return;
    }

    // Stripe Checkout Session flow
    const sessionId = params.get("session_id");

    if (!sessionId) {
      setStatus("error");
      return;
    }

    fetch(`${BASE}/api/stripe/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ sessionId }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.order) {
          setOrderId(data.order.id);
          clearCart();
          setStatus("success");
        } else {
          setStatus("error");
        }
      })
      .catch(() => setStatus("error"));
  }, []);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-foreground/40 animate-spin" />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-foreground/50 text-xs uppercase tracking-[0.4em] mb-4">Something went wrong</p>
          <p className="text-foreground/30 text-xs mb-8">Your payment may have been processed. Check your email for confirmation.</p>
          <button onClick={() => navigate("/")} className="text-foreground text-xs uppercase tracking-widest underline">
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-md"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.4, delay: 0.2, type: "spring" }}
          className="mb-8 flex justify-center"
        >
          <CheckCircle className="w-16 h-16 text-foreground" strokeWidth={1} />
        </motion.div>

        <p className="text-[10px] uppercase tracking-[0.5em] text-foreground/30 mb-3">Order Confirmed</p>
        <h1 className="text-3xl font-bold uppercase tracking-widest text-foreground mb-4">Thank You</h1>
        <p className="text-foreground/40 text-sm leading-relaxed mb-2">
          Your payment was successful. You'll receive a confirmation email shortly.
        </p>
        {orderId && (
          <p className="text-foreground/20 text-[10px] uppercase tracking-widest mb-10">
            Order #{orderId.slice(0, 8).toUpperCase()}
          </p>
        )}

        <div className="flex flex-col gap-3 items-center">
          <button
            onClick={() => navigate("/account")}
            className="bg-foreground text-background px-8 py-3 text-xs uppercase tracking-[0.4em] font-semibold hover:bg-foreground/90 transition-colors"
          >
            View Orders
          </button>
          <button
            onClick={() => navigate("/shop")}
            className="text-foreground/40 text-xs uppercase tracking-widest hover:text-foreground/70 transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </motion.div>
    </div>
  );
}
