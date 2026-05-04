import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { Check, CreditCard, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { supabase } from "@/lib/supabase";

type ShippingAddress = {
  id: string;
  label: string | null;
  address: string;
  is_default: boolean;
};

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function apiPost(path: string, body: unknown) {
  const res = await fetch(`${BASE}/api${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  return res.json();
}

export default function Checkout() {
  const { user, profile } = useAuth();
  const { items, totalPrice } = useCart();
  const [, navigate] = useLocation();

  const [savedAddresses, setSavedAddresses] = useState<ShippingAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | "new">("new");
  const [customAddress, setCustomAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) {
    navigate("/login?redirect=/checkout");
    return null;
  }

  useEffect(() => {
    supabase
      .from("shipping_addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        const addrs = (data as ShippingAddress[]) || [];
        setSavedAddresses(addrs);
        const def = addrs.find((a) => a.is_default);
        if (def) setSelectedAddressId(def.id);
      });
  }, [user]);

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-foreground/40 text-xs uppercase tracking-[0.4em] mb-4">Your cart is empty</p>
          <button onClick={() => navigate("/shop")} className="text-foreground text-xs uppercase tracking-widest underline">
            Go to Shop
          </button>
        </div>
      </div>
    );
  }

  const finalAddress =
    selectedAddressId === "new"
      ? customAddress.trim()
      : savedAddresses.find((a) => a.id === selectedAddressId)?.address || "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!finalAddress) { setError("Please enter or select a shipping address."); return; }

    setSubmitting(true);
    setError(null);

    // Save new address to account if typed manually
    if (selectedAddressId === "new" && customAddress.trim()) {
      await supabase.from("shipping_addresses").insert({
        user_id: user!.id,
        label: null,
        address: customAddress.trim(),
        is_default: savedAddresses.length === 0,
      });
    }

    const data = await apiPost("/stripe/checkout", {
      items: items.map((i) => ({
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        size: i.size,
        image: i.image,
      })),
      shippingAddress: finalAddress,
      email: profile?.email || user!.email || "",
      customerName: profile?.name || "",
      userId: user!.id,
    });

    if (data.url) {
      window.location.href = data.url;
    } else {
      setError(data.error || "Failed to start checkout. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background pt-28 pb-24">
      <div className="container mx-auto px-6 lg:px-12 max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <p className="text-[10px] uppercase tracking-[0.5em] text-foreground/30 mb-2">Checkout</p>
          <h1 className="text-4xl font-bold uppercase tracking-widest text-foreground mb-12">Complete Order</h1>

          <div className="grid gap-10">

            {/* Order Summary */}
            <div className="border border-foreground/8 p-6">
              <h2 className="text-xs uppercase tracking-[0.4em] text-foreground/40 mb-5">Order Summary</h2>
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={`${item.productId}-${item.size}`} className="flex items-center gap-4">
                    <div className="w-14 h-16 bg-foreground/5 flex-shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-foreground">{item.name}</p>
                      <p className="text-xs text-foreground/40 uppercase tracking-widest">Size: {item.size} · Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm text-foreground">€{(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center border-t border-foreground/8 mt-6 pt-6">
                <span className="text-xs uppercase tracking-[0.35em] text-foreground/50">Total</span>
                <span className="text-xl font-bold text-foreground">€{totalPrice.toFixed(2)}</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Customer Info */}
              <div className="border border-foreground/8 p-6">
                <h2 className="text-xs uppercase tracking-[0.4em] text-foreground/40 mb-5">Customer Info</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.4em] text-foreground/30 mb-2">Name</label>
                    <div className="bg-foreground/5 border border-foreground/8 px-4 py-3 text-sm text-foreground/60">{profile?.name}</div>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.4em] text-foreground/30 mb-2">Email</label>
                    <div className="bg-foreground/5 border border-foreground/8 px-4 py-3 text-sm text-foreground/60 truncate">{profile?.email}</div>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="border border-foreground/8 p-6">
                <h2 className="text-xs uppercase tracking-[0.4em] text-foreground/40 mb-5">Shipping Address</h2>

                {savedAddresses.length > 0 && (
                  <div className="space-y-2 mb-5">
                    {savedAddresses.map((addr) => (
                      <button
                        key={addr.id}
                        type="button"
                        onClick={() => setSelectedAddressId(addr.id)}
                        className={`w-full text-left p-4 border transition-colors flex items-start gap-3 ${
                          selectedAddressId === addr.id
                            ? "border-foreground/40 bg-foreground/5"
                            : "border-foreground/10 hover:border-foreground/25"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full border flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
                          selectedAddressId === addr.id ? "border-white bg-foreground" : "border-foreground/30"
                        }`}>
                          {selectedAddressId === addr.id && <Check className="w-2.5 h-2.5 text-background" strokeWidth={3} />}
                        </div>
                        <div>
                          {addr.label && (
                            <p className="text-[10px] uppercase tracking-[0.4em] text-foreground/50 mb-1">{addr.label}</p>
                          )}
                          <p className="text-sm text-foreground/75 leading-relaxed">{addr.address}</p>
                        </div>
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => setSelectedAddressId("new")}
                      className={`w-full text-left p-4 border transition-colors flex items-center gap-3 ${
                        selectedAddressId === "new"
                          ? "border-foreground/40 bg-foreground/5"
                          : "border-foreground/10 hover:border-foreground/25"
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border flex-shrink-0 flex items-center justify-center transition-colors ${
                        selectedAddressId === "new" ? "border-white bg-foreground" : "border-foreground/30"
                      }`}>
                        {selectedAddressId === "new" && <Check className="w-2.5 h-2.5 text-background" strokeWidth={3} />}
                      </div>
                      <span className="text-xs uppercase tracking-[0.35em] text-foreground/50">Use a different address</span>
                    </button>
                  </div>
                )}

                {selectedAddressId === "new" && (
                  <textarea
                    value={customAddress}
                    onChange={(e) => setCustomAddress(e.target.value)}
                    placeholder="Street address, City, ZIP Code, Country"
                    rows={3}
                    required
                    className="w-full bg-foreground/5 border border-foreground/10 text-foreground placeholder-foreground/20 px-4 py-3 text-sm outline-none focus:border-foreground/30 transition-colors resize-none"
                  />
                )}
              </div>

              {/* Payment Methods */}
              <div className="border border-foreground/8 p-6">
                <h2 className="text-xs uppercase tracking-[0.4em] text-foreground/40 mb-5">Payment</h2>
                <div className="flex flex-wrap gap-3 items-center">
                  <div className="flex items-center gap-2 bg-foreground/5 border border-foreground/10 px-3 py-2">
                    <CreditCard className="w-4 h-4 text-foreground/60" />
                    <span className="text-xs text-foreground/60 uppercase tracking-wider">Card</span>
                  </div>
                  <div className="flex items-center gap-2 bg-foreground/5 border border-foreground/10 px-3 py-2">
                    <span className="text-xs font-bold text-[#FFB3C7]">K</span>
                    <span className="text-xs text-foreground/60 uppercase tracking-wider">Klarna</span>
                  </div>
                  <div className="flex items-center gap-2 bg-foreground/5 border border-foreground/10 px-3 py-2">
                    <span className="text-xs font-bold text-[#009CDE]">P</span>
                    <span className="text-xs text-foreground/60 uppercase tracking-wider">PayPal</span>
                  </div>
                  <div className="flex items-center gap-2 bg-foreground/5 border border-foreground/10 px-3 py-2">
                    <span className="text-xs text-foreground/60 uppercase tracking-wider"> Pay</span>
                  </div>
                </div>
                <p className="text-[10px] text-foreground/25 mt-3 tracking-wider">You will be redirected to Stripe's secure checkout to complete payment.</p>
              </div>

              {error && <p className="text-red-400/80 text-xs tracking-wide">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-foreground text-background py-4 text-xs uppercase tracking-[0.4em] font-semibold hover:bg-foreground/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Redirecting to Stripe...
                  </>
                ) : (
                  `Pay · €${totalPrice.toFixed(2)}`
                )}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
